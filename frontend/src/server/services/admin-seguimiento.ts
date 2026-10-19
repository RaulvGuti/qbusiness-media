
"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

async function obtenerClienteAdmin() {
  const sesion = await createSupabaseServerClient();
  const { data: { user }, error } = await sesion.auth.getUser();

  if (error || !user?.email) {
    throw new Error("Debes iniciar sesión para continuar.");
  }

  const admin = createSupabaseAdminClient();

  const { data: usuario, error: errorUsuario } = await admin
    .from("usuarios")
    .select("id, rol, correo")
    .eq("correo", user.email)
    .maybeSingle();

  if (errorUsuario || !usuario || usuario.rol !== "admin") {
    throw new Error("No tienes permisos de administrador.");
  }

  return { admin, usuario };
}

export async function listarContactos() {
  const { admin } = await obtenerClienteAdmin();

  const { data, error } = await admin
    .from("leads_contacto")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listarApoyoSocial() {
  const { admin } = await obtenerClienteAdmin();

  const { data, error } = await admin
    .from("solicitudes_apoyo_social")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listarResenas() {
  const { admin } = await obtenerClienteAdmin();

  const { data, error } = await admin
    .from("resenas_clientes")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

const estadosValidos = {
  contacto: [
    "nuevo",
    "contactado",
    "cotizado",
    "en_proceso",
    "cerrado",
    "descartado",
  ],
  apoyo_social: [
    "nueva",
    "en_revision",
    "aprobada",
    "rechazada",
    "completada",
  ],
} as const;

type EntidadSeguimiento = keyof typeof estadosValidos;

export async function cambiarEstado(
  entidad: EntidadSeguimiento,
  id: string,
  estado: string
) {
  if (!estadosValidos[entidad].includes(
    estado as never
  )) {
    throw new Error("El estado indicado no es válido.");
  }

  const { admin, usuario } = await obtenerClienteAdmin();

  const tabla = entidad === "contacto"
    ? "leads_contacto"
    : "solicitudes_apoyo_social";

  const { data: actual, error: errorLectura } = await admin
    .from(tabla)
    .select("estado")
    .eq("id", id)
    .single();

  if (errorLectura) throw new Error(errorLectura.message);

  const { error } = await admin
    .from(tabla)
    .update({
      estado,
      gestionado_por_id: usuario.id,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const { error: errorHistorial } = await admin
    .from("seguimiento_administrativo")
    .insert({
      entidad,
      entidad_id: id,
      accion: "cambio_estado",
      estado_anterior: actual.estado,
      estado_nuevo: estado,
      creado_por_id: usuario.id,
    });

  if (errorHistorial) throw new Error(errorHistorial.message);

  revalidatePath("/admin/contactos");
  revalidatePath("/admin/apoyo-social");
  revalidatePath("/admin/dashboard");
}

export async function guardarNota(
  entidad: EntidadSeguimiento | "resena",
  id: string,
  nota: string
) {
  if (!id || !nota.trim()) {
    throw new Error("Escribe una nota antes de guardar.");
  }

  const { admin, usuario } = await obtenerClienteAdmin();

  const tabla = {
    contacto: "leads_contacto",
    apoyo_social: "solicitudes_apoyo_social",
    resena: "resenas_clientes",
  } as const;

  const { error } = await admin
    .from(tabla[entidad])
    .update({
      notas_admin: nota.trim(),
      ...(entidad === "resena"
        ? {
            revisado_por_id: usuario.id,
            revisado_en: new Date().toISOString(),
          }
        : {
            gestionado_por_id: usuario.id,
            actualizado_en: new Date().toISOString(),
          }),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const { error: errorHistorial } = await admin
    .from("seguimiento_administrativo")
    .insert({
      entidad,
      entidad_id: id,
      accion: entidad === "resena" ? "revision" : "nota",
      nota: nota.trim(),
      creado_por_id: usuario.id,
    });

  if (errorHistorial) throw new Error(errorHistorial.message);

  revalidatePath("/admin/contactos");
  revalidatePath("/admin/apoyo-social");
  revalidatePath("/admin/resenas");
}

export async function cambiarEstadoResena(
  id: string,
  estado: "borrador" | "publicada" | "eliminada"
) {
  const { admin, usuario } = await obtenerClienteAdmin();

  const { data: actual, error: errorLectura } = await admin
    .from("resenas_clientes")
    .select("publicado")
    .eq("id", id)
    .single();

  if (errorLectura) throw new Error(errorLectura.message);

  const { error } = await admin
    .from("resenas_clientes")
    .update({
      publicado: estado === "publicada",
      revisado_por_id: usuario.id,
      revisado_en: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const { error: errorHistorial } = await admin
    .from("seguimiento_administrativo")
    .insert({
      entidad: "resena",
      entidad_id: id,
      accion: "revision",
      estado_anterior: actual.publicado ? "publicada" : "borrador",
      estado_nuevo: estado,
      creado_por_id: usuario.id,
    });

  if (errorHistorial) throw new Error(errorHistorial.message);

  revalidatePath("/admin/resenas");
  revalidatePath("/admin/dashboard");
}
