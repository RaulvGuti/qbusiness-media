"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/require-admin";
import type { EstadoResena } from "@/types/resenas";

/**
 * Seguimiento de contactos, apoyo social y reseñas (000030 y 000038).
 *
 * Antes este servicio usaba el cliente service_role y, si no había sesión,
 * seguía operando con la llave privilegiada: cualquiera podía leer datos
 * personales. Ahora cada función exige una sesión del equipo y consulta con
 * esa sesión, de modo que la RLS también aplica. Ya no hay respaldo de datos
 * ficticios: un error se devuelve como error.
 */

const ESTADOS_VALIDOS = {
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

type EntidadSeguimiento = keyof typeof ESTADOS_VALIDOS;

const ESTADOS_RESENA: readonly EstadoResena[] = [
  "pendiente",
  "aprobada",
  "rechazada",
];

const TABLAS = {
  contacto: "leads_contacto",
  apoyo_social: "solicitudes_apoyo_social",
  resena: "resenas_clientes",
} as const;

async function abrirSesion() {
  const acceso = await requireAdmin();
  return acceso.authorized ? acceso : null;
}

export async function listarContactos() {
  const acceso = await abrirSesion();
  if (!acceso) return [];

  const { data, error } = await acceso.supabase
    .from("leads_contacto")
    .select("*")
    .order("creado_en", { ascending: false });

  return error ? [] : data ?? [];
}

export async function listarApoyoSocial() {
  const acceso = await abrirSesion();
  if (!acceso) return [];

  const { data, error } = await acceso.supabase
    .from("solicitudes_apoyo_social")
    .select("*")
    .order("creado_en", { ascending: false });

  return error ? [] : data ?? [];
}

export async function listarResenas() {
  const acceso = await abrirSesion();
  if (!acceso) return [];

  const { data, error } = await acceso.supabase
    .from("resenas_clientes")
    .select("*")
    .order("creado_en", { ascending: false });

  return error ? [] : data ?? [];
}

export async function cambiarEstado(
  entidad: EntidadSeguimiento,
  id: string,
  estado: string,
) {
  if (!ESTADOS_VALIDOS[entidad].includes(estado as never)) {
    throw new Error("El estado indicado no es válido.");
  }

  const acceso = await abrirSesion();
  if (!acceso) {
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  const tabla = TABLAS[entidad];

  const { data: actual, error: errorLectura } = await acceso.supabase
    .from(tabla)
    .select("estado")
    .eq("id", id)
    .single();

  if (errorLectura || !actual) {
    throw new Error("No se encontró el registro que quieres actualizar.");
  }

  const { error: errorUpdate } = await acceso.supabase
    .from(tabla)
    .update({
      estado,
      gestionado_por_id: acceso.user.id,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id);

  if (errorUpdate) {
    throw new Error("No se pudo actualizar el estado.");
  }

  await acceso.supabase.from("seguimiento_administrativo").insert({
    entidad,
    entidad_id: id,
    accion: "cambio_estado",
    estado_anterior: actual.estado,
    estado_nuevo: estado,
    creado_por_id: acceso.user.id,
  });

  revalidatePath("/admin/contactos");
  revalidatePath("/admin/apoyo-social");
  revalidatePath("/admin/dashboard");
}

export async function guardarNota(
  entidad: EntidadSeguimiento | "resena",
  id: string,
  nota: string,
) {
  if (!id || !nota.trim()) {
    throw new Error("Escribe una nota antes de guardar.");
  }

  const acceso = await abrirSesion();
  if (!acceso) {
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  const texto = nota.trim();

  const { error: errorUpdate } = await acceso.supabase
    .from(TABLAS[entidad])
    .update({
      notas_admin: texto,
      ...(entidad === "resena"
        ? {
            revisado_por_id: acceso.user.id,
            revisado_en: new Date().toISOString(),
          }
        : {
            gestionado_por_id: acceso.user.id,
            actualizado_en: new Date().toISOString(),
          }),
    })
    .eq("id", id);

  if (errorUpdate) {
    throw new Error("No se pudo guardar la nota.");
  }

  await acceso.supabase.from("seguimiento_administrativo").insert({
    entidad,
    entidad_id: id,
    accion: entidad === "resena" ? "revision" : "nota",
    nota: texto,
    creado_por_id: acceso.user.id,
  });

  revalidatePath("/admin/contactos");
  revalidatePath("/admin/apoyo-social");
  revalidatePath("/admin/resenas");
}

export async function cambiarEstadoResena(id: string, estado: EstadoResena) {
  if (!ESTADOS_RESENA.includes(estado)) {
    throw new Error("El estado de la reseña no es válido.");
  }

  const acceso = await abrirSesion();
  if (!acceso) {
    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  }

  const { data: actual, error: errorLectura } = await acceso.supabase
    .from("resenas_clientes")
    .select("estado")
    .eq("id", id)
    .single();

  if (errorLectura || !actual) {
    throw new Error("No se encontró la reseña.");
  }

  const { error: errorUpdate } = await acceso.supabase
    .from("resenas_clientes")
    .update({
      estado,
      revisado_por_id: acceso.user.id,
      revisado_en: new Date().toISOString(),
    })
    .eq("id", id);

  if (errorUpdate) {
    throw new Error("No se pudo actualizar la reseña.");
  }

  await acceso.supabase.from("seguimiento_administrativo").insert({
    entidad: "resena",
    entidad_id: id,
    accion: "revision",
    estado_anterior: actual.estado,
    estado_nuevo: estado,
    creado_por_id: acceso.user.id,
  });

  revalidatePath("/admin/resenas");
  revalidatePath("/admin/dashboard");
}
