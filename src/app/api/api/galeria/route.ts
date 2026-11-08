import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireAdminPrincipal } from '@/server/auth/require-admin';
import { esUuid } from '@/lib/utils/galeria-publica';
import {
  claveDesdeUrlR2,
  crearFirmaSubidaR2,
  eliminarObjetoR2,
} from '@/server/storage/r2';

export const runtime = 'nodejs';

const TIPOS_PERMITIDOS: Record<
  string,
  { extension: string; maxBytes: number }
> = {
  'image/jpeg': { extension: 'jpg', maxBytes: 20 * 1024 * 1024 },
  'image/jpg': { extension: 'jpg', maxBytes: 20 * 1024 * 1024 },
  'image/png': { extension: 'png', maxBytes: 20 * 1024 * 1024 },
  'image/webp': { extension: 'webp', maxBytes: 20 * 1024 * 1024 },
  'image/gif': { extension: 'gif', maxBytes: 20 * 1024 * 1024 },
  'image/avif': { extension: 'avif', maxBytes: 20 * 1024 * 1024 },
  'video/mp4': { extension: 'mp4', maxBytes: 500 * 1024 * 1024 },
  'video/webm': { extension: 'webm', maxBytes: 500 * 1024 * 1024 },
  'video/quicktime': { extension: 'mov', maxBytes: 500 * 1024 * 1024 },
};

export async function POST(request: Request) {
  const acceso = await requireAdminPrincipal();

  if (!acceso.authorized) {
    return NextResponse.json(
      {
        error:
          acceso.status === 401
            ? 'Inicia sesión para subir archivos.'
            : 'No tienes permiso para subir archivos.',
      },
      { status: acceso.status },
    );
  }

  let cuerpo: unknown;

  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'La solicitud no es válida.' },
      { status: 400 },
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
  const tipo = TIPOS_PERMITIDOS[tipoMime];

  if (
    !esUuid(carpetaId) ||
    !tipo ||
    !Number.isFinite(tamano) ||
    tamano <= 0 ||
    tamano > tipo.maxBytes
  ) {
    return NextResponse.json(
      { error: 'El archivo no es válido o supera el tamaño permitido.' },
      { status: 400 },
    );
  }

  const { data: carpeta, error } = await acceso.supabase
    .from('carpetas_galeria')
    .select('id')
    .eq('id', carpetaId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: 'No se pudo comprobar la carpeta.' },
      { status: 500 },
    );
  }

  if (!carpeta) {
    return NextResponse.json(
      { error: 'La carpeta no existe o no tienes acceso.' },
      { status: 403 },
    );
  }

  const key = `galeria/${carpetaId}/${randomUUID()}.${tipo.extension}`;

  try {
    const firma = await crearFirmaSubidaR2({
      key,
      contentType: tipoMime,
    });

    return NextResponse.json(firma);
  } catch (e) {
    console.error(
      'No se pudo firmar la subida a R2:',
      e instanceof Error ? e.message : 'error desconocido',
    );

    return NextResponse.json(
      { error: 'No se pudo preparar la subida.' },
      { status: 500 },
    );
  }
}

/** Limpia un objeto si la subida funcionó pero el registro en la BD falló. */
export async function DELETE(request: Request) {
  const acceso = await requireAdminPrincipal();

  if (!acceso.authorized) {
    return NextResponse.json(
      { error: 'No tienes permiso para borrar archivos.' },
      { status: acceso.status },
    );
  }

  let cuerpo: unknown;

  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'La solicitud no es válida.' },
      { status: 400 },
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
    return NextResponse.json(
      { error: 'El objeto no es válido.' },
      { status: 400 },
    );
  }

  try {
    await eliminarObjetoR2(key);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(
      'No se pudo borrar el objeto de R2:',
      e instanceof Error ? e.message : 'error desconocido',
    );

    return NextResponse.json(
      { error: 'No se pudo borrar el objeto.' },
      { status: 500 },
    );
  }
}
