import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cliente de Cloudflare R2.
 *
 * Este archivo es solo para el servidor: contiene las credenciales privadas.
 * Nunca debe importarse desde un Client Component.
 */

const BUCKET_POR_DEFECTO = 'qbusiness-media';

function bucketR2(): string {
  return process.env.R2_BUCKET_NAME?.trim() || BUCKET_POR_DEFECTO;
}

function cdnR2(): string {
  return (process.env.NEXT_PUBLIC_CDN_URL?.trim() ?? '').replace(/\/+$/, '');
}

let cliente: S3Client | null = null;

/** true cuando se usan credenciales de ejemplo o R2_MOCK=true. */
export function r2EstaEnMock(): boolean {
  if (process.env.R2_MOCK === 'true') return true;

  const cuenta = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? '';
  return !cuenta || cuenta.startsWith('mock');
}

function obtenerClienteR2(): S3Client {
  if (cliente) return cliente;

  const cuenta = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  if (!cuenta || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Faltan CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID o R2_SECRET_ACCESS_KEY.',
    );
  }

  cliente = new S3Client({
    region: 'auto',
    endpoint: `https://${cuenta}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return cliente;
}

/** Convierte una key de R2 en la URL pública del CDN. */
export function construirUrlPublicaR2(key: string): string {
  const ruta = key
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

  const base = cdnR2();
  if (!base) {
    // En modo mock no hace falta configurar Cloudflare: sirve para probar el flujo.
    if (r2EstaEnMock()) return `https://cdn.ejemplo.com/${ruta}`;

    throw new Error(
      'Falta NEXT_PUBLIC_CDN_URL para construir la URL pública de R2.',
    );
  }

  return `${base}/${ruta}`;
}

/** Extrae la key de una URL pública de R2. Devuelve null si no es de R2. */
export function claveDesdeUrlR2(url: string): string | null {
  const base = cdnR2();
  if (!base || !url.startsWith(`${base}/`)) return null;

  const sinQuery = url.slice(base.length + 1).split(/[?#]/)[0];
  if (!sinQuery) return null;

  try {
    return decodeURIComponent(sinQuery);
  } catch {
    return null;
  }
}

export interface FirmaSubidaR2 {
  key: string;
  publicUrl: string;
  uploadUrl: string | null;
  headers: Record<string, string>;
  mock: boolean;
}

/** Firma una subida PUT temporal. En modo mock no llama a R2. */
export async function crearFirmaSubidaR2(input: {
  key: string;
  contentType: string;
}): Promise<FirmaSubidaR2> {
  const publicUrl = construirUrlPublicaR2(input.key);
  const headers: Record<string, string> = {
    'Content-Type': input.contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  };

  if (r2EstaEnMock()) {
    return {
      key: input.key,
      publicUrl,
      uploadUrl: null,
      headers,
      mock: true,
    };
  }

  const comando = new PutObjectCommand({
    Bucket: bucketR2(),
    Key: input.key,
    ContentType: input.contentType,
    CacheControl: headers['Cache-Control'],
  });

  const uploadUrl = await getSignedUrl(obtenerClienteR2(), comando, {
    expiresIn: 300,
  });

  return {
    key: input.key,
    publicUrl,
    uploadUrl,
    headers,
    mock: false,
  };
}

/** Borra un objeto de R2. En modo mock no hace nada. */
export async function eliminarObjetoR2(key: string): Promise<void> {
  if (r2EstaEnMock()) return;

  await obtenerClienteR2().send(
    new DeleteObjectCommand({
      Bucket: bucketR2(),
      Key: key,
    }),
  );
}
