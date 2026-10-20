/**
 * Tipos alineados a las migraciones de Supabase.
 * Tablas: servicios_estudio (000004), inventario_equipos (000005),
 * reservas (000006 + 000015 + 000022 + 000029),
 * reserva_servicios (000007), reserva_equipos (000008),
 * configuracion_sitio (000016) y fechas_bloqueadas (000017).
 */

export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
export type EstadoPagoReserva = 'pendiente' | 'comprobante_subido' | 'pagado' | 'rechazado';

/** servicios_estudio: nombre UNIQUE, precio_por_hora >= 0, activo. */
export interface ServicioEstudio {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioPorHora: number;
  activo: boolean;
}

/** inventario_equipos: cantidad_total >= 0, precio_por_hora >= 0, activo. */
export interface EquipoEstudio {
  id: string;
  nombre: string;
  descripcion: string | null;
  cantidadTotal: number;
  precioPorHora: number;
  activo: boolean;
}

/** reservas: sin traslape (excluye canceladas); total lo calcula el servidor. */
export interface ReservaEstudio {
  id: string;
  clienteId: string | null;
  creadoPor: string | null;
  nombre: string;
  correo: string;
  telefono: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: EstadoReserva;
  estadoPago: EstadoPagoReserva;
  totalCalculado: number | null;
  tarifaHoraAplicada: number | null;
  urlComprobantePago: string | null;
  notasCliente: string | null;
  creadoEn: string;
}

/** reserva_servicios: PK (reserva_id, servicio_id), precio_congelado. */
export interface ReservaServicio {
  reservaId: string;
  servicioId: string;
  precioCongelado: number;
  nombreServicio?: string;
}

/** reserva_equipos: PK (reserva_id, equipo_id), cantidad_rentada > 0. */
export interface ReservaEquipo {
  reservaId: string;
  equipoId: string;
  cantidadRentada: number;
  precioCongelado: number;
  nombreEquipo?: string;
}

/**
 * Parámetros de la RPC solicitar_reserva (000019).
 * Requiere sesión autenticada como cliente; el precio lo calcula el servidor
 * a partir de configuracion_sitio (estudio/tarifa_hora).
 */
export interface SolicitarReservaInput {
  nombre: string;
  correo: string;
  telefono: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  notas?: string;
  servicios: string[];
  equipos: { equipoId: string; cantidad: number }[];
}

/** Retorno de la RPC horarios_ocupados (000018). tipo: RESERVA | BLOQUEO. */
export interface HorarioOcupado {
  inicio: string;
  fin: string;
  tipo: 'RESERVA' | 'BLOQUEO';
}

/** configuracion_sitio grupo='estudio': tarifa_hora, max_pendientes, horarios. */
export interface ConfiguracionEstudio {
  tarifaHora: number | null;
  maxPendientesPorCliente: number;
  horaApertura: string;
  horaCierre: string;
}

/** fechas_bloqueadas: día completo si ambas horas son null. */
export interface FechaBloqueada {
  id: string;
  desde: string;
  hasta: string;
  horaDesde: string | null;
  horaHasta: string | null;
  motivo: string | null;
  creadoPor: string;
  creadoEn: string;
}

/** Ítem del carrito de reserva en el cliente (UI). */
export interface ItemReservaServicio {
  servicioId: string;
  nombre: string;
  precioPorHora: number;
  horas: number;
}

/** Ítem del carrito de equipo en la UI. */
export interface ItemReservaEquipo {
  equipoId: string;
  nombre: string;
  precioPorHora: number;
  cantidad: number;
  horas: number;
}
