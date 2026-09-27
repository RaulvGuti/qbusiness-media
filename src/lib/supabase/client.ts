"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Faltan las variables de entorno de Supabase en .env");
}

/**
 * Cliente Supabase para el navegador.
 *
 * Solo usa la clave anon publica, asi que queda sujeto a las politicas RLS:
 * no sirve para leer datos de otros usuarios ni para operaciones privilegiadas.
 *
 * La sesion se guarda en cookies y no en localStorage, para que los Server
 * Components puedan leerla durante la peticion del servidor.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
