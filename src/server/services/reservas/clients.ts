'use server';

import { revalidatePath } from 'next/cache';
import {
  cancelarReservaDeCliente,
  contarPendientesDeCliente,
  listarEquiposActivos,
  listarPaquetesActivos,
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
import { calcularHoraFin } from '@/lib/estudio-paquetes';
import type { PerfilUsuario } from '@/types/config';
import type {
  CodigoResultadoReserva,
  ConfiguracionEstudio,
  EquipoEstudio,
  HorarioOcupado,
  PaqueteEstudio,
  ReservaEstudio,
  ResultadoSolicitudReserva,
  ServicioEstudio,
  SolicitarReservaInput,
} from '@/types/estudio';

const REGEX_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^\d{2}:\d{2}(:\d{2})?$/;

const MENSAJE_PAQUETE_NO_DISPONIBLE =
  'El paquete que elegiste ya no está disponible porque fue desactivado o eliminado. Actualiza la página y selecciona otro paquete.';
const MENSAJE_ERROR_INESPERADO =
  'No se pudo completar la solicitud de reserva. Inténtalo de nuevo o contacta al equipo.';

function fallo(
  codigo: CodigoResultadoReserva,
  mensaje: string,
): ResultadoSolicitudReserva {
  return { ok: false, codigo, mensaje };
}

function mensajeLimitePendientes(maximo: number): string {
  if (maximo <= 1) {
    return 'Ya tienes una solicitud pendiente. Espera a que el equipo la confirme o cancélala antes de solicitar otra.';
  }
  return `Ya tienes ${maximo} solicitudes pendientes. Espera a que el equipo las confirme o cancélalas antes de solicitar otra.`;
}

/**
 * Traduce un error de la RPC o del repositorio a un resultado serializable.
 * Nunca se lanza un error esperado a través del límite servidor/cliente:
 * en producción React lo reemplaza por un mensaje genérico (#441).
 */
function clasificarErrorReserva(error: unknown): ResultadoSolicitudReserva {
  const mensaje = error instanceof Error ? error.message.trim() : '';
  const normalizado = mensaje.toLowerCase();

  if (
    normalizado.includes('paquete seleccionado') ||
    normalizado.includes('p_paquete_id')
  ) {
    return fallo('PAQUETE_NO_DISPONIBLE', MENSAJE_PAQUETE_NO_DISPONIBLE);
  }

  if (
    normalizado.includes('solicitud pendiente') ||
    normalizado.includes('solicitudes pendientes') ||
    normalizado.includes('max_pendientes')
  ) {
    return fallo(
      'LIMITE_PENDIENTES',
      mensaje || mensajeLimitePendientes(1),
    );
  }

  if (normalizado.includes('servicios')) {
    return fallo(
      'SERVICIO_NO_DISPONIBLE',
      'Alguno de los servicios seleccionados no existe o no está disponible.',
    );
  }

  if (normalizado.includes('equipos')) {
    return fallo(
      'EQUIPO_NO_DISPONIBLE',
      'Alguno de los equipos seleccionados no está disponible o supera el stock.',
    );
  }

  if (
    normalizado.includes('horario') ||
    normalizado.includes('reservado') ||
    normalizado.includes('bloqueado')
  ) {
    return fallo(
      'HORARIO_NO_DISPONIBLE',
      mensaje || 'Ese horario ya no está disponible. Elige otro horario.',
    );
  }

  if (
    normalizado.includes('permisos') ||
    normalizado.includes('sesión') ||
    normalizado.includes('sesion') ||
    normalizado.includes('row-level')
  ) {
    return fallo(
      'SESION_REQUERIDA',
      mensaje || 'Tu sesión expiró. Inicia sesión de nuevo para reservar.',
    );
  }

  if (normalizado.includes('000042')) {
    return fallo('ERROR_INESPERADO', mensaje);
  }

  const codigoError =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';
  console.error(
    '[reservas] Error inesperado al solicitar una reserva:',
    codigoError || 'sin código',
  );
  return fallo('ERROR_INESPERADO', MENSAJE_ERROR_INESPERADO);
}

/**
 * Servicio `clients` de reservas en el servidor de Next.js.
 * Coordina lo que el cliente ve e interactúa en `/renta`, consumiendo la
 * configuración, tarifas y bloqueos administrados desde el módulo `admin`.
 */

export async function obtenerCatalogoEstudioCliente(): Promise<{
  servicios: ServicioEstudio[];
  equipos: EquipoEstudio[];
  paquetes: PaqueteEstudio[];
  configuracion: ConfiguracionEstudio;
  cliente: PerfilUsuario | null;
}> {
  const [servicios, equipos, paquetes, configuracion, cliente] = await Promise.all([
    listarServiciosActivos(),
    listarEquiposActivos(),
    listarPaquetesActivos(),
    obtenerConfiguracionEstudio(),
    obtenerPerfilClienteActual(),
  ]);

  return { servicios, equipos, paquetes, configuracion, cliente };
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
): Promise<ResultadoSolicitudReserva> {
  try {
    const cliente = await obtenerPerfilClienteActual();
    if (!cliente) {
      return fallo(
        'SESION_REQUERIDA',
        'Debes registrarte e iniciar sesión con tu cuenta para reservar el estudio.',
      );
    }

    const nombre = input.nombre?.trim() ?? '';
    const correo = input.correo?.trim() ?? '';
    const telefono = input.telefono?.trim() ?? '';

    if (!nombre) {
      return fallo('DATOS_INVALIDOS', 'Indica tu nombre completo.');
    }
    if (!correo || !REGEX_CORREO.test(correo)) {
      return fallo('DATOS_INVALIDOS', 'Indica un correo electrónico válido.');
    }
    if (!telefono) {
      return fallo('DATOS_INVALIDOS', 'Indica un teléfono o WhatsApp de contacto.');
    }

    const [
      paquetesActivos,
      serviciosActivos,
      equiposActivos,
      configuracion,
      pendientes,
    ] = await Promise.all([
      listarPaquetesActivos(),
      listarServiciosActivos(),
      listarEquiposActivos(),
      obtenerConfiguracionEstudio(),
      contarPendientesDeCliente(cliente.id),
    ]);

    const paquete = paquetesActivos.find((p) => p.id === input.paqueteId);
    if (!paquete) {
      return fallo('PAQUETE_NO_DISPONIBLE', MENSAJE_PAQUETE_NO_DISPONIBLE);
    }

    if (pendientes >= configuracion.maxPendientesPorCliente) {
      return fallo(
        'LIMITE_PENDIENTES',
        mensajeLimitePendientes(configuracion.maxPendientesPorCliente),
      );
    }

    // La hora de fin la manda el paquete, no el navegador.
    const horaFin = calcularHoraFin(input.horaInicio, paquete.horas);
    if (!horaFin) {
      return fallo(
        'DATOS_INVALIDOS',
        'El paquete seleccionado termina después de la medianoche. Elige una hora de inicio más temprana.',
      );
    }

    const disponibilidad = await verificarDisponibilidadHorarioCliente(
      input.fecha,
      input.horaInicio,
      horaFin,
    );

    if (!disponibilidad.disponible) {
      return fallo(
        'HORARIO_NO_DISPONIBLE',
        disponibilidad.motivo ?? 'El horario seleccionado no está disponible.',
      );
    }

    // Validar que todos los servicios solicitados estén activos
    const serviciosUnicos = Array.from(new Set(input.servicios));
    for (const sId of serviciosUnicos) {
      const srv = serviciosActivos.find((s) => s.id === sId);
      if (!srv || !servicioDisponible(srv)) {
        return fallo(
          'SERVICIO_NO_DISPONIBLE',
          'Alguno de los servicios seleccionados no existe o no está disponible.',
        );
      }
    }

    // Agrupar equipos y validar existencia y stock disponible
    const mapaEquipos = new Map<string, number>();
    for (const item of input.equipos) {
      if (!item.equipoId || !Number.isInteger(item.cantidad) || item.cantidad <= 0) {
        return fallo(
          'DATOS_INVALIDOS',
          'Cada equipo debe indicar una cantidad entera mayor a 0.',
        );
      }
      mapaEquipos.set(item.equipoId, (mapaEquipos.get(item.equipoId) ?? 0) + item.cantidad);
    }

    for (const [equipoId, cantidad] of mapaEquipos.entries()) {
      const eq = equiposActivos.find((e) => e.id === equipoId);
      if (!eq || !equipoDisponible(eq, cantidad)) {
        return fallo(
          'EQUIPO_NO_DISPONIBLE',
          'Alguno de los equipos seleccionados no está disponible o supera el stock.',
        );
      }
    }

    const equiposAgrupados = Array.from(mapaEquipos.entries()).map(([equipoId, cantidad]) => ({
      equipoId,
      cantidad,
    }));

    const reservaId = await solicitarReserva({
      nombre,
      correo,
      telefono,
      fecha: input.fecha,
      horaInicio: input.horaInicio.slice(0, 5),
      horaFin,
      paqueteId: paquete.id,
      notas: input.notas?.trim() || undefined,
      servicios: serviciosUnicos,
      equipos: equiposAgrupados,
    });

    revalidatePath('/renta');
    revalidatePath('/admin/reservas');
    revalidatePath('/admin/dashboard');

    return { ok: true, reservaId };
  } catch (error) {
    return clasificarErrorReserva(error);
  }
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
