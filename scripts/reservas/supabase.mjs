import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..", "..");
const envLocalPath = join(rootDir, "frontend", ".env.local");

// La aplicación y sus dependencias viven en frontend/ (AGENTS.md §2).
const requireFromFrontend = createRequire(join(rootDir, "frontend", "package.json"));
const { createClient } = requireFromFrontend("@supabase/supabase-js");

/**
 * Carga las variables de frontend/.env.local en process.env si aún no están
 * definidas en el proceso actual.
 */
export function cargarEntornoLocal() {
  if (!existsSync(envLocalPath)) return;

  const contenido = readFileSync(envLocalPath, "utf8");
  for (const linea of contenido.split(/\r?\n/)) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;

    const idx = limpia.indexOf("=");
    if (idx === -1) continue;

    const clave = limpia.slice(0, idx).trim();
    let valor = limpia.slice(idx + 1).trim();

    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    if (!(clave in process.env)) {
      process.env[clave] = valor;
    }
  }
}

/**
 * Verifica si las credenciales públicas de Supabase están configuradas
 * con valores reales (distintos a los de frontend/.env.example).
 */
export function tieneCredencialesSupabase() {
  cargarEntornoLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return (
    Boolean(url && anonKey) &&
    !url.includes("tu-proyecto.supabase.co") &&
    anonKey !== "tu-anon-key-publica"
  );
}

/**
 * Cliente Supabase con clave pública (anon) o con token de sesión de usuario
 * (cliente o administrador autenticado). Respeta todas las políticas RLS.
 *
 * @param {string} [accessToken] JWT de la sesión activa en Supabase Auth
 */
export function crearClienteSupabase(accessToken) {
  cargarEntornoLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en frontend/.env.local",
    );
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

/**
 * Cliente Supabase privilegiado (service_role).
 * Solo para operaciones de servidor/administración que deban omitir RLS.
 * Prohibido exponer esta clave al navegador (AGENTS.md §4.4).
 */
export function crearClienteSupabaseAdmin() {
  cargarEntornoLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en frontend/.env.local",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/* ==========================================================================
 * Control de concurrencia, idempotencia y normalización de errores de BD
 * ========================================================================== */

let colaCalendario = Promise.resolve();
const solicitudesEnVuelo = new Map();
const VENTANA_IDEMPOTENCIA_MS = 5000;

/**
 * Serializa operaciones de escritura sobre el calendario del salón para
 * impedir condiciones de carrera entre dos peticiones simultáneas en el
 * mismo proceso antes de llegar a la restricción GiST de PostgreSQL.
 */
export function ejecutarEnSeccionCriticaCalendario(tarea) {
  const ejecucion = colaCalendario.then(() => tarea());
  colaCalendario = ejecucion.catch(() => undefined);
  return ejecucion;
}

/**
 * Evita que el mismo cliente dispare dos veces seguidas la misma solicitud
 * (doble clic o reintento inmediato en paralelo).
 */
export function verificarYRegistrarIdempotencia(huella) {
  const ahora = Date.now();
  for (const [k, ts] of solicitudesEnVuelo.entries()) {
    if (ahora - ts > VENTANA_IDEMPOTENCIA_MS) {
      solicitudesEnVuelo.delete(k);
    }
  }

  const ultimoEnvio = solicitudesEnVuelo.get(huella);
  if (ultimoEnvio && ahora - ultimoEnvio <= VENTANA_IDEMPOTENCIA_MS) {
    throw new Error(
      "Tu solicitud ya se está procesando. Espera unos segundos antes de volver a intentarlo.",
    );
  }

  solicitudesEnVuelo.set(huella, ahora);
  return () => {
    solicitudesEnVuelo.delete(huella);
  };
}

/**
 * Traduce errores internos de PostgreSQL / Supabase (como 23P01 exclusion_violation
 * cuando dos usuarios reservan en el mismo milisegundo) a mensajes seguros
 * para el usuario sin exponer nombres internos de constraints ni tablas.
 */
export function normalizarErrorReserva(error, mensajePorDefecto = "No se pudo procesar la operación de reserva.") {
  if (!error) return new Error(mensajePorDefecto);

  const codigo = error.code || "";
  const mensaje = String(error.message || error || "").trim();

  if (
    codigo === "23P01" ||
    mensaje.includes("reservas_fecha_hora_inicio_fecha_hora_fin_excl") ||
    mensaje.includes("conflicting key value violates exclusion constraint")
  ) {
    return new Error(
      "Ese horario acaba de ser reservado por otra persona. Por favor elige otro horario.",
    );
  }

  if (codigo === "42501" || mensaje.includes("row-level security policy")) {
    return new Error(
      "No tienes permisos suficientes o tu sesión expiró para realizar esta acción.",
    );
  }

  return new Error(mensaje || mensajePorDefecto);
}

/**
 * Convierte fecha (YYYY-MM-DD) y hora (HH:MM) en timestamp ISO con la zona
 * horaria del negocio: America/Guatemala (UTC-6, sin horario de verano).
 */
export function construirTimestampGuatemala(fecha, hora) {
  const horaNormalizada = hora.length === 5 ? `${hora}:00` : hora;
  return `${fecha}T${horaNormalizada}-06:00`;
}

/* ==========================================================================
 * Mapeadores de filas SQL (snake_case) a objetos del frontend (camelCase)
 * Alineados a frontend/src/types/estudio.ts y migraciones 000004–000029
 * ========================================================================== */

export function mapearServicio(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? null,
    precioPorHora: Number(row.precio_por_hora),
    activo: Boolean(row.activo),
  };
}

export function mapearEquipo(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? null,
    cantidadTotal: Number(row.cantidad_total),
    precioPorHora: Number(row.precio_por_hora),
    activo: Boolean(row.activo),
  };
}

export function mapearReserva(row) {
  return {
    id: row.id,
    clienteId: row.cliente_id ?? null,
    creadoPor: row.creado_por ?? null,
    nombre: row.nombre,
    correo: row.correo,
    telefono: row.telefono,
    fechaHoraInicio: row.fecha_hora_inicio,
    fechaHoraFin: row.fecha_hora_fin,
    estado: row.estado,
    estadoPago: row.estado_pago,
    totalCalculado:
      row.total_calculado !== null && row.total_calculado !== undefined
        ? Number(row.total_calculado)
        : null,
    tarifaHoraAplicada:
      row.tarifa_hora_aplicada !== null && row.tarifa_hora_aplicada !== undefined
        ? Number(row.tarifa_hora_aplicada)
        : null,
    urlComprobantePago: row.url_comprobante_pago ?? null,
    notasCliente: row.notas_cliente ?? null,
    creadoEn: row.creado_en,
  };
}

export function mapearReservaServicio(row) {
  const servicioRel = Array.isArray(row.servicios_estudio)
    ? row.servicios_estudio[0]
    : row.servicios_estudio;

  return {
    reservaId: row.reserva_id,
    servicioId: row.servicio_id,
    precioCongelado: Number(row.precio_congelado),
    nombreServicio: row.nombre ?? servicioRel?.nombre ?? undefined,
  };
}

export function mapearReservaEquipo(row) {
  const equipoRel = Array.isArray(row.inventario_equipos)
    ? row.inventario_equipos[0]
    : row.inventario_equipos;

  return {
    reservaId: row.reserva_id,
    equipoId: row.equipo_id,
    cantidadRentada: Number(row.cantidad_rentada),
    precioCongelado: Number(row.precio_congelado),
    nombreEquipo: row.nombre ?? equipoRel?.nombre ?? undefined,
  };
}

export function mapearFechaBloqueada(row) {
  return {
    id: row.id,
    desde: row.desde,
    hasta: row.hasta,
    horaDesde: row.hora_desde ?? null,
    horaHasta: row.hora_hasta ?? null,
    motivo: row.motivo ?? null,
    creadoPor: row.creado_por,
    creadoEn: row.creado_en,
  };
}

export function mapearConfiguracionEstudio(filas = []) {
  const mapa = new Map(filas.map((f) => [f.clave, f.valor]));
  const tarifaRaw = mapa.get("tarifa_hora");
  const tarifaNum =
    tarifaRaw !== undefined && tarifaRaw !== null && String(tarifaRaw).trim() !== ""
      ? Number(tarifaRaw)
      : null;

  const maxPendRaw = Number(mapa.get("max_pendientes_por_cliente"));

  return {
    tarifaHora: Number.isFinite(tarifaNum) ? tarifaNum : null,
    maxPendientesPorCliente:
      Number.isFinite(maxPendRaw) && maxPendRaw > 0 ? maxPendRaw : 3,
    horaApertura: mapa.get("hora_apertura") || "08:00",
    horaCierre: mapa.get("hora_cierre") || "18:00",
  };
}
