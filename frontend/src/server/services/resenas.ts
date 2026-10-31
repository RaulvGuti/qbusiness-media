import type { ReservaEstudio } from '@/types/estudio';

/**
 * Reglas de reseñas alineadas a la RLS de resenas_clientes (000026).
 * INSERT como cliente solo si: hay sesión, la reserva le pertenece y su
 * estado es 'completada'. El admin puede escribir con origen='admin'
 * sin reserva vinculada.
 */
export function puedeDejarResena(
  tieneSesion: boolean,
  reservaPropia: Pick<ReservaEstudio, 'estado'> | null,
): boolean {
  return tieneSesion && reservaPropia !== null && reservaPropia.estado === 'completada';
}

export function motivoBloqueoResena(
  tieneSesion: boolean,
  reservaPropia: Pick<ReservaEstudio, 'estado'> | null,
): string | null {
  if (!tieneSesion) {
    return 'Inicia sesión con tu cuenta de cliente para dejar una reseña.';
  }
  if (!reservaPropia) {
    return 'Solo clientes con una reserva pueden dejar una reseña.';
  }
  if (reservaPropia.estado !== 'completada') {
    return 'Tu reseña se habilitará cuando tu reserva se marque como completada.';
  }
  return null;
}
