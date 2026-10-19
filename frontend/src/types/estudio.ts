export type ServicioEstudio = {
  id: string;
  nombre: string;
  descripcion?: string;
  precioPorHora: number;
  incluye?: string[];
  activo: boolean;
};

export type EquipoEstudio = {
  id: string;
  nombre: string;
  descripcion?: string;
  tarifaPorHora: number;
  cantidadDisponible: number;
  activo: boolean;
};

export type ItemReservaServicio = {
  servicioId: string;
  nombre: string;
  precioPorHora: number;
  horas: number;
};

export type ItemReservaEquipo = {
  equipoId: string;
  nombre: string;
  tarifaPorHora: number;
  cantidad: number;
  horas: number;
};

export interface ReservaEstudio {
  id: string;
  nombreCliente: string;
  email: string;
  telefono: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  horasTotales: number;
  servicios: ItemReservaServicio[];
  equipos: ItemReservaEquipo[];
  subtotalServicios: number;
  subtotalEquipos: number;
  total: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  notas?: string;
}