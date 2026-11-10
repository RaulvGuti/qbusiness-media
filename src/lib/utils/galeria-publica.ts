/**
 * Utilidades puras de la galería pública (sin 'use server'): se pueden usar
 * tanto en el servidor como en componentes.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const esUuid = (valor: string): boolean => UUID_RE.test(valor);

/**
 * Normaliza una URL base: quita espacios y barras finales. Así se evita
 * generar URLs con doble barra al unir el CDN o Supabase con una ruta.
 */
export function normalizarUrlBase(valor: string | null | undefined): string {
  return (valor ?? '').trim().replace(/\/+$/, '');
}

/** Une una base normalizada con una ruta sin duplicar la barra. */
export function unirUrl(base: string | null | undefined, ruta: string): string {
  const baseLimpia = normalizarUrlBase(base);
  const rutaLimpia = ruta.replace(/^\/+/, '');

  if (!baseLimpia) return rutaLimpia;
  return rutaLimpia ? `${baseLimpia}/${rutaLimpia}` : baseLimpia;
}

/**
 * URL pública legacy de un objeto de Supabase Storage.
 * Las subidas nuevas van a Cloudflare R2 y guardan la URL final en la base.
 */
export function construirUrlStorage(bucket: string, ruta: string): string | null {
  const base = normalizarUrlBase(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!base || !ruta) return null;

  const rutaCodificada = ruta.split('/').map(encodeURIComponent).join('/');
  return unirUrl(base, `storage/v1/object/public/${bucket}/${rutaCodificada}`);
}

/** true si el valor ya es una URL absoluta. */
export function esUrlAbsoluta(valor: string): boolean {
  return /^https?:\/\//i.test(valor);
}

/**
 * Resuelve lo guardado en `ruta_storage`:
 * - URL absoluta de R2/CDN/Supabase: se devuelve tal cual.
 * - Ruta legacy de Supabase: se convierte a su URL pública.
 */
export function resolverUrlArchivo(
  valor: string | null,
  bucket: string,
): string | null {
  if (!valor) return null;
  return esUrlAbsoluta(valor) ? valor : construirUrlStorage(bucket, valor);
}

/** Convierte un enlace de YouTube o Vimeo en su URL de incrustación (iframe). */
export function urlEmbed(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.endsWith('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return u.toString();
      const id =
        u.searchParams.get('v') ??
        (u.pathname.startsWith('/shorts/') ? u.pathname.split('/')[2] : null);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}
