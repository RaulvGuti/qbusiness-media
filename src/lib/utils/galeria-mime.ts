/**
 * Formatos aceptados por el gestor de galería.
 *
 * Esta lista es la única fuente de verdad: el `accept` del input, la
 * validación del navegador y la validación del servidor deben usar los mismos
 * valores. Los tipos que no aparecen aquí se rechazan con un mensaje claro.
 * HEIC/HEIF no se aceptan porque los navegadores no los muestran de forma
 * consistente; conviene convertirlos a JPG o WebP antes de subirlos.
 */

export type TipoMedioGaleria = 'imagen' | 'video';

export interface TipoGaleriaPermitido {
  mime: string;
  extension: string;
  maxBytes: number;
  tipo: TipoMedioGaleria;
}

const MB = 1024 * 1024;

export const TIPOS_GALERIA: Record<string, TipoGaleriaPermitido> = {
  'image/jpeg': {
    mime: 'image/jpeg',
    extension: 'jpg',
    maxBytes: 20 * MB,
    tipo: 'imagen',
  },
  'image/png': {
    mime: 'image/png',
    extension: 'png',
    maxBytes: 20 * MB,
    tipo: 'imagen',
  },
  'image/webp': {
    mime: 'image/webp',
    extension: 'webp',
    maxBytes: 20 * MB,
    tipo: 'imagen',
  },
  'image/gif': {
    mime: 'image/gif',
    extension: 'gif',
    maxBytes: 20 * MB,
    tipo: 'imagen',
  },
  'image/avif': {
    mime: 'image/avif',
    extension: 'avif',
    maxBytes: 20 * MB,
    tipo: 'imagen',
  },
  'video/mp4': {
    mime: 'video/mp4',
    extension: 'mp4',
    maxBytes: 500 * MB,
    tipo: 'video',
  },
  'video/webm': {
    mime: 'video/webm',
    extension: 'webm',
    maxBytes: 500 * MB,
    tipo: 'video',
  },
  'video/quicktime': {
    mime: 'video/quicktime',
    extension: 'mov',
    maxBytes: 500 * MB,
    tipo: 'video',
  },
};

/** MIME canónicos que el servidor acepta. */
export const MIMES_GALERIA = Object.keys(TIPOS_GALERIA);

/** Extensiones que se ofrecen en el selector de archivos. */
export const EXTENSIONES_GALERIA = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.avif',
  '.mp4',
  '.m4v',
  '.webm',
  '.mov',
];

/** Valor listo para el atributo `accept` del input. */
export const ACCEPT_GALERIA = [...MIMES_GALERIA, ...EXTENSIONES_GALERIA].join(',');

/** Alias que algunos sistemas envían para formatos que sí aceptamos. */
const ALIAS_MIME: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'video/x-m4v': 'video/mp4',
};

const MIME_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

export const MENSAJE_FORMATO_NO_PERMITIDO =
  'Formato no compatible. Usa JPG, PNG, WebP, GIF, AVIF, MP4, WebM o MOV.';

/**
 * Devuelve el MIME canónico o null si el formato no está permitido.
 * Si el navegador no informa `type`, se intenta deducir por la extensión.
 */
export function resolverTipoMime(
  tipoMime: string,
  nombreArchivo = '',
): string | null {
  const normalizado = tipoMime.trim().toLowerCase();
  const canonico = ALIAS_MIME[normalizado] ?? normalizado;

  if (TIPOS_GALERIA[canonico]) return canonico;

  const extension = nombreArchivo.split('.').pop()?.toLowerCase() ?? '';
  const porExtension = MIME_POR_EXTENSION[extension];

  return porExtension && TIPOS_GALERIA[porExtension] ? porExtension : null;
}

/** Datos del formato permitido o null si el archivo no se puede subir. */
export function tipoGaleriaPermitido(
  tipoMime: string,
  nombreArchivo = '',
): TipoGaleriaPermitido | null {
  const mime = resolverTipoMime(tipoMime, nombreArchivo);
  return mime ? TIPOS_GALERIA[mime] ?? null : null;
}

/** Mensaje para mostrar cuando el archivo supera el límite de su tipo. */
export function mensajeTamanoExcedido(tipo: TipoGaleriaPermitido): string {
  const limiteMb = Math.round(tipo.maxBytes / MB);
  const categoria = tipo.tipo === 'imagen' ? 'imágenes' : 'videos';
  return `El archivo supera el máximo de ${limiteMb} MB para ${categoria}.`;
}
