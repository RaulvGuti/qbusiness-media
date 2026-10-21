import {
  construirTimestampGuatemala,
  crearClienteSupabase,
  ejecutarEnSeccionCriticaCalendario,
  mapearConfiguracionEstudio,
  mapearEquipo,
  mapearFechaBloqueada,
  mapearReserva,
  mapearReservaEquipo,
  mapearReservaServicio,
  mapearServicio,
  normalizarErrorReserva,
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
 *      `completada` / `cancelada`), serializando los cambios de estado sobre el
 *      calendario y respetando los triggers `validar_reserva` (000018) y
 *      `validar_horario_atencion` (000029).
 *   3. Aprueba (`pagado`) o rechaza (`rechazado`) los comprobantes de pago
 *      subidos desde `clients` (`estado_pago`, 000029).
 *   4. Administra `fechas_bloqueadas` (000017), verificando antes de bloquear
 *      que no existan reservas activas (`pendiente` o `confirmada`) en ese
 *      intervalo para evitar choques silenciosos con clientes agendados.
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
    throw normalizarErrorReserva(
      error,
      "No se pudieron listar las reservas del estudio.",
    );
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
    throw normalizarErrorReserva(
      error,
      "No se pudieron listar los servicios de la reserva.",
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
    throw normalizarErrorReserva(
      error,
      "No se pudieron listar los equipos de la reserva.",
    );
  }

  return (data ?? []).map(mapearReservaEquipo);
}

/**
 * Actualiza el estado de una reserva (`pendiente`, `confirmada`, `completada`, `cancelada`).
 * Corre dentro de la sección crítica del calendario y traduce cualquier conflicto
 * de exclusión GiST (`23P01`) si se intenta reactivar una reserva sobre un horario
 * que ya fue ocupado por otro cliente.
 */
export async function actualizarEstadoReservaAdmin(
  { id, estado },
  supabase = crearClienteSupabase(),
) {
  if (!ESTADOS_RESERVA_VALIDOS.has(estado)) {
    throw new Error(`Estado de reserva inválido: ${estado}`);
  }

  return ejecutarEnSeccionCriticaCalendario(async () => {
    const { data, error } = await supabase
      .from("reservas")
      .update({ estado })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw normalizarErrorReserva(
        error,
        "No se pudo actualizar el estado de la reserva.",
      );
    }

    return mapearReserva(data);
  });
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
    throw normalizarErrorReserva(
      error,
      "No se pudo actualizar el estado de pago de la reserva.",
    );
  }

  return mapearReserva(data);
}

/* ==========================================================================
 * Fechas bloqueadas del calendario (migración 000017)
 * ========================================================================== */

/**
 * Verifica si un bloqueo de fechas propuesto (`desde`, `hasta`, `horaDesde`, `horaHasta`)
 * choca con alguna reserva activa (`pendiente` o `confirmada`) en una lista de reservas.
 */
export function detectarReservasEnRangoDeBloqueo(
   { desde, hasta, horaDesde, horaHasta },
  reservasActivas = [],
) {
  const hDesde = horaDesde ? horaDesde.slice(0, 5) : null;
  const hHasta = horaHasta ? horaHasta.slice(0, 5) : null;

  return reservasActivas.filter((r) => {
    if (r.estado !== "pendiente" && r.estado !== "confirmada") return false;

    const rInicioMs = new Date(r.fechaHoraInicio).getTime();
    const rFinMs = new Date(r.fechaHoraFin).getTime();
    if (Number.isNaN(rInicioMs) || Number.isNaN(rFinMs)) return false;

    // Si es bloqueo de día completo en el rango [desde, hasta]
    if (!hDesde || !hHasta) {
      const inicioRangoMs = new Date(
        construirTimestampGuatemala(desde, "00:00"),
      ).getTime();
      const finRangoMs =
        new Date(construirTimestampGuatemala(hasta, "23:59")).getTime() + 60_000;
      return rInicioMs < finRangoMs && inicioRangoMs < rFinMs;
    }

    // Si es bloqueo parcial por horas en cada día desde..hasta
    const cursor = new Date(`${desde}T00:00:00Z`);
    const limite = new Date(`${hasta}T00:00:00Z`);

    while (cursor <= limite) {
      const fechaDia = cursor.toISOString().slice(0, 10);
      const bInicioMs = new Date(
        construirTimestampGuatemala(fechaDia, hDesde),
      ).getTime();
      const bFinMs = new Date(
        construirTimestampGuatemala(fechaDia, hHasta),
      ).getTime();

      if (rInicioMs < bFinMs && bInicioMs < rFinMs) {
        return true;
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return false;
  });
}

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
    throw normalizarErrorReserva(
      error,
      "No se pudieron cargar las fechas bloqueadas.",
    );
  }

  return (data ?? []).map(mapearFechaBloqueada);
}

/**
 * Crea un bloqueo en el calendario (`fechas_bloqueadas`).
 *
 * Seguridad adicional:
 *  - Valida coherencia de fechas (`hasta >= desde`) y de horas parciales.
 *  - Antes de insertar, verifica dentro de la sección crítica si ya existen
 *    reservas activas (`pendiente` o `confirmada`) en ese horario para impedir
 *    que un administrador bloquee accidentalmente encima de una reserva activa.
 */
export async function crearFechaBloqueadaAdmin(
  datos,
  supabase = crearClienteSupabase(),
) {
  if (!datos?.desde || !datos?.hasta) {
    throw new Error("Debes indicar las fechas de inicio y fin del bloqueo.");
  }
  if (datos.hasta < datos.desde) {
    throw new Error("La fecha final del bloqueo no puede ser anterior a la inicial.");
  }

  const horaDesde = datos.horaDesde ? String(datos.horaDesde).slice(0, 5) : null;
  const horaHasta = datos.horaHasta ? String(datos.horaHasta).slice(0, 5) : null;

  if ((horaDesde && !horaHasta) || (!horaDesde && horaHasta)) {
    throw new Error(
      "Para un bloqueo parcial debes indicar tanto horaDesde como horaHasta.",
    );
  }
  if (horaDesde && horaHasta && horaHasta <= horaDesde) {
    throw new Error("La hora final del bloqueo debe ser posterior a la hora inicial.");
  }

  return ejecutarEnSeccionCriticaCalendario(async () => {
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

    if (!datos.forzar) {
      const inicioBusqueda = construirTimestampGuatemala(datos.desde, "00:00");
      const finBusqueda = construirTimestampGuatemala(datos.hasta, "23:59:59");

      const { data: reservasEnRango, error: errReservas } = await supabase
        .from("reservas")
        .select("*")
        .in("estado", ["pendiente", "confirmada"])
        .lt("fecha_hora_inicio", finBusqueda)
        .gt("fecha_hora_fin", inicioBusqueda);

      if (errReservas) {
        throw normalizarErrorReserva(
          errReservas,
          "No se pudieron verificar las reservas activas antes de bloquear.",
        );
      }

      const traslapadas = detectarReservasEnRangoDeBloqueo(
        {
          desde: datos.desde,
          hasta: datos.hasta,
          horaDesde,
          horaHasta,
        },
        (reservasEnRango ?? []).map(mapearReserva),
      );

      if (traslapadas.length > 0) {
        throw new Error(
          `No se puede bloquear ese horario porque choca con ${traslapadas.length} reserva(s) activa(s) (pendiente o confirmada). Cancela o reprograma la reserva primero.`,
        );
      }
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
      throw normalizarErrorReserva(error, "No se pudo crear la fecha bloqueada.");
    }

    return mapearFechaBloqueada(data);
  });
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
    throw normalizarErrorReserva(error, "No se pudo eliminar el bloqueo de fecha.");
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
    const tarifa = Number(cambios.tarifaHora);
    if (!Number.isFinite(tarifa) || tarifa <= 0) {
      throw new Error("La tarifa por hora debe ser un número mayor a 0.");
    }
    filas.push({
      grupo: "estudio",
      clave: "tarifa_hora",
      valor: String(tarifa),
    });
  }
  if (cambios.maxPendientesPorCliente !== undefined) {
    const maxPend = Number(cambios.maxPendientesPorCliente);
    if (!Number.isInteger(maxPend) || maxPend <= 0) {
      throw new Error("El límite de reservas pendientes por cliente debe ser un entero mayor a 0.");
    }
    filas.push({
      grupo: "estudio",
      clave: "max_pendientes_por_cliente",
      valor: String(maxPend),
    });
  }
  if (cambios.horaApertura && cambios.horaCierre && cambios.horaCierre <= cambios.horaApertura) {
    throw new Error("La hora de cierre del estudio debe ser posterior a la hora de apertura.");
  }
  if (cambios.horaApertura) {
    filas.push({
      grupo: "estudio",
      clave: "hora_apertura",
      valor: String(cambios.horaApertura).slice(0, 5),
    });
  }
  if (cambios.horaCierre) {
    filas.push({
      grupo: "estudio",
      clave: "hora_cierre",
      valor: String(cambios.horaCierre).slice(0, 5),
    });
  }

  if (filas.length > 0) {
    const { error } = await supabase
      .from("configuracion_sitio")
      .upsert(filas, { onConflict: "grupo,clave" });

    if (error) {
      throw normalizarErrorReserva(
        error,
        "No se pudo actualizar la configuración del estudio.",
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
  const precio = Number(servicio.precioPorHora);
  if (!Number.isFinite(precio) || precio < 0) {
    throw new Error("El precio por hora del servicio debe ser mayor o igual a 0.");
  }

  const payload = {
    nombre: String(servicio.nombre ?? "").trim(),
    descripcion: servicio.descripcion ?? null,
    precio_por_hora: precio,
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
    throw normalizarErrorReserva(
      error,
      "No se pudo guardar el servicio del estudio.",
    );
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
  const cantidad = Number(equipo.cantidadTotal);
  const precio = Number(equipo.precioPorHora);
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    throw new Error("La cantidad total del equipo debe ser un entero mayor o igual a 0.");
  }
  if (!Number.isFinite(precio) || precio < 0) {
    throw new Error("El precio por hora del equipo debe ser mayor o igual a 0.");
  }

  const payload = {
    nombre: String(equipo.nombre ?? "").trim(),
    descripcion: equipo.descripcion ?? null,
    cantidad_total: cantidad,
    precio_por_hora: precio,
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
    throw normalizarErrorReserva(
      error,
      "No se pudo guardar el equipo del inventario.",
    );
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
    throw normalizarErrorReserva(
      configRes.error,
      "No se pudo cargar la configuración del estudio.",
    );
  }

  return {
    reservas,
    fechasBloqueadas,
    configuracion: mapearConfiguracionEstudio(configRes.data ?? []),
  };
}
