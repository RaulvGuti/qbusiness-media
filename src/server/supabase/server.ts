import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Reenvia la cookie de sesion del usuario, de modo que cada consulta se
 * ejecuta con sus permisos reales y las politicas RLS se aplican igual que en
 * el navegador.
 *
 * Crear uno nuevo en cada peticion: reutilizarlo entre peticiones filtraria la
 * sesion de un usuario hacia otro. Por eso la funcion es `async`, ya que
 * `cookies()` lo es en Next.js 16.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // En un Server Component las cookies son de solo lectura, asi que
            // el refresco de sesion lo debe resolver `src/proxy.ts`.
          }
        },
      },
    },
  );
}
