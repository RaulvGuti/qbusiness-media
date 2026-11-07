import {
  construirTimestampGuatemala,
  crearClienteSupabase,
  ejecutarEnSeccionCriticaCalendario,
  mapearConfiguracionEstudio,
  mapearEquipo,
  mapearReserva,
  mapearReservaEquipo,
  mapearReservaServicio,
  mapearServicio,
  normalizarErrorReserva,
  verificarYRegistrarIdempotencia,
} from "./supabase.mjs";

/**
 * ============================================================================
 * MÓDULO CLIENTS — Interacción de los clientes con el panel de reservas
 * ============================================================================
 * Este servicio agrupa todo lo que el cliente (visitante o usuario autenticado
 * en la tabla `clientes`) consulta y ejecuta sobre el estudio:
 *
 *   1. Consume la configuración, tarifas, catálogos y bloqueos publicados
 *      desde el servicio `admin`.
 *   2. Calcula estimados y verifica disponibilidad sin exponer datos personales
 *      de otros clientes (usando la RPC `horarios_ocupados`, 000018).
 *   3. Envía solicitudes de reserva mediante la RPC `solicitar_reserva` (000019),
 *      protegiendo contra condiciones de carrera (mutex + índice GiST 23P01),
 *      doble clic (idempotencia), reservas en fechas pasadas y exceso de stock.
 *   4. Permite al cliente consultar sus propias reservas, subir comprobante de
 *      pago (`estado_pago = 'comprobante_subido'`) o cancelar su reserva
 *      (`estado = 'cancelada'`), respetando el trigger `reservas_update_cliente`
 *      (000029).
 * ============================================================================
 */

const REGEX_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^\d{2}:\d{2}(:\d{2})?$/;

/**
 * Valida y sanea los campos del formulario de reserva antes de abrir una
 * transacción en la base de datos.
 */
export function validarEntradaSolicitudCliente(input) {
  const nombre = String(input?.nombre ?? "").trim();
  const correo = String(input?.correo ?? "").trim();
  const telefono = String(input?.telefono ?? "").trim();
  const fecha = String(input?.fecha ?? "").trim();
  const horaInicio = String(input?.horaInicio ?? "").trim();
  const horaFin = String(input?.horaFin ?? "").trim();
  const notasRaw = input?.notas !== undefined && input?.notas !== null ? String(input.notas).trim() : "";

  if (!nombre) {
    throw new Error("Indica tu nombre completo.");
  }
  if (!correo || !REGEX_CORREO.test(correo)) {
    throw new Error("Indica un correo electrónico válido.");
  }
  if (!telefono) {
    throw new Error("Indica un teléfono o WhatsApp de contacto.");
  }
  if (!REGEX_FECHA.test(fecha)) {
    throw new Error("La fecha debe tener el formato YYYY-MM-DD.");
  }
  if (!REGEX_HORA.test(horaInicio) || !REGEX_HORA.test(horaFin)) {
    throw new Error("Las horas de inicio y fin deben tener el formato HH:MM.");
  }
  if (horaFin.slice(0, 5) <= horaInicio.slice(0, 5)) {
    throw new Error("La hora de fin debe ser posterior a la hora de inicio.");
  }

  const inicioMs = new Date(construirTimestampGuatemala(fecha, horaInicio.slice(0, 5))).getTime();
  const finMs = new Date(construirTimestampGuatemala(fecha, horaFin.slice(0, 5))).getTime();

  if (Number.isNaN(inicioMs) || Number.isNaN(finMs) || finMs <= inicioMs) {
    throw new Error("El rango de fecha y hora seleccionado no es válido.");
  }

  if (inicioMs <= Date.now()) {
    throw new Error("No se puede reservar en una fecha u hora pasada.");
  }

  // Agrupar equipos duplicados y validar cantidades enteras positivas
  const mapaEquipos = new Map();
  for (const item of input?.equipos ?? []) {
    const equipoId = String(item?.equipoId ?? item?.equipo_id ?? "").trim();
    const cantidad = Number(item?.cantidad);

    if (!equipoId || !Number.isInteger(cantidad) || cantidad <= 0) {
      throw new Error("Cada equipo debe indicar un identificador válido y una cantidad entera mayor a 0.");
    }
    mapaEquipos.set(equipoId, (mapaEquipos.get(equipoId) ?? 0) + cantidad);
  }

  const serviciosUnicos = Array.from(
    new Set((input?.servicios ?? []).map((id) => String(id).trim()).filter(Boolean)),
  );

  const equiposAgrupados = Array.from(mapaEquipos.entries()).map(([equipoId, cantidad]) => ({
    equipoId,
    cantidad,
  }));

  return {
    nombre,
    correo,
    telefono,
    fecha,
    horaInicio: horaInicio.slice(0, 5),
    horaFin: horaFin.slice(0, 5),
    notas: notasRaw || null,
    servicios: serviciosUnicos,
    equipos: equiposAgrupados,
  };
}

/**
 * Obtiene los servicios extra activos (`servicios_estudio`).
 */
export async function listarServiciosActivos(supabase = crearClienteSupabase()) {
  const { data, error } = await supabase
    .from("servicios_estudio")
    .select("id, nombre, descripcion, precio_por_hora, activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    throw normalizarErrorReserva(error, "No se pudieron cargar los servicios del estudio.");
  }

  return (data ?? []).map(mapearServicio);
}

/**
 * Obtiene el inventario de equipos rentables activos (`inventario_equipos`).
 */
export async function listarEquiposActivos(supabase = crearClienteSupabase()) {
  const { data, error } = await supabase
    .from("inventario_equipos")
    .select("id, nombre, descripcion, cantidad_total, precio_por_hora, activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    throw normalizarErrorReserva(error, "No se pudo cargar el inventario de equipos.");
  }

  return (data ?? []).map(mapearEquipo);
}

/**
 * Lee los parámetros del estudio configurados por `admin` en `configuracion_sitio`
 * (`tarifa_hora`, `max_pendientes_por_cliente`, `hora_apertura`, `hora_cierre`).
 */
export async function obtenerConfiguracionEstudio(supabase = crearClienteSupabase()) {
  const { data, error } = await supabase
    .from("configuracion_sitio")
    .select("clave, valor")
    .eq("grupo", "estudio");

  if (error) {
    throw normalizarErrorReserva(error, "No se pudo obtener la configuración del estudio.");
  }

  return mapearConfiguracionEstudio(data ?? []);
}

/**
 * Carga en una sola llamada todo el catálogo público que necesita la vista
 * `/renta` del cliente (servicios activos, equipos activos y configuración).
 */
export async function obtenerCatalogoParaCliente(supabase = crearClienteSupabase()) {
  const [servicios, equipos, configuracion] = await Promise.all([
    listarServiciosActivos(supabase),
    listarEquiposActivos(supabase),
    obtenerConfiguracionEstudio(supabase),
  ]);

  return {
    servicios,
    equipos,
    configuracion,
  };
}

/**
 * Consulta la RPC `horarios_ocupados(p_desde, p_hasta)` (migración 000018).
 * Devuelve únicamente intervalos `{ inicio, fin, tipo: 'RESERVA' | 'BLOQUEO' }`
 * sin exponer datos personales de ningún cliente (AGENTS.md §4.5).
 */
export async function obtenerHorariosOcupados(
  { desde, hasta },
  supabase = crearClienteSupabase(),
) {
  const { data, error } = await supabase.rpc("horarios_ocupados", {
    p_desde: desde,
    p_hasta: hasta,
  });

  if (error) {
    throw normalizarErrorReserva(error, "No se pudieron consultar los horarios ocupados.");
  }

  return (data ?? []).map((item) => ({
    inicio: item.inicio,
    fin: item.fin,
    tipo: item.tipo,
  }));
}

/**
 * Verifica si un bloque horario propuesto por el cliente cumple con:
 *  - No estar en el pasado (zona horaria America/Guatemala).
 *  - El horario de atención configurado por `admin` (`hora_apertura` a `hora_cierre`).
 *  - No traslaparse con reservas activas ni con `fechas_bloqueadas` creadas por `admin`.
 */
export async function verificarDisponibilidadCliente(
  { fecha, horaInicio, horaFin },
  supabase = crearClienteSupabase(),
) {
  if (!fecha || !horaInicio || !horaFin || horaFin.slice(0, 5) <= horaInicio.slice(0, 5)) {
    return {
      disponible: false,
      motivo: "La hora de fin debe ser posterior a la hora de inicio.",
      ocupadosDia: [],
    };
  }

  const inicioPropuestoMs = new Date(
    construirTimestampGuatemala(fecha, horaInicio.slice(0, 5)),
  ).getTime();
  const finPropuestoMs = new Date(
    construirTimestampGuatemala(fecha, horaFin.slice(0, 5)),
  ).getTime();

  if (Number.isNaN(inicioPropuestoMs) || Number.isNaN(finPropuestoMs)) {
    return {
      disponible: false,
      motivo: "El formato de fecha u hora no es válido.",
      ocupadosDia: [],
    };
  }

  if (inicioPropuestoMs <= Date.now()) {
    return {
      disponible: false,
      motivo: "No se puede reservar en una fecha u hora pasada.",
      ocupadosDia: [],
    };
  }

  const [config, ocupadosDia] = await Promise.all([
    obtenerConfiguracionEstudio(supabase),
    obtenerHorariosOcupados({ desde: fecha, hasta: fecha }, supabase),
  ]);

  if (
    horaInicio.slice(0, 5) < config.horaApertura.slice(0, 5) ||
    horaFin.slice(0, 5) > config.horaCierre.slice(0, 5)
  ) {
    return {
      disponible: false,
      motivo: `El horario de atención es de ${config.horaApertura} a ${config.horaCierre}.`,
      ocupadosDia,
    };
  }

  const choque = ocupadosDia.find((bloque) => {
    const inicioBloque = new Date(bloque.inicio).getTime();
    const finBloque = new Date(bloque.fin).getTime();
    return inicioPropuestoMs < finBloque && inicioBloque < finPropuestoMs;
  });

  if (choque) {
    return {
      disponible: false,
      motivo:
        choque.tipo === "BLOQUEO"
          ? "Ese horario no está disponible por bloqueo del estudio."
          : "Ese horario ya está reservado.",
      ocupadosDia,
    };
  }

  return {
    disponible: true,
    motivo: null,
    ocupadosDia,
  };
}

/**
 * Solicita una reserva desde la cuenta autenticada del cliente invocando la RPC
 * `solicitar_reserva` (migración 000019).
 *
 * Incluye:
 *  - Validación de formato y fecha futura.
 *  - Protección de idempotencia contra doble envío simultáneo.
 *  - Cola de sección crítica para serializar solicitudes concurrentes.
 *  - Traducción de conflictos GiST (`23P01`) si otra instancia reservó el
 *    mismo intervalo en el mismo milisegundo.
 *
 * @param {object} input Datos del formulario de reserva (`SolicitarReservaInput`)
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase Cliente con sesión de usuario
 * @returns {Promise<string>} UUID de la reserva creada en estado `pendiente`
 */
export async function solicitarReservaCliente(
  input,
  supabase = crearClienteSupabase(),
) {
  const limpio = validarEntradaSolicitudCliente(input);
  const huella = `${limpio.correo.toLowerCase()}|${limpio.fecha}|${limpio.horaInicio}|${limpio.horaFin}`;
  const liberarIdempotencia = verificarYRegistrarIdempotencia(huella);

  try {
    return await ejecutarEnSeccionCriticaCalendario(async () => {
      const disponibilidad = await verificarDisponibilidadCliente(
        {
          fecha: limpio.fecha,
          horaInicio: limpio.horaInicio,
          horaFin: limpio.horaFin,
        },
        supabase,
      );

      if (!disponibilidad.disponible) {
        throw new Error(
          disponibilidad.motivo ?? "Ese horario ya no está disponible.",
        );
      }

      const equiposFormateados = limpio.equipos.map((item) => ({
        equipo_id: item.equipoId,
        cantidad: item.cantidad,
      }));

      const { data, error } = await supabase.rpc("solicitar_reserva", {
        p_nombre: limpio.nombre,
        p_correo: limpio.correo,
        p_telefono: limpio.telefono,
        p_fecha: limpio.fecha,
        p_hora_inicio: limpio.horaInicio,
        p_hora_fin: limpio.horaFin,
        p_notas: limpio.notas,
        p_servicios: limpio.servicios,
        p_equipos: equiposFormateados,
      });

      if (error) {
        throw normalizarErrorReserva(
          error,
          "No se pudo completar la solicitud de reserva.",
        );
      }

      return String(data);
    });
  } finally {
    liberarIdempotencia();
  }
}

/**
 * Lista las reservas del cliente autenticado (RLS `reservas_cliente_lectura_propia`
 * filtra automáticamente por `cliente_id = auth.uid()`).
 */
export async function listarMisReservas(
  clienteId,
  supabase = crearClienteSupabase(),
) {
  let query = supabase
    .from("reservas")
    .select("*")
    .order("fecha_hora_inicio", { ascending: false });

  if (clienteId) {
    query = query.eq("cliente_id", clienteId);
  }

  const { data, error } = await query;

  if (error) {
    throw normalizarErrorReserva(error, "No se pudieron obtener tus reservas.");
  }

  return (data ?? []).map(mapearReserva);
}

/**
 * Obtiene el desglose congelado (servicios y equipos) de una reserva específica.
 */
export async function obtenerDetalleReserva(
  reservaId,
  supabase = crearClienteSupabase(),
) {
  const [resServicios, resEquipos] = await Promise.all([
    supabase
      .from("reserva_servicios")
      .select("reserva_id, servicio_id, precio_congelado, servicios_estudio(nombre)")
      .eq("reserva_id", reservaId),
    supabase
      .from("reserva_equipos")
      .select(
        "reserva_id, equipo_id, cantidad_rentada, precio_congelado, inventario_equipos(nombre)",
      )
      .eq("reserva_id", reservaId),
  ]);

  if (resServicios.error) {
    throw normalizarErrorReserva(
      resServicios.error,
      "No se pudieron obtener los servicios de la reserva.",
    );
  }
  if (resEquipos.error) {
    throw normalizarErrorReserva(
      resEquipos.error,
      "No se pudieron obtener los equipos de la reserva.",
    );
  }

  return {
    servicios: (resServicios.data ?? []).map(mapearReservaServicio),
    equipos: (resEquipos.data ?? []).map(mapearReservaEquipo),
  };
}

/**
 * Cuenta cuántas solicitudes pendientes futuras tiene el cliente
 * (alineado al trigger `limitar_pendientes_por_cliente`, migración 000022).
 */
export async function contarPendientesDeCliente(
  clienteId,
  supabase = crearClienteSupabase(),
) {
  const { count, error } = await supabase
    .from("reservas")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId)
    .eq("estado", "pendiente")
    .gt("fecha_hora_fin", new Date().toISOString());

  if (error) {
    throw normalizarErrorReserva(
      error,
      "No se pudo verificar el límite de reservas pendientes.",
    );
  }

  return count ?? 0;
}

/**
 * Permite al cliente cancelar su propia reserva cuando está en `pendiente` o
 * `confirmada` (validado por el trigger `reservas_update_cliente`, 000029).
 * Al cancelarse, el espacio en el calendario se libera automáticamente sin
 * borrar el registro (AGENTS.md §8).
 */
export async function cancelarReservaCliente(
  reservaId,
  supabase = crearClienteSupabase(),
) {
  const { data, error } = await supabase
    .from("reservas")
    .update({ estado: "cancelada" })
    .eq("id", reservaId)
    .select("*")
    .single();

  if (error) {
    throw normalizarErrorReserva(error, "No se pudo cancelar la reserva.");
  }

  return mapearReserva(data);
}

/**
 * Permite al cliente registrar el comprobante de pago de su reserva.
 * Pasa `estado_pago` a `'comprobante_subido'` para que el módulo `admin`
 * lo revise y lo marque como `'pagado'` o `'rechazado'` (migración 000029).
 */
export async function subirComprobantePagoCliente(
  { reservaId, urlComprobantePago },
  supabase = crearClienteSupabase(),
) {
  const urlLimpia = String(urlComprobantePago ?? "").trim();
  if (!urlLimpia) {
    throw new Error("Debes proporcionar el enlace del comprobante de pago.");
  }

  const { data, error } = await supabase
    .from("reservas")
    .update({
      url_comprobante_pago: urlLimpia,
      estado_pago: "comprobante_subido",
    })
    .eq("id", reservaId)
    .select("*")
    .single();

  if (error) {
    throw normalizarErrorReserva(
      error,
      "No se pudo registrar el comprobante de pago.",
    );
  }

  return mapearReserva(data);
}
