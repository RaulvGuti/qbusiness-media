import { createSupabaseServerClient } from "@/server/supabase/server";

export async function requireAdmin() {
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

  const { data: perfil, error } = await supabase
    .from("administradores")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !perfil) {
    return {
      authorized: false as const,
      status: 403,
      supabase,
    };
  }

  return {
    authorized: true as const,
    supabase,
    user,
  };
}
