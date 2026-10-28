import { cache } from "react";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  CAMPOS_ADMINISTRADOR,
  mapearPerfilAdministrador,
  type FilaAdministrador,
} from "@/server/repositories/administradores";
import type { PerfilAdministrador } from "@/types/admin";

/**
 * Punto único de autorización para las rutas y acciones del panel (000038).
 *
 * `requireAdmin()` valida la sesión de Supabase Auth y que la persona siga
 * existiendo en `administradores`; devuelve su perfil con el rol. Para las
 * acciones exclusivas del administrador principal existe
 * `requireAdminPrincipal()`.
 *
 * Las páginas usan los guards de `server/auth/panel.ts`, que redirigen en vez
 * de devolver un estado HTTP.
 */

export type AccesoStaff =
  | {
      authorized: true;
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
      user: { id: string; email: string };
      perfil: PerfilAdministrador;
    }
  | {
      authorized: false;
      status: 401 | 403;
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    };

export const requireAdmin = cache(async (): Promise<AccesoStaff> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return {
      authorized: false as const,
      status: 401,
      supabase,
    };
  }

  const { data: fila, error } = await supabase
    .from("administradores")
    .select(CAMPOS_ADMINISTRADOR)
    .eq("id", user.id)
    .maybeSingle();

  if (error || !fila) {
    return {
      authorized: false as const,
      status: 403,
      supabase,
    };
  }

  return {
    authorized: true as const,
    supabase,
    user: { id: user.id, email: user.email },
    perfil: mapearPerfilAdministrador(fila as FilaAdministrador),
  };
});

/** Igual que `requireAdmin()`, pero además exige el rol admin_principal. */
export async function requireAdminPrincipal(): Promise<AccesoStaff> {
  const acceso = await requireAdmin();

  if (!acceso.authorized) {
    return acceso;
  }

  if (acceso.perfil.rol !== "admin_principal") {
    return {
      authorized: false as const,
      status: 403,
      supabase: acceso.supabase,
    };
  }

  return acceso;
}
