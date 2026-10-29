'use server';

import { revalidatePath } from 'next/cache';
import {
  cancelarReservaDeCliente,
  listarEquiposActivos,
  listarReservasDeCliente,
  listarServiciosActivos,
  obtenerConfiguracionEstudio,
  obtenerHorariosOcupados,
  obtenerPerfilClienteActual,
  solicitarReserva,
  subirComprobantePagoDeCliente,
} from '@/server/repositories/estudio';
import {
  calcularHoras,
  equipoDisponible,
  horarioDisponible,
  servicioDisponible,
} from '@/server/services/reserva';
import type { PerfilUsuario } from '@/types/config';
import type {
  ConfiguracionEstudio,
  EquipoEstudio,
  HorarioOcupado,
  ReservaEstudio,
  ServicioEstudio,
  SolicitarReservaInput,
} from '@/types/estudio';

const REGEX_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^\d{2}:\d{2}(:\d{2})?$/;

/**
 * Servicio `clients` de reservas en el servidor de Next.js.
 * Coordina lo que el cliente ve e interactúa en `/renta`, consumiendo la
 * configuración, tarifas y bloqueos administrados desde el módulo `admin`.
 */

export async function obtenerCatalogoEstudioCliente(): Promise<{
  servicios: ServicioEstudio[];
  equipos: EquipoEstudio[];
  configuracion: ConfiguracionEstudio;
  cliente: PerfilUsuario | null;
}> {
  const [servicios, equipos, configuracion, cliente] = await Promise.all([
    listarServiciosActivos(),
    listarEquiposActivos(),
    obtenerConfiguracionEstudio(),
    obtenerPerfilClienteActual(),
  ]);

  return { servicios, equipos, configuracion, cliente };
}

export async function obtenerSesionClienteReserva(): Promise<PerfilUsuario | null> {
  return obtenerPerfilClienteActual();
}

export async function verificarDisponibilidadHorarioCliente(
  fecha: string,
  horaInicio: string,
  horaFin: string,
): Promise<{
  disponible: boolean;
  motivo: string | null;
  ocupados: HorarioOcupado[];
}> {
  if (
    !REGEX_FECHA.test(fecha) ||
    !REGEX_HORA.test(horaInicio) ||
    !REGEX_HORA.test(horaFin) ||
    calcularHoras(horaInicio.slice(0, 5), horaFin.slice(0, 5)) <= 0
  ) {
    return {
      disponible: false,
      motivo: 'La hora de fin debe ser posterior a la hora de inicio.',
      ocupados: [],
    };
  }

  const hIni = horaInicio.slice(0, 5);
  const hFin = horaFin.slice(0, 5);
  const inicioIso = `${fecha}T${hIni}:00-06:00`;
  const finIso = `${fecha}T${hFin}:00-06:00`;

  if (new Date(inicioIso).getTime() <= Date.now()) {
    return {
      disponible: false,
      motivo: 'No se puede reservar en una fecha u hora pasada.',
      ocupados: [],
    };
  }

  const [config, ocupados] = await Promise.all([
    obtenerConfiguracionEstudio(),
    obtenerHorariosOcupados(fecha, fecha),
  ]);

  if (hIni < config.horaApertura.slice(0, 5) || hFin > config.horaCierre.slice(0, 5)) {
    return {
      disponible: false,
      motivo: `El horario de atención es de ${config.horaApertura} a ${config.horaCierre}.`,
      ocupados,
    };
  }

  if (!horarioDisponible(ocupados, inicioIso, finIso)) {
    return {
      disponible: false,
      motivo: 'Ese horario ya está reservado o bloqueado en el calendario.',
      ocupados,
    };
  }

  return {
    disponible: true,
    motivo: null,
    ocupados,
  };
}

export async function enviarSolicitudReservaCliente(
  input: SolicitarReservaInput,
): Promise<{ reservaId: string }> {
  const cliente = await obtenerPerfilClienteActual();
  if (!cliente) {
    throw new Error('Debes registrarte e iniciar sesión con tu cuenta para reservar el estudio.');
  }

  const nombre = input.nombre?.trim() ?? '';
  const correo = input.correo?.trim() ?? '';
  const telefono = input.telefono?.trim() ?? '';

  if (!nombre) {
    throw new Error('Indica tu nombre completo.');
  }
  if (!correo || !REGEX_CORREO.test(correo)) {
    throw new Error('Indica un correo electrónico válido.');
  }
  if (!telefono) {
    throw new Error('Indica un teléfono o WhatsApp de contacto.');
  }

  const [disponibilidad, serviciosActivos, equiposActivos] = await Promise.all([
    verificarDisponibilidadHorarioCliente(
      input.fecha,
      input.horaInicio,
      input.horaFin,
    ),
    listarServiciosActivos(),
    listarEquiposActivos(),
  ]);

  if (!disponibilidad.disponible) {
    throw new Error(disponibilidad.motivo ?? 'El horario seleccionado no está disponible.');
  }

  // Validar que todos los servicios solicitados estén activos
  const serviciosUnicos = Array.from(new Set(input.servicios));
  for (const sId of serviciosUnicos) {
    const srv = serviciosActivos.find((s) => s.id === sId);
    if (!srv || !servicioDisponible(srv)) {
      throw new Error('Alguno de los servicios seleccionados no existe o no está disponible.');
    }
  }

  // Agrupar equipos y validar existencia y stock disponible
  const mapaEquipos = new Map<string, number>();
  for (const item of input.equipos) {
    if (!item.equipoId || !Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      throw new Error('Cada equipo debe indicar una cantidad entera mayor a 0.');
    }
    mapaEquipos.set(item.equipoId, (mapaEquipos.get(item.equipoId) ?? 0) + item.cantidad);
  }

  const equiposAgrupados = Array.from(mapaEquipos.entries()).map(([equipoId, cantidad]) => {
    const eq = equiposActivos.find((e) => e.id === equipoId);
    if (!eq || !equipoDisponible(eq, cantidad)) {
      throw new Error(
        'Alguno de los equipos seleccionados no está disponible o supera el stock.',
      );
    }
    return { equipoId, cantidad };
  });

  const reservaId = await solicitarReserva({
    nombre,
    correo,
    telefono,
    fecha: input.fecha,
    horaInicio: input.horaInicio.slice(0, 5),
    horaFin: input.horaFin.slice(0, 5),
    notas: input.notas?.trim() || undefined,
    servicios: serviciosUnicos,
    equipos: equiposAgrupados,
  });

  revalidatePath('/renta');
  revalidatePath('/admin/reservas');
  revalidatePath('/admin/dashboard');

  return { reservaId };
}

export async function obtenerReservasDeCliente(
  clienteId: string,
): Promise<ReservaEstudio[]> {
  return listarReservasDeCliente(clienteId);
}

export async function cancelarReservaClienteAction(id: string): Promise<void> {
  await cancelarReservaDeCliente(id);
  revalidatePath('/renta');
  revalidatePath('/admin/reservas');
  revalidatePath('/admin/dashboard');
}

export async function subirComprobantePagoClienteAction(
  id: string,
  urlComprobantePago: string,
): Promise<void> {
  const url = urlComprobantePago.trim();
  if (!url) {
    throw new Error('Debes indicar el enlace del comprobante de pago.');
  }

  await subirComprobantePagoDeCliente(id, url);
  revalidatePath('/renta');
  revalidatePath('/admin/reservas');
}
