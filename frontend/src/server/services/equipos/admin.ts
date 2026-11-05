'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminPrincipal } from '@/server/auth/require-admin';
import {
  actualizarEquipoEstudio,
  cambiarActivoEquipoEstudio,
  crearEquipoEstudio,
  listarEquiposAdmin,
} from '@/server/repositories/estudio';
import type { EquipoEstudio, EquipoEstudioInput } from '@/types/estudio';

/**
 * Administración del inventario de equipos (000005 + 000042).
 *
 * El panel puede crear, editar y activar/desactivar equipos. La disponibilidad
 * pública depende de `inventario_equipos.activo`: un equipo inactivo no se
 * ofrece ni se puede reservar, pero se conserva para no perder el historial.
 */

function validar(input: EquipoEstudioInput) {
  const nombre = input.nombre?.trim() ?? '';
  const cantidadTotal = Number(input.cantidadTotal);
  const precioPorHora = Number(input.precioPorHora);

  if (!nombre) {
    throw new Error('Escribe un nombre para el equipo.');
  }
  if (nombre.length > 120) {
    throw new Error('El nombre del equipo no puede superar 120 caracteres.');
  }
  if (!Number.isInteger(cantidadTotal) || cantidadTotal < 0) {
    throw new Error('La cantidad total debe ser un entero mayor o igual a 0.');
  }
  if (!Number.isFinite(precioPorHora) || precioPorHora < 0) {
    throw new Error('La tarifa por hora no puede ser negativa.');
  }

  return {
    ...input,
    nombre,
    descripcion: input.descripcion?.trim() || null,
    cantidadTotal,
    precioPorHora,
  };
}

async function exigirPrincipal() {
  const acceso = await requireAdminPrincipal();
  if (!acceso.authorized) {
    throw new Error('Solo el administrador principal puede modificar el inventario.');
  }
  return acceso;
}

export async function listarEquiposAdminAction(): Promise<EquipoEstudio[]> {
  await exigirPrincipal();
  return listarEquiposAdmin();
}

export async function guardarEquipoAction(
  id: string | null,
  input: EquipoEstudioInput,
): Promise<EquipoEstudio> {
  await exigirPrincipal();
  const datos = validar(input);

  const equipo = id
    ? await actualizarEquipoEstudio(id, datos)
    : await crearEquipoEstudio(datos);

  revalidatePath('/admin/equipo');
  revalidatePath('/renta');
  return equipo;
}

export async function cambiarActivoEquipoAction(
  id: string,
  activo: boolean,
): Promise<void> {
  await exigirPrincipal();
  await cambiarActivoEquipoEstudio(id, activo);
  revalidatePath('/admin/equipo');
  revalidatePath('/renta');
}
