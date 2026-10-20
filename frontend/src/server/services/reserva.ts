import type {
  EquipoEstudio,
  ItemReservaEquipo,
  ItemReservaServicio,
  ServicioEstudio,
} from '@/types/estudio';

/**
 * Reglas de negocio de reserva del estudio.
 * El cálculo definitivo lo hace la RPC solicitar_reserva() en el servidor
 * (000019). Estas funciones permiten al cliente mostrar un estimado
 * coherente con esa fórmula:
 *   total = round((tarifa_hora + Σ servicios + Σ equipos*cantidad) * horas, 2)
 * donde tarifa_hora viene de configuracion_sitio (estudio / tarifa_hora).
 */

export function calcularHoras(horaInicio: string, horaFin: string): number {
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFin.split(':').map(Number);
  const minutos = hf * 60 + mf - (hi * 60 + mi);
  return minutos > 0 ? minutos / 60 : 0;
}

export function estimarTotalReserva(
  tarifaHora: number,
  horas: number,
  servicios: ItemReservaServicio[],
  equipos: ItemReservaEquipo[],
): { subtotalServicios: number; subtotalEquipos: number; total: number } {
  const subtotalServicios = servicios.reduce((acc, s) => acc + s.precioPorHora * (s.horas || horas), 0);
  const subtotalEquipos = equipos.reduce((acc, e) => acc + e.precioPorHora * e.cantidad * (e.horas || horas), 0);
  const total = Math.round((tarifaHora + subtotalServicios + subtotalEquipos) * horas * 100) / 100;
  return {
    subtotalServicios: Math.round(subtotalServicios * 100) / 100,
    subtotalEquipos: Math.round(subtotalEquipos * 100) / 100,
    total,
  };
}

/**
 * Disponibilidad del salón: el recurso es único; no puede traslapar con
 * otra reserva no cancelada ni con un bloqueo (exclusion constraint + triggers
 * validar_reserva y validar_horario_atencion, 000018 y 000029).
 */
export function horarioDisponible(
  ocupados: { inicio: string; fin: string }[],
  inicioPropuesto: string,
  finPropuesto: string,
): boolean {
  const inicio = new Date(inicioPropuesto).getTime();
  const fin = new Date(finPropuesto).getTime();
  if (Number.isNaN(inicio) || Number.isNaN(fin) || fin <= inicio) return false;
  return !ocupados.some((o) => {
    const oi = new Date(o.inicio).getTime();
    const of = new Date(o.fin).getTime();
    return inicio < of && oi < fin;
  });
}

/** Equipos disponibles respetando cantidad_total del inventario. */
export function equipoDisponible(equipo: EquipoEstudio, cantidadSolicitada: number): boolean {
  return equipo.activo && cantidadSolicitada > 0 && cantidadSolicitada <= equipo.cantidadTotal;
}

export function servicioDisponible(servicio: ServicioEstudio): boolean {
  return servicio.activo;
}
