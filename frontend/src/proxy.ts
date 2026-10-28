import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Renueva la sesion de Supabase en cada peticion.
 *
 * El cliente de `src/server/supabase/server.ts` no puede escribir cookies cuando
 * se ejecuta desde un Server Component, asi que este proxy es el unico lugar
 * donde la sesion se renueva. Sin el, el token caduca y el usuario pierde la
 * sesion de forma inesperada.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // Refleja el token renovado en la peticion para que los Server
        // Components de esta misma respuesta ya vean la sesion al dia.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );

        // Un refresco de token escribe Set-Cookie, asi que la respuesta no debe
        // quedar cacheada en ningun CDN o proxy: si se cachea, el token de un
        // usuario podria servirse a otro.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Fuerza la renovacion si el token ya caduco. getClaims() valida la firma
  // del JWT, a diferencia de getSession() que solo lee la cookie sin verificarla.
  const { data: sesion } = await supabase.auth.getClaims();

  // Adelanto optimista para /admin/*: si no hay sesion valida, ni siquiera se
  // renderiza el panel. El rol y la fila en `administradores` se comprueban
  // despues en el layout y en cada pagina (proxy no es la capa de autorizacion).
  const ruta = request.nextUrl.pathname;
  if (ruta.startsWith("/admin/") && !sesion?.claims?.sub) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";

    const redireccion = NextResponse.redirect(url);
    // Conserva las cookies renovadas por getClaims() en la respuesta de salida.
    response.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie));

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
