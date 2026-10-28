import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  MiembroEquipo,
  PerfilAdministrador,
  RolAdministrador,
} from "@/types/admin";

/**
 * Repositorio de `administradores` (000012 y 000038).
 *
 * La RLS deja que cada persona lea su propia fila y que solo el administrador
 * principal lea al resto del equipo. Por eso `listarEquipo()` se usa únicamente
 * en la vista de perfil del principal.
 */

export interface FilaAdministrador {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  rol: string;
  creado_en: string;
}

export const CAMPOS_ADMINISTRADOR =
  "id, nombre_completo, correo, telefono, rol, creado_en";

/** Nunca confiar en un rol que no esté en el catálogo: se cae a secretaria. */
export function normalizarRol(rol: string | null | undefined): RolAdministrador {
  return rol === "admin_principal" ? "admin_principal" : "secretaria";
}

export function mapearPerfilAdministrador(
  fila: FilaAdministrador,
): PerfilAdministrador {
  return {
    id: fila.id,
    nombreCompleto: fila.nombre_completo,
    correo: fila.correo,
    telefono: fila.telefono,
    rol: normalizarRol(fila.rol),
    creadoEn: fila.creado_en,
  };
}

/** Equipo con acceso al panel. Solo devuelve filas si quien consulta es principal. */
export async function listarEquipo(): Promise<MiembroEquipo[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("administradores")
    .select(CAMPOS_ADMINISTRADOR)
    .order("creado_en", { ascending: true });

  if (error) {
    throw new Error("No se pudo cargar el equipo con acceso al panel.");
  }

  return (data ?? []).map((fila) =>
    mapearPerfilAdministrador(fila as FilaAdministrador),
  );
}
