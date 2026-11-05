/**
 * Nombres de las cookies de sesión de Supabase.
 *
 * El sitio público usa la cookie normal de `@supabase/ssr`
 * (`sb-<ref>-auth-token`). El panel administrativo usa una cookie propia para
 * que la sesión del equipo y la del cliente sean independientes: cerrar sesión
 * en una no cierra la otra, y un administrador puede probar el sitio público
 * sin compartir su sesión privilegiada.
 */
export const COOKIE_SESION_ADMIN = 'qb-admin-auth-token';
