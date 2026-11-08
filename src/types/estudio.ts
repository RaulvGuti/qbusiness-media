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

/**
 * paquetes_estudio (000042): la renta se vende en paquetes cerrados de horas
 * y precio. Solo un paquete activo permite reservar.
 */
export interface PaqueteEstudio {
  id: string;
  nombre: string;
  horas: number;
  precio: number;
  activo: boolean;
  orden: number;
}

export interface PaqueteEstudioInput {
  nombre: string;
  horas: number;
  precio: number;
  activo?: boolean;
  orden?: number;
}

export interface EquipoEstudioInput {
  nombre: string;
  descripcion?: string | null;
  cantidadTotal: number;
  precioPorHora: number;
  activo?: boolean;
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
  /** Legado de la tarifa por hora (000015); las reservas nuevas lo dejan null. */
  tarifaHoraAplicada: number | null;
  /** Paquete congelado al solicitar (000042). */
  paqueteId: string | null;
  paqueteNombre: string | null;
  paqueteHoras: number | null;
  paquetePrecio: number | null;
  descuentoLealtad: boolean;
  descuentoMonto: number;
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
 * Parámetros de la RPC solicitar_reserva (000042).
 * Requiere sesión autenticada como cliente; el paquete es obligatorio y el
 * servidor calcula la hora de fin, el total y el descuento de lealtad.
 */
export interface SolicitarReservaInput {
  nombre: string;
  correo: string;
  telefono: string;
  fecha: string;
  horaInicio: string;
  /** Solo se usa para validar disponibilidad en el servidor; la RPC lo deriva. */
  horaFin: string;
  paqueteId: string;
  notas?: string;
  servicios: string[];
  equipos: { equipoId: string; cantidad: number }[];
}

/** Motivos esperados de una solicitud de reserva fallida. */
export type CodigoResultadoReserva =
  | 'SESION_REQUERIDA'
  | 'PAQUETE_NO_DISPONIBLE'
  | 'LIMITE_PENDIENTES'
  | 'HORARIO_NO_DISPONIBLE'
  | 'SERVICIO_NO_DISPONIBLE'
  | 'EQUIPO_NO_DISPONIBLE'
  | 'DATOS_INVALIDOS'
  | 'ERROR_INESPERADO';

/**
 * Resultado serializable de `enviarSolicitudReservaCliente`.
 *
 * Los errores esperados se devuelven como datos para que el mensaje llegue al
 * navegador. Lanzarlos desde una Server Action hace que producción los oculte
 * detrás de un error genérico de React.
 */
export type ResultadoSolicitudReserva =
  | { ok: true; reservaId: string }
  | { ok: false; codigo: CodigoResultadoReserva; mensaje: string };

/** Retorno de la RPC horarios_ocupados (000018). tipo: RESERVA | BLOQUEO. */
export interface HorarioOcupado {
  inicio: string;
  fin: string;
  tipo: 'RESERVA' | 'BLOQUEO';
}

/** configuracion_sitio grupo='estudio': max_pendientes y horarios. */
export interface ConfiguracionEstudio {
  /** Legado: se conserva para compatibilidad, pero ya no se usa para cobrar. */
  tarifaHora: number | null;
  /** Máximo de solicitudes pendientes futuras; por defecto 1. */
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
