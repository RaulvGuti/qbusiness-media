import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireAdminPrincipal } from '@/server/auth/require-admin';
import { esUuid } from '@/lib/utils/galeria-publica';
import {
  MENSAJE_FORMATO_NO_PERMITIDO,
  mensajeTamanoExcedido,
  tipoGaleriaPermitido,
} from '@/lib/utils/galeria-mime';
import {
  claveDesdeUrlR2,
  crearFirmaSubidaR2,
  eliminarObjetoR2,
} from '@/server/storage/r2';
import type {
  CodigoResultadoGaleria,
  FirmaSubidaGaleria,
  ResultadoGaleria,
} from '@/types/portafolio';

export const runtime = 'nodejs';

function responderError(
  codigo: CodigoResultadoGaleria,
  mensaje: string,
  status: number,
) {
  return NextResponse.json(
    { ok: false, codigo, mensaje } satisfies ResultadoGaleria<never>,
    { status },
  );
}

function responderDatos<T>(data: T, status = 200) {
  return NextResponse.json(
    { ok: true, data } satisfies ResultadoGaleria<T>,
    { status },
  );
}

function esErrorDeConfiguracion(mensaje: string): boolean {
  return /NEXT_PUBLIC_CDN_URL|CLOUDFLARE_ACCOUNT_ID|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|R2_BUCKET_NAME|R2_MOCK|Falta|Faltan/i.test(
    mensaje,
  );
}

export async function POST(request: Request) {
  const acceso = await requireAdminPrincipal();

  if (!acceso.authorized) {
    const sinSesion = acceso.status === 401;
    return responderError(
      sinSesion ? 'SIN_SESION' : 'SIN_PERMISO',
      sinSesion
        ? 'Inicia sesión para subir archivos.'
        : 'No tienes permiso para subir archivos.',
      acceso.status,
    );
  }

  let cuerpo: unknown;

  try {
    cuerpo = await request.json();
  } catch {
    return responderError(
      'DATOS_INVALIDOS',
      'La solicitud no es válida.',
      400,
    );
  }

  const datos = cuerpo as {
    carpetaId?: unknown;
    tipoMime?: unknown;
    tamano?: unknown;
  };

  const carpetaId = typeof datos.carpetaId === 'string' ? datos.carpetaId : '';
  const tipoMime = typeof datos.tipoMime === 'string' ? datos.tipoMime : '';
  const tamano = typeof datos.tamano === 'number' ? datos.tamano : 0;

  if (!esUuid(carpetaId)) {
    return responderError(
      'CARPETA_INVALIDA',
      'La carpeta de destino no es válida.',
      400,
    );
  }

  const tipo = tipoGaleriaPermitido(tipoMime);

  if (!tipo) {
    return responderError(
      'MIME_NO_PERMITIDO',
      MENSAJE_FORMATO_NO_PERMITIDO,
      400,
    );
  }

  if (!Number.isFinite(tamano) || tamano <= 0) {
    return responderError(
      'DATOS_INVALIDOS',
      'El archivo está vacío o no se pudo leer.',
      400,
    );
  }

  if (tamano > tipo.maxBytes) {
    return responderError(
      'ARCHIVO_MUY_GRANDE',
      mensajeTamanoExcedido(tipo),
      413,
    );
  }

  const { data: carpeta, error } = await acceso.supabase
    .from('carpetas_galeria')
    .select('id')
    .eq('id', carpetaId)
    .maybeSingle();

  if (error) {
    return responderError(
      'ERROR_BD',
      'No se pudo comprobar la carpeta de destino.',
      500,
    );
  }

  if (!carpeta) {
    return responderError(
      'CARPETA_INVALIDA',
      'La carpeta no existe o no tienes acceso.',
      403,
    );
  }

  const key = `galeria/${carpetaId}/${randomUUID()}.${tipo.extension}`;

  try {
    const firma = await crearFirmaSubidaR2({
      key,
      contentType: tipo.mime,
    });

    return responderDatos<FirmaSubidaGaleria>(firma);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : '';
    const configuracion = esErrorDeConfiguracion(mensaje);

    console.error(
      'No se pudo firmar la subida a R2:',
      mensaje || 'error desconocido',
    );

    return responderError(
      configuracion ? 'SIN_CONFIGURACION' : 'ERROR_R2',
      configuracion
        ? 'El almacenamiento de la galería no está configurado. Avisa al equipo.'
        : 'No se pudo preparar la subida. Inténtalo de nuevo.',
      500,
    );
  }
}

/** Limpia un objeto si la subida funcionó pero el registro en la BD falló. */
export async function DELETE(request: Request) {
  const acceso = await requireAdminPrincipal();

  if (!acceso.authorized) {
    const sinSesion = acceso.status === 401;
    return responderError(
      sinSesion ? 'SIN_SESION' : 'SIN_PERMISO',
      sinSesion
        ? 'Inicia sesión para borrar archivos.'
        : 'No tienes permiso para borrar archivos.',
      acceso.status,
    );
  }

  let cuerpo: unknown;

  try {
    cuerpo = await request.json();
  } catch {
    return responderError(
      'DATOS_INVALIDOS',
      'La solicitud no es válida.',
      400,
    );
  }

  const datos = cuerpo as { key?: unknown; publicUrl?: unknown };

  const key =
    typeof datos.key === 'string'
      ? datos.key
      : typeof datos.publicUrl === 'string'
        ? claveDesdeUrlR2(datos.publicUrl)
        : null;

  if (!key || !key.startsWith('galeria/')) {
    return responderError(
      'DATOS_INVALIDOS',
      'El objeto no es válido.',
      400,
    );
  }

  try {
    await eliminarObjetoR2(key);
    return responderDatos({ eliminado: true });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : '';
    const configuracion = esErrorDeConfiguracion(mensaje);

    console.error(
      'No se pudo borrar el objeto de R2:',
      mensaje || 'error desconocido',
    );

    return responderError(
      configuracion ? 'SIN_CONFIGURACION' : 'ERROR_R2',
      configuracion
        ? 'El almacenamiento de la galería no está configurado. Avisa al equipo.'
        : 'No se pudo borrar el objeto.',
      500,
    );
  }
}
