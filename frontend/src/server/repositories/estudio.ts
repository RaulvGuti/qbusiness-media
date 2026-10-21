import type {
  ConfiguracionEstudio,
  EquipoEstudio,
  EstadoPagoReserva,
  EstadoReserva,
  FechaBloqueada,
  HorarioOcupado,
  ReservaEquipo,
  ReservaEstudio,
  ReservaServicio,
  ServicioEstudio,
  SolicitarReservaInput,
} from '@/types/estudio';
import {
  equiposMock,
  fechasBloqueadasMock,
  horariosOcupadosMock,
  reservasMock,
  reservaEquiposMock,
  reservaServiciosMock,
  serviciosMock,
} from './datos-mock';

/**
 * Repositorio de estudio: servicios_estudio, inventario_equipos, reservas,
 * reserva_servicios, reserva_equipos, configuracion_sitio (estudio),
 * fechas_bloqueadas y las RPC horarios_ocupados / solicitar_reserva.
 */
export async function listarServiciosActivos(): Promise<ServicioEstudio[]> {
  // SUPABASE (anon): SELECT * FROM servicios_estudio WHERE activo = true ORDER BY nombre;
  return Promise.resolve(serviciosMock.filter((s) => s.activo));
}

export async function listarEquiposActivos(): Promise<EquipoEstudio[]> {
  // SUPABASE (anon): SELECT * FROM inventario_equipos WHERE activo = true ORDER BY nombre;
  return Promise.resolve(equiposMock.filter((e) => e.activo));
}

export async function listarReservas(): Promise<ReservaEstudio[]> {
  // SUPABASE (admin): SELECT * FROM reservas ORDER BY fecha_hora_inicio DESC;
  return Promise.resolve([...reservasMock]);
}

export async function listarReservasDeCliente(clienteId: string): Promise<ReservaEstudio[]> {
  // SUPABASE (authenticated): SELECT * FROM reservas WHERE cliente_id = auth.uid() ...;
  return Promise.resolve(reservasMock.filter((r) => r.clienteId === clienteId));
}

export async function listarServiciosDeReserva(reservaId: string): Promise<ReservaServicio[]> {
  // SUPABASE: SELECT rs.*, se.nombre FROM reserva_servicios rs
  // JOIN servicios_estudio se ON se.id = rs.servicio_id WHERE rs.reserva_id = $reservaId;
  return Promise.resolve(reservaServiciosMock.filter((rs) => rs.reservaId === reservaId));
}

export async function listarEquiposDeReserva(reservaId: string): Promise<ReservaEquipo[]> {
  // SUPABASE: SELECT re.*, ie.nombre FROM reserva_equipos re
  // JOIN inventario_equipos ie ON ie.id = re.equipo_id WHERE re.reserva_id = $reservaId;
  return Promise.resolve(reservaEquiposMock.filter((re) => re.reservaId === reservaId));
}

export async function obtenerConfiguracionEstudio(): Promise<ConfiguracionEstudio> {
  // SUPABASE (anon): SELECT clave, valor FROM configuracion_sitio WHERE grupo = 'estudio';
  // Claves: tarifa_hora, max_pendientes_por_cliente, hora_apertura, hora_cierre.
  return {
    tarifaHora: 500,
    maxPendientesPorCliente: 3,
    horaApertura: '08:00',
    horaCierre: '18:00',
  };
}

/**
 * RPC horarios_ocupados(p_desde date, p_hasta date) → TABLE(inicio, fin, tipo).
 * Solo invocable si hay conexión a Supabase; la lógica de disponibilidad
 * del cliente debe trabajar sobre este arreglo (tipo RESERVA o BLOQUEO).
 */
export async function obtenerHorariosOcupados(desde: string, hasta: string): Promise<HorarioOcupado[]> {
  // SUPABASE: const { data } = await supabase.rpc('horarios_ocupados', { p_desde: desde, p_hasta: hasta });
  void desde;
  void hasta;
  return Promise.resolve([...horariosOcupadosMock]);
}

/**
 * RPC solicitar_reserva(p_nombre, p_correo, p_telefono, p_fecha, p_hora_inicio,
 *   p_hora_fin, p_notas, p_servicios uuid[], p_equipos jsonb) → uuid.
 * Requiere sesión autenticada (cliente). El precio lo calcula el servidor
 * con configuracion_sitio estudio/tarifa_hora. Lanza si hay traslape o
 * si la reserva excede el horario de atención.
 */
export async function solicitarReserva(input: SolicitarReservaInput): Promise<string> {
  // SUPABASE (authenticated):
  // const { data, error } = await supabase.rpc('solicitar_reserva', {
  //   p_nombre: input.nombre, p_correo: input.correo, p_telefono: input.telefono,
  //   p_fecha: input.fecha, p_hora_inicio: input.horaInicio, p_hora_fin: input.horaFin,
  //   p_notas: input.notas ?? null, p_servicios: input.servicios, p_equipos: input.equipos,
  // });
  void input;
  return Promise.resolve(`reserva-${Date.now()}`);
}

export async function actualizarEstadoReserva(id: string, estado: EstadoReserva): Promise<void> {
  // SUPABASE (admin): UPDATE reservas SET estado = $estado WHERE id = $id;
  // El trigger validar_reserva rechaza traslapes al pasar a pendiente/confirmada.
  const reserva = reservasMock.find((r) => r.id === id);
  if (reserva) reserva.estado = estado;
  return Promise.resolve();
}

export async function actualizarEstadoPagoReserva(id: string, estadoPago: EstadoPagoReserva): Promise<void> {
  // SUPABASE (admin): UPDATE reservas SET estado_pago = $estadoPago WHERE id = $id;
  const reserva = reservasMock.find((r) => r.id === id);
  if (reserva) reserva.estadoPago = estadoPago;
  return Promise.resolve();
}

/** Clientes que el trigger limitar_pendientes_por_cliente cuenta como pendientes. */
export async function contarPendientesDeCliente(clienteId: string): Promise<number> {
  // SUPABASE: SELECT count(*) FROM reservas WHERE cliente_id = $clienteId
  // AND estado = 'pendiente' AND fecha_hora_fin > now();
  return reservasMock.filter(
    (r) => r.clienteId === clienteId && r.estado === 'pendiente' && new Date(r.fechaHoraFin) > new Date(),
  ).length;
}

/* ---------------------- fechas_bloqueadas (000017) ---------------------- */

export async function listarFechasBloqueadas(): Promise<FechaBloqueada[]> {
  // SUPABASE (admin): SELECT * FROM fechas_bloqueadas ORDER BY desde;
  return Promise.resolve([...fechasBloqueadasMock]);
}

export async function crearFechaBloqueada(
  datos: Omit<FechaBloqueada, 'id' | 'creadoEn'>,
): Promise<FechaBloqueada> {
  // SUPABASE (admin): INSERT INTO fechas_bloqueadas (desde, hasta, hora_desde, hora_hasta, motivo, creado_por)
  // VALUES (...) RETURNING *;
  // Checks: hasta >= desde; ambas horas null o hora_hasta > hora_desde.
  const nueva: FechaBloqueada = {
    id: `bloqueo-${Date.now()}`,
    ...datos,
    creadoEn: new Date().toISOString(),
  };
  fechasBloqueadasMock.push(nueva);
  return Promise.resolve(nueva);
}

export async function eliminarFechaBloqueada(id: string): Promise<void> {
  // SUPABASE (admin): DELETE FROM fechas_bloqueadas WHERE id = $id;
  const idx = fechasBloqueadasMock.findIndex((f) => f.id === id);
  if (idx >= 0)   fechasBloqueadasMock.splice(idx, 1);
  return Promise.resolve();
}
