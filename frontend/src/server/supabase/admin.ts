import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase privilegiado (service_role). Omite RLS.
 *
 * Reservar para tareas de servidor que si deben saltarse RLS: confirmaciones
 * de reserva, notificaciones a leads, limpieza de registros. Nunca importarlo
 * desde un Client Component ni devolver su clave al navegador.
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
