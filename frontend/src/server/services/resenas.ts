import type { ReservaEstudio } from '@/types/estudio';
import type { ResenaClienteResumen } from '@/types/resenas';

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
    return 'Necesitas una reserva completada y sin reseña para dejar tu opinión.';
  }
  if (reservaPropia.estado !== 'completada') {
    return 'Tu reseña se habilitará cuando tu reserva se marque como completada.';
  }
  return null;
}

/** Mensaje de bloqueo que además explica el estado de las reservas del cliente. */
export function motivoBloqueoResenaDetallado(
  tieneSesion: boolean,
  reservas: Pick<ReservaEstudio, 'id' | 'estado'>[],
  resenas: Pick<ResenaClienteResumen, 'reservaId' | 'estado'>[],
): string | null {
  if (!tieneSesion) {
    return 'Inicia sesión con tu cuenta de cliente para dejar una reseña.';
  }

  const reservaResenable = reservas.find(
    (reserva) =>
      reserva.estado === 'completada' &&
      !resenas.some((resena) => resena.reservaId === reserva.id),
  );

  if (reservaResenable) {
    return null;
  }

  if (reservas.length === 0) {
    return 'Aún no tienes reservas. Solicita una en Renta de Estudio para poder reseñar.';
  }

  const completada = reservas.find((reserva) => reserva.estado === 'completada');
  if (completada) {
    const resena = resenas.find(
      (item) => item.reservaId === completada.id,
    );
    if (resena) {
      return `Ya dejaste una reseña para tu reserva. Su estado es: ${etiquetaEstadoResena(resena.estado)}.`;
    }
  }

  return `Tu reserva más reciente está ${etiquetaEstadoReserva(reservas[0].estado)}. La reseña se habilita cuando el equipo la marca como completada.`;
}

export function etiquetaEstadoReserva(
  estado: ReservaEstudio['estado'],
): string {
  const etiquetas: Record<ReservaEstudio['estado'], string> = {
    pendiente: 'pendiente',
    confirmada: 'confirmada',
    cancelada: 'cancelada',
    completada: 'completada',
  };
  return etiquetas[estado];
}

export function etiquetaEstadoResena(
  estado: ResenaClienteResumen['estado'],
): string {
  const etiquetas: Record<ResenaClienteResumen['estado'], string> = {
    pendiente: 'pendiente de aprobación',
    aprobada: 'aprobada',
    rechazada: 'rechazada',
  };
  return etiquetas[estado];
}
