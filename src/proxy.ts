import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_SESION_ADMIN } from "@/lib/auth-cookies";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Renueva las dos sesiones de Supabase en cada peticion.
 *
 * El cliente de `src/server/supabase/server.ts` no puede escribir cookies cuando
 * se ejecuta desde un Server Component, asi que este proxy es el unico lugar
 * donde las sesiones se renuevan. Sin el, el token caduca y el usuario pierde
 * la sesion de forma inesperada.
 *
 * Hay dos cookies independientes:
 *   * la normal de `@supabase/ssr`, para clientes del sitio publico;
 *   * `qb-admin-auth-token`, exclusiva del panel administrativo.
 * Cada una se refresca con su propio cliente para que cerrar sesion en una no
 * afecte a la otra.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  // Cada refresco recrea la respuesta para reflejar la peticion actualizada.
  // Estas colecciones conservan lo que ya escribio el otro cliente (publico o
  // staff) para que ninguno pise el Set-Cookie del otro.
  const cookiesPendientes = new Map<
    string,
    { value: string; options?: CookieOptions }
  >();
  const headersPendientes = new Map<string, string>();

  function crearCliente(nombreCookie?: string) {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      ...(nombreCookie ? { cookieOptions: { name: nombreCookie } } : {}),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Refleja el token renovado en la peticion para que los Server
            // Components de esta misma respuesta ya vean la sesion al dia.
            request.cookies.set(name, value);
            cookiesPendientes.set(name, { value, options });
          });

          response = NextResponse.next({ request });
          cookiesPendientes.forEach(({ value, options }, name) =>
            response.cookies.set(name, value, options),
          );

          // Un refresco de token escribe Set-Cookie, asi que la respuesta no
          // debe quedar cacheada en ningun CDN o proxy: si se cachea, el token
          // de un usuario podria servirse a otro.
          Object.entries(headers).forEach(([key, value]) =>
            headersPendientes.set(key, value),
          );
          headersPendientes.forEach((value, key) =>
            response.headers.set(key, value),
          );
        },
      },
    });
  }

  // Fuerza la renovacion si el token ya caduco. getClaims() valida la firma
  // del JWT, a diferencia de getSession() que solo lee la cookie sin verificarla.
  const publico = crearCliente();
  await publico.auth.getClaims();

  const staff = crearCliente(COOKIE_SESION_ADMIN);
  const { data: sesionStaff } = await staff.auth.getClaims();

  // Adelanto optimista para /admin/*: si no hay sesion de staff valida, ni
  // siquiera se renderiza el panel. El rol y la fila en `administradores` se
  // comprueban despues en el layout y en cada pagina (proxy no es la capa de
  // autorizacion).
  const ruta = request.nextUrl.pathname;
  if (ruta.startsWith("/admin/") && !sesionStaff?.claims?.sub) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";

    const redireccion = NextResponse.redirect(url);
    // Conserva las cookies y cabeceras renovadas por getClaims() en la salida.
    cookiesPendientes.forEach(({ value, options }, name) =>
      redireccion.cookies.set(name, value, options),
    );
    headersPendientes.forEach((value, key) => redireccion.headers.set(key, value));

    return redireccion;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Todo menos los assets estaticos, para no ejecutar el proxy (y por lo tanto
     * no tocar cookies) en cada CSS, JS o imagen solicitada.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
