/**
 * Reglas compartidas de paquetes de renta y lealtad (000042).
 *
 * Este módulo no importa nada del servidor: lo usan tanto las pantallas
 * públicas como los servicios del servidor para que el estimado del navegador
 * y el cálculo definitivo de la RPC hablen el mismo idioma.
 */

export const RESERVAS_PARA_DESCUENTO = 5;
export const PORCENTAJE_DESCUENTO_LEALTAD = 0.25;

/** Horas de un paquete, normalizadas a número. */
export function normalizarHorasPaquete(horas: number | string): number {
  const valor = typeof horas === 'number' ? horas : Number(horas);
  return Number.isFinite(valor) && valor > 0 ? valor : 0;
}

/** Descuento que corresponde a un historial de reservas completadas. */
export function descuentoLealtad(
  precioPaquete: number,
  reservasCompletadas: number,
): { aplica: boolean; monto: number; precioFinal: number } {
  const precio = Number.isFinite(precioPaquete) && precioPaquete > 0 ? precioPaquete : 0;
  const aplica = reservasCompletadas >= RESERVAS_PARA_DESCUENTO;
  const monto = aplica
    ? Math.round(precio * PORCENTAJE_DESCUENTO_LEALTAD * 100) / 100
    : 0;

  return {
    aplica,
    monto,
    precioFinal: Math.round((precio - monto) * 100) / 100,
  };
}

/**
 * Suma horas a una hora `HH:MM` y devuelve `HH:MM` o `null` si cruza de día.
 * La reserva del salón debe empezar y terminar el mismo día (000029).
 */
export function calcularHoraFin(
  horaInicio: string,
  horas: number,
): string | null {
  const [h, m] = horaInicio.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m) || horas <= 0) return null;

  const minutos = h * 60 + m + Math.round(horas * 60);
  if (minutos >= 24 * 60) return null;

  const hh = Math.floor(minutos / 60);
  const mm = minutos % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Texto legible de horas: 1.5 -> "1.5 h", 2 -> "2 h". */
export function etiquetaHoras(horas: number): string {
  return `${Number(horas.toFixed(1))} h`;
}
