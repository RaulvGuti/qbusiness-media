'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminPrincipal } from '@/server/auth/require-admin';
import {
  actualizarPaqueteEstudio,
  cambiarActivoPaqueteEstudio,
  crearPaqueteEstudio,
  listarPaquetesAdmin,
} from '@/server/repositories/estudio';
import type { PaqueteEstudio, PaqueteEstudioInput } from '@/types/estudio';

/**
 * Reglas del catálogo de paquetes de renta (000042).
 *
 * Solo el administrador principal puede modificarlo. Los paquetes sustituyen
 * por completo la tarifa por hora: un paquete inactivo no se puede reservar y
 * sin paquetes activos el sitio público bloquea el formulario.
 */

function validar(input: PaqueteEstudioInput) {
  const nombre = input.nombre?.trim() ?? '';
  const horas = Number(input.horas);
  const precio = Number(input.precio);
  const orden = Number.isFinite(input.orden) ? Number(input.orden) : 0;

  if (!nombre) {
    throw new Error('Escribe un nombre para el paquete.');
  }
  if (nombre.length > 80) {
    throw new Error('El nombre del paquete no puede superar 80 caracteres.');
  }
  if (!Number.isFinite(horas) || horas <= 0 || horas > 24) {
    throw new Error('Las horas del paquete deben ser mayores a 0 y hasta 24.');
  }
  if (!Number.isFinite(precio) || precio < 0) {
    throw new Error('El precio del paquete no puede ser negativo.');
  }

  return { ...input, nombre, horas, precio, orden };
}

async function exigirPrincipal() {
  const acceso = await requireAdminPrincipal();
  if (!acceso.authorized) {
    throw new Error('Solo el administrador principal puede modificar los paquetes.');
  }
  return acceso;
}

export async function listarPaquetesAdminAction(): Promise<PaqueteEstudio[]> {
  await exigirPrincipal();
  return listarPaquetesAdmin();
}

export async function guardarPaqueteAction(
  id: string | null,
  input: PaqueteEstudioInput,
): Promise<PaqueteEstudio> {
  await exigirPrincipal();
  const datos = validar(input);

  try {
    const paquete = id
      ? await actualizarPaqueteEstudio(id, datos)
      : await crearPaqueteEstudio(datos);

    revalidatePath('/admin/textos');
    revalidatePath('/renta');
    return paquete;
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : '';
    if (mensaje.includes('duplicate key') || mensaje.includes('unique')) {
      throw new Error('Ya existe un paquete con ese nombre.');
    }
    throw error;
  }
}

export async function cambiarActivoPaqueteAction(
  id: string,
  activo: boolean,
): Promise<void> {
  await exigirPrincipal();
  await cambiarActivoPaqueteEstudio(id, activo);
  revalidatePath('/admin/textos');
  revalidatePath('/renta');
}
