"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import {
  leadsMock,
  solicitudesMock,
  resenasMock,
} from "@/server/repositories/datos-mock";
import { actualizarEstadoLead } from "@/server/repositories/leads";
import { actualizarEstadoSolicitud } from "@/server/repositories/solicitudes";
import type { EstadoLead } from "@/types/leads";
import type { EstadoSolicitudApoyo } from "@/types/social";
import type { EstadoResena } from "@/types/resenas";

async function obtenerClienteAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  try {
    const admin = createSupabaseAdminClient();

    try {
      const sesion = await createSupabaseServerClient();
      const {
        data: { user },
        error,
      } = await sesion.auth.getUser();

      if (!error && user) {
        const { data: usuario } = await admin
          .from("administradores")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (usuario) {
          return { admin, usuario };
        }
      }
    } catch {
      // Si no hay sesión, intentamos usar admin directamente
    }

    // Si hay service role, usar admin directamente aunque no haya sesión
    return { admin, usuario: { id: null } };
  } catch (err) {
    console.warn("No se pudo obtener cliente admin de Supabase, operando en modo local:", err);
    return null;
  }
}

export async function listarContactos() {
  const cliente = await obtenerClienteAdmin();

  if (cliente) {
    try {
      const { data, error } = await cliente.admin
        .from("leads_contacto")
        .select("*")
        .order("creado_en", { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn("Error al listar contactos desde Supabase:", err);
    }
  }

  // Fallback modo local / mock
  return leadsMock.map((l) => ({
    id: l.id,
    nombre: l.nombre,
    correo: l.correo,
    telefono: l.telefono,
    mensaje: l.mensaje,
    estado: l.estado,
    creado_en: l.creadoEn,
    origen: "contacto" as const,
  }));
}

export async function listarApoyoSocial() {
  const cliente = await obtenerClienteAdmin();

  if (cliente) {
    try {
      const { data, error } = await cliente.admin
        .from("solicitudes_apoyo_social")
        .select("*")
        .order("creado_en", { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn("Error al listar solicitudes desde Supabase:", err);
    }
  }

  // Fallback modo local / mock
  return solicitudesMock.map((s) => ({
    id: s.id,
    nombre_entidad: s.nombreEntidad,
    persona_contacto: s.personaContacto,
    correo: s.correo,
    telefono: s.telefono,
    descripcion_proyecto: s.descripcionProyecto,
    tipo_entidad: s.tipoEntidad,
    fecha_evento: s.fechaEvento,
    estado: s.estado,
    creado_en: s.creadoEn,
    origen: "apoyo_social" as const,
  }));
}

export async function listarResenas() {
  const cliente = await obtenerClienteAdmin();

  if (cliente) {
    const { data, error } = await cliente.admin
      .from("resenas_clientes")
      .select("*")
      .order("creado_en", { ascending: false });

    if (!error && data) return data;
  }

  // Fallback modo local / mock
  return resenasMock.map((r) => ({
    id: r.id,
    reserva_id: r.reservaId,
    autor: r.autor,
    empresa_autor: r.empresaAutor,
    comentario: r.comentario,
    calificacion: r.calificacion,
    estado: r.estado,
    publicado: r.estado === "aprobada",
    creado_en: r.creadoEn,
  }));
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
  if (!estadosValidos[entidad].includes(estado as never)) {
    throw new Error("El estado indicado no es válido.");
  }

  const cliente = await obtenerClienteAdmin();

  if (cliente) {
    const { admin, usuario } = cliente;
    const tabla =
      entidad === "contacto" ? "leads_contacto" : "solicitudes_apoyo_social";

    const { data: actual, error: errorLectura } = await admin
      .from(tabla)
      .select("estado")
      .eq("id", id)
      .single();

    if (!errorLectura && actual) {
      await admin
        .from(tabla)
        .update({
          estado,
          gestionado_por_id: usuario.id,
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", id);

      try {
        await admin.from("seguimiento_administrativo").insert({
          entidad,
          entidad_id: id,
          accion: "cambio_estado",
          estado_anterior: actual.estado,
          estado_nuevo: estado,
          creado_por_id: usuario.id,
        });
      } catch {
        // Silenciar si la tabla historial no existe
      }
    }
  } else {
    // Modo local / pruebas sin base de datos
    if (entidad === "contacto") {
      await actualizarEstadoLead(id, estado as EstadoLead);
    } else {
      await actualizarEstadoSolicitud(id, estado as EstadoSolicitudApoyo);
    }
  }

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

  const cliente = await obtenerClienteAdmin();

  if (cliente) {
    const { admin, usuario } = cliente;
    const tabla = {
      contacto: "leads_contacto",
      apoyo_social: "solicitudes_apoyo_social",
      resena: "resenas_clientes",
    } as const;

    await admin
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

    try {
      await admin.from("seguimiento_administrativo").insert({
        entidad,
        entidad_id: id,
        accion: entidad === "resena" ? "revision" : "nota",
        nota: nota.trim(),
        creado_por_id: usuario.id,
      });
    } catch {
      // Silenciar si la tabla historial no existe
    }
  } else {
    // Modo local: guardar en mock
    const item =
      entidad === "contacto"
        ? leadsMock.find((l) => l.id === id)
        : entidad === "apoyo_social"
        ? solicitudesMock.find((s) => s.id === id)
        : resenasMock.find((r) => r.id === id);

    if (item) {
      (item as unknown as Record<string, unknown>).notas_admin = nota.trim();
    }
  }

  revalidatePath("/admin/contactos");
  revalidatePath("/admin/apoyo-social");
  revalidatePath("/admin/resenas");
}

export async function cambiarEstadoResena(
  id: string,
  estado: EstadoResena
) {
  const cliente = await obtenerClienteAdmin();

  if (cliente) {
    const { admin, usuario } = cliente;
    const { data: actual, error: errorLectura } = await admin
      .from("resenas_clientes")
      .select("estado")
      .eq("id", id)
      .single();

    if (!errorLectura && actual) {
      await admin
        .from("resenas_clientes")
        .update({
          estado,
          revisado_por_id: usuario.id,
          revisado_en: new Date().toISOString(),
        })
        .eq("id", id);

      try {
        await admin.from("seguimiento_administrativo").insert({
          entidad: "resena",
          entidad_id: id,
          accion: "revision",
          estado_anterior: actual.estado,
          estado_nuevo: estado,
          creado_por_id: usuario.id,
        });
      } catch {
        // Silenciar si la tabla historial no existe
      }
    }
  } else {
    const resena = resenasMock.find((r) => r.id === id);
    if (resena) {
      resena.estado = estado;
    }
  }

  revalidatePath("/admin/resenas");
  revalidatePath("/admin/dashboard");
}
