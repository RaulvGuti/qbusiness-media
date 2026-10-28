'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminPrincipal } from '@/server/auth/require-admin';
import { guardarConfiguraciones } from '@/server/repositories/configuracion';
import { buscarCampo, validarValor } from '@/lib/config-sitio';
import type { CambioConfigSitio } from '@/types/config';

export type ResultadoGuardarConfig =
  | { ok: true; guardados: number }
  | { ok: false; error: string };

/**
 * Guarda los textos y enlaces editados desde el panel.
 *
 * La escritura pasa por la sesión del administrador (no por service role), así
 * que RLS vuelve a exigir `admin_principal` (000038). Los errores esperados se
 * devuelven como resultado para que el formulario los muestre sin depender de
 * cómo Next.js serializa las excepciones de una Server Action.
 */
export async function guardarConfiguracionSitio(
  cambios: CambioConfigSitio[],
): Promise<ResultadoGuardarConfig> {
  let acceso: Awaited<ReturnType<typeof requireAdminPrincipal>>;

  try {
    acceso = await requireAdminPrincipal();
  } catch {
    return {
      ok: false,
      error: 'No se pudo verificar tu sesión. Vuelve a intentarlo.',
    };
  }

  if (!acceso.authorized) {
    return {
      ok: false,
      error:
        acceso.status === 401
          ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
          : 'Solo el administrador principal puede editar la configuración del sitio.',
    };
  }

  if (!Array.isArray(cambios) || cambios.length === 0) {
    return { ok: true, guardados: 0 };
  }

  if (cambios.length > 100) {
    return {
      ok: false,
      error: 'Demasiados cambios en una sola operación.',
    };
  }

  let guardados = 0;

  try {
    const normalizados = new Map<
      string,
      { grupo: CambioConfigSitio['grupo']; clave: string; valor: string }
    >();

    for (const cambio of cambios) {
      if (
        !cambio ||
        typeof cambio.grupo !== 'string' ||
        typeof cambio.clave !== 'string' ||
        typeof cambio.valor !== 'string'
      ) {
        throw new Error('Los datos de configuración no son válidos.');
      }

      const campo = buscarCampo(cambio.grupo, cambio.clave);

      if (!campo) {
        throw new Error('Se intentó guardar un campo no permitido.');
      }

      normalizados.set(`${campo.grupo}:${campo.clave}`, {
        grupo: campo.grupo,
        clave: campo.clave,
        valor: validarValor(campo, cambio.valor),
      });
    }

    await guardarConfiguraciones([...normalizados.values()]);
    guardados = normalizados.size;
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la configuración. Intenta de nuevo.',
    };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/admin/textos');

  return { ok: true, guardados };
}
