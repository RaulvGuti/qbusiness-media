'use server';

import { revalidatePath } from 'next/cache';
import {
  actualizarEstadoPagoReserva,
  actualizarEstadoReserva,
  crearFechaBloqueada,
  eliminarFechaBloqueada,
  listarEquiposDeReserva,
  listarFechasBloqueadas,
  listarReservas,
  listarServiciosDeReserva,
} from '@/server/repositories/estudio';
import type {
  EstadoPagoReserva,
  EstadoReserva,
  FechaBloqueada,
  ReservaEquipo,
  ReservaEstudio,
  ReservaServicio,
} from '@/types/estudio';

/**
 * Servicio `admin` de reservas en el servidor de Next.js.
 * Coordina el panel `/admin/reservas` y responde a las solicitudes creadas
 * por el módulo `clients` (cambios de estado, revisión de pagos y bloqueos).
 */

export async function obtenerPanelReservasAdmin(): Promise<{
  reservas: ReservaEstudio[];
  fechasBloqueadas: FechaBloqueada[];
}> {
  const [reservas, fechasBloqueadas] = await Promise.all([
    listarReservas(),
    listarFechasBloqueadas(),
  ]);

  return { reservas, fechasBloqueadas };
}

export async function obtenerDesgloseReservaAdmin(reservaId: string): Promise<{
  servicios: ReservaServicio[];
  equipos: ReservaEquipo[];
}> {
  const [servicios, equipos] = await Promise.all([
    listarServiciosDeReserva(reservaId),
    listarEquiposDeReserva(reservaId),
  ]);

  return { servicios, equipos };
}

export async function cambiarEstadoReservaAdminAction(
  id: string,
  estado: EstadoReserva,
): Promise<void> {
  await actualizarEstadoReserva(id, estado);
  revalidatePath('/admin/reservas');
  revalidatePath('/admin/dashboard');
  revalidatePath('/renta');
}

export async function cambiarEstadoPagoReservaAdminAction(
  id: string,
  estadoPago: EstadoPagoReserva,
): Promise<void> {
  await actualizarEstadoPagoReserva(id, estadoPago);
  revalidatePath('/admin/reservas');
  revalidatePath('/admin/dashboard');
}

export async function crearBloqueoCalendarioAdminAction(datos: {
  desde: string;
  hasta: string;
  horaDesde: string | null;
  horaHasta: string | null;
  motivo: string | null;
}): Promise<FechaBloqueada> {
  if (!datos.desde || !datos.hasta) {
    throw new Error('Debes indicar las fechas desde y hasta.');
  }
  if (datos.hasta < datos.desde) {
    throw new Error('La fecha final no puede ser anterior a la fecha inicial.');
  }
  if ((datos.horaDesde && !datos.horaHasta) || (!datos.horaDesde && datos.horaHasta)) {
    throw new Error('Si bloqueas un horario parcial, indica tanto la hora inicial como la final.');
  }
  if (datos.horaDesde && datos.horaHasta && datos.horaHasta <= datos.horaDesde) {
    throw new Error('La hora final del bloqueo debe ser posterior a la hora inicial.');
  }

  const bloqueo = await crearFechaBloqueada(datos);
  revalidatePath('/admin/reservas');
  revalidatePath('/renta');

  return bloqueo;
}

export async function eliminarBloqueoCalendarioAdminAction(id: string): Promise<void> {
  await eliminarFechaBloqueada(id);
  revalidatePath('/admin/reservas');
  revalidatePath('/renta');
}
