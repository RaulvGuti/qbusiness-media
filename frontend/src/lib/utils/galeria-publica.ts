/**
 * Utilidades puras de la galería pública (sin 'use server'): se pueden usar
 * tanto en el servidor como en componentes.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const esUuid = (valor: string): boolean => UUID_RE.test(valor);

/**
 * URL pública de un objeto de un bucket público de Supabase Storage.
 * Es la misma que devuelve supabase.storage.from(bucket).getPublicUrl(ruta).
 */
export function construirUrlStorage(bucket: string, ruta: string): string | null {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  if (!base || !ruta) return null;
  const rutaCodificada = ruta.split('/').map(encodeURIComponent).join('/');
  return `${base}/storage/v1/object/public/${bucket}/${rutaCodificada}`;
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
