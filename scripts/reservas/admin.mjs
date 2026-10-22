import {
  crearClienteSupabase,
  mapearConfiguracionEstudio,
  mapearEquipo,
  mapearFechaBloqueada,
  mapearReserva,
  mapearReservaEquipo,
  mapearReservaServicio,
  mapearServicio,
} from "./supabase.mjs";

/**
 * ============================================================================
 * MÓDULO ADMIN — Panel de control y administración del estudio
 * ============================================================================
 * Este servicio actúa como contraparte directa del módulo `clients`:
 *
 *   1. Recibe y lista todas las solicitudes creadas por `clients` en `reservas`
 *      junto con sus servicios y equipos a precio congelado.
 *   2. Modera el ciclo de vida de cada reserva (`pendiente` → `confirmada` →
 *      `completada` / `cancelada`), respetando los triggers `validar_reserva`
 *      (000018) y `validar_horario_atencion` (000029).
 *   3. Aprueba (`pagado`) o rechaza (`rechazado`) los comprobantes de pago
 *      subidos desde `clients` (`estado_pago`, 000029).
 *   4. Administra `fechas_bloqueadas` (000017), cuyos intervalos impactan de
 *      inmediato la disponibilidad que consulta `clients` en `horarios_ocupados`.
 *   5. Configura los parámetros del estudio en `configuracion_sitio` (`tarifa_hora`,
 *      `hora_apertura`, `hora_cierre`, `max_pendientes_por_cliente`) y los
 *      catálogos (`servicios_estudio`, `inventario_equipos`) sin borrar
 *      historial (`activo = false`, AGENTS.md §8).
 * ============================================================================
 */

const ESTADOS_RESERVA_VALIDOS = new Set([
  "pendiente",
  "confirmada",
  "completada",
  "cancelada",
]);

const ESTADOS_PAGO_VALIDOS = new Set([
  "pendiente",
  "comprobante_subido",
  "pagado",
  "rechazado",
]);

/**
 * Lista todas las reservas del estudio para el panel de control (`admin`),
 * ordenadas por `fecha_hora_inicio DESC`. Permite filtrar opcionalmente por
 * `estado` o `estadoPago`.
 */
export async function listarReservasAdmin(
  filtros = {},
  supabase = crearClienteSupabase(),
) {
  let query = supabase
    .from("reservas")
    .select("*")
    .order("fecha_hora_inicio", { ascending: false });

  if (filtros.estado) {
    query = query.eq("estado", filtros.estado);
  }
  if (filtros.estadoPago) {
    query = query.eq("estado_pago", filtros.estadoPago);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`No se pudieron listar las reservas del estudio: ${error.message}`);
  }

  return (data ?? []).map(mapearReserva);
}

/**
 * Obtiene los servicios (`reserva_servicios`) de una reserva con precio congelado.
 */
export async function listarServiciosDeReservaAdmin(
  reservaId,
  supabase = crearClienteSupabase(),
) {
  const { data, error } = await supabase
    .from("reserva_servicios")
    .select("reserva_id, servicio_id, precio_congelado, servicios_estudio(nombre)")
    .eq("reserva_id", reservaId);

  if (error) {
    throw new Error(
      `No se pudieron listar los servicios de la reserva: ${error.message}`,
    );
  }

  return (data ?? []).map(mapearReservaServicio);
}

/**
 * Obtiene los equipos (`reserva_equipos`) de una reserva con cantidad y precio congelado.
 */
export async function listarEquiposDeReservaAdmin(
  reservaId,
  supabase = crearClienteSupabase(),
) {
  const { data, error } = await supabase
    .from("reserva_equipos")
    .select(
      "reserva_id, equipo_id, cantidad_rentada, precio_congelado, inventario_equipos(nombre)",
    )
    .eq("reserva_id", reservaId);

  if (error) {
    throw new Error(
      `No se pudieron listar los equipos de la reserva: ${error.message}`,
    );
  }

  return (data ?? []).map(mapearReservaEquipo);
}

/**
 * Actualiza el estado de una reserva (`pendiente`, `confirmada`, `completada`, `cancelada`).
 * Si pasa a `confirmada` o `pendiente`, PostgreSQL valida automáticamente que no
 * exista traslape con otra reserva activa ni con un bloqueo (`validar_reserva`, 000018).
 * Si pasa a `completada`, habilita al cliente en el módulo `clients` para dejar reseña.
 */
export async function actualizarEstadoReservaAdmin(
  { id, estado },
  supabase = crearClienteSupabase(),
) {
  if (!ESTADOS_RESERVA_VALIDOS.has(estado)) {
    throw new Error(`Estado de reserva inválido: ${estado}`);
  }

  const { data, error } = await supabase
    .from("reservas")
    .update({ estado })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`No se pudo actualizar el estado de la reserva: ${error.message}`);
  }

  return mapearReserva(data);
}

/**
 * Actualiza el estado de pago de una reserva (`pendiente`, `comprobante_subido`,
 * `pagado`, `rechazado`) tras revisar el comprobante enviado desde `clients`.
 */
export async function actualizarEstadoPagoReservaAdmin(
  { id, estadoPago },
  supabase = crearClienteSupabase(),
) {
  if (!ESTADOS_PAGO_VALIDOS.has(estadoPago)) {
    throw new Error(`Estado de pago inválido: ${estadoPago}`);
  }

  const { data, error } = await supabase
    .from("reservas")
    .update({ estado_pago: estadoPago })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `No se pudo actualizar el estado de pago de la reserva: ${error.message}`,
    );
  }

  return mapearReserva(data);
}

/* ==========================================================================
 * Fechas bloqueadas del calendario (migración 000017)
 * ========================================================================== */

/**
 * Lista todos los bloqueos del calendario ordenados por fecha de inicio (`desde`).
 */
export async function listarFechasBloqueadasAdmin(
  supabase = crearClienteSupabase(),
) {
  const { data, error } = await supabase
    .from("fechas_bloqueadas")
    .select("*")
    .order("desde", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar las fechas bloqueadas: ${error.message}`);
  }

  return (data ?? []).map(mapearFechaBloqueada);
}

/**
 * Crea un bloqueo en el calendario (`fechas_bloqueadas`).
 * Si `creadoPor` no viene explícito, toma el `id` del administrador autenticado.
 * Los bloqueos se reflejan de inmediato en `horarios_ocupados()` para `clients`.
 */
export async function crearFechaBloqueadaAdmin(
  datos,
  supabase = crearClienteSupabase(),
) {
  let creadoPor = datos.creadoPor;

  if (!creadoPor) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      throw new Error(
        "Se requiere sesión de administrador o indicar creadoPor para registrar un bloqueo.",
      );
    }
    creadoPor = authData.user.id;
  }

  const horaDesde = datos.horaDesde ? datos.horaDesde : null;
  const horaHasta = datos.horaHasta ? datos.horaHasta : null;

  if ((horaDesde && !horaHasta) || (!horaDesde && horaHasta)) {
    throw new Error(
      "Para un bloqueo parcial debes indicar tanto horaDesde como horaHasta.",
    );
  }

  const { data, error } = await supabase
    .from("fechas_bloqueadas")
    .insert({
      desde: datos.desde,
      hasta: datos.hasta,
      hora_desde: horaDesde,
      hora_hasta: horaHasta,
      motivo: datos.motivo || null,
      creado_por: creadoPor,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`No se pudo crear la fecha bloqueada: ${error.message}`);
  }

  return mapearFechaBloqueada(data);
}

/**
 * Elimina un bloqueo del calendario (`fechas_bloqueadas`), liberando el horario
 * para nuevas solicitudes en `clients`.
 */
export async function eliminarFechaBloqueadaAdmin(
  id,
  supabase = crearClienteSupabase(),
) {
  const { error } = await supabase
    .from("fechas_bloqueadas")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar el bloqueo de fecha: ${error.message}`);
  }
}

/* ==========================================================================
 * Configuración y catálogos del estudio (impactan directamente en `clients`)
 * ========================================================================== */

/**
 * Actualiza los parámetros del grupo `'estudio'` en `configuracion_sitio`
 * (`tarifa_hora`, `max_pendientes_por_cliente`, `hora_apertura`, `hora_cierre`).
 */
export async function actualizarConfiguracionEstudioAdmin(
  cambios,
  supabase = crearClienteSupabase(),
) {
  const filas = [];

  if (cambios.tarifaHora !== undefined && cambios.tarifaHora !== null) {
    filas.push({
      grupo: "estudio",
      clave: "tarifa_hora",
      valor: String(cambios.tarifaHora),
    });
  }
  if (cambios.maxPendientesPorCliente !== undefined) {
    filas.push({
      grupo: "estudio",
      clave: "max_pendientes_por_cliente",
      valor: String(cambios.maxPendientesPorCliente),
    });
  }
  if (cambios.horaApertura) {
    filas.push({
      grupo: "estudio",
      clave: "hora_apertura",
      valor: String(cambios.horaApertura),
    });
  }
  if (cambios.horaCierre) {
    filas.push({
      grupo: "estudio",
      clave: "hora_cierre",
      valor: String(cambios.horaCierre),
    });
  }

  if (filas.length > 0) {
    const { error } = await supabase
      .from("configuracion_sitio")
      .upsert(filas, { onConflict: "grupo,clave" });

    if (error) {
      throw new Error(
        `No se pudo actualizar la configuración del estudio: ${error.message}`,
      );
    }
  }

  const { data } = await supabase
    .from("configuracion_sitio")
    .select("clave, valor")
    .eq("grupo", "estudio");

  return mapearConfiguracionEstudio(data ?? []);
}

/**
 * Activa o desactiva un servicio o actualiza su tarifa por hora.
 * Regla AGENTS.md §8: nunca se borra un servicio del catálogo para limpiar;
 * se desactiva con `activo = false` y las reservas previas conservan su
 * `precio_congelado`.
 */
export async function guardarServicioEstudioAdmin(
  servicio,
  supabase = crearClienteSupabase(),
) {
  const payload = {
    nombre: servicio.nombre,
    descripcion: servicio.descripcion ?? null,
    precio_por_hora: Number(servicio.precioPorHora),
    activo: servicio.activo ?? true,
  };

  const query = servicio.id
    ? supabase
        .from("servicios_estudio")
        .update(payload)
        .eq("id", servicio.id)
        .select("*")
        .single()
    : supabase.from("servicios_estudio").insert(payload).select("*").single();

  const { data, error } = await query;

  if (error) {
    throw new Error(`No se pudo guardar el servicio del estudio: ${error.message}`);
  }

  return mapearServicio(data);
}

/**
 * Activa o desactiva un equipo del inventario o actualiza su stock/tarifa.
 * Regla AGENTS.md §8: se desactiva con `activo = false` para conservar historial.
 */
export async function guardarEquipoEstudioAdmin(
  equipo,
  supabase = crearClienteSupabase(),
) {
  const payload = {
    nombre: equipo.nombre,
    descripcion: equipo.descripcion ?? null,
    cantidad_total: Number(equipo.cantidadTotal),
    precio_por_hora: Number(equipo.precioPorHora),
    activo: equipo.activo ?? true,
  };

  const query = equipo.id
    ? supabase
        .from("inventario_equipos")
        .update(payload)
        .eq("id", equipo.id)
        .select("*")
        .single()
    : supabase.from("inventario_equipos").insert(payload).select("*").single();

  const { data, error } = await query;

  if (error) {
    throw new Error(`No se pudo guardar el equipo del inventario: ${error.message}`);
  }

  return mapearEquipo(data);
}

/**
 * Carga todo el estado inicial que requiere el panel `/admin/reservas`
 * en una sola llamada (reservas, fechas bloqueadas y configuración del estudio).
 */
export async function obtenerPanelReservasAdmin(
  supabase = crearClienteSupabase(),
) {
  const [reservas, fechasBloqueadas, configRes] = await Promise.all([
    listarReservasAdmin({}, supabase),
    listarFechasBloqueadasAdmin(supabase),
    supabase
      .from("configuracion_sitio")
      .select("clave, valor")
      .eq("grupo", "estudio"),
  ]);

  if (configRes.error) {
    throw new Error(
      `No se pudo cargar la configuración del estudio: ${configRes.error.message}`,
    );
  }

  return {
    reservas,
    fechasBloqueadas,
    configuracion: mapearConfiguracionEstudio(configRes.data ?? []),
  };
}
