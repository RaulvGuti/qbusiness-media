"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let cliente: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Cliente Supabase para el navegador.
 *
 * Solo usa la clave anon publica, asi que queda sujeto a las politicas RLS:
 * no sirve para leer datos de otros usuarios ni para operaciones privilegiadas.
 *
 * La sesion se guarda en cookies y no en localStorage, para que los Server
 * Components puedan leerla durante la peticion del servidor.
 *
 * El cliente se crea la primera vez que se usa, NO al importar este modulo.
 * `next build` prerenderiza `/login` y `/admin`, y ahi las variables
 * `NEXT_PUBLIC_*` todavia pueden no existir: dentro de la imagen de Docker
 * `.env.local` no se copia, y en un clon nuevo tampoco hay `.env.local`. Si el
 * cliente se creara al importar, `@supabase/ssr` lanzaria "Your project's URL
 * and API key are required" y el build entero fallaria. Creandolo aqui, el
 * error aparece solo cuando alguien intenta iniciar sesion, que es cuando de
 * verdad importa, y el resto del sitio sigue funcionando.
 */
export function obtenerSupabase() {
  if (!cliente) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno del navegador.",
      );
    }

    cliente = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return cliente;
}
