import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/require-admin";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nombre = String(body.nombre ?? "").trim();
    const correo = String(body.correo ?? body.email ?? "").trim().toLowerCase();
    const telefono = String(body.telefono ?? "").trim();
    const mensaje = String(body.mensaje ?? "").trim();

    if (!nombre || !correo || !mensaje) {
      return NextResponse.json(
        { error: "Completa nombre, correo y mensaje." },
        { status: 400 }
      );
    }

    if (
      nombre.length > 150 ||
      correo.length > 254 ||
      telefono.length > 40 ||
      mensaje.length > 5000 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {
      return NextResponse.json(
        { error: "Los datos no son válidos." },
        { status: 400 }
      );
    }

    let guardadoEnDb = false;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase.from("leads_contacto").insert({
          nombre,
          correo,
          telefono: telefono || null,
          mensaje,
          estado: "nuevo",
        });

        if (!error) {
          guardadoEnDb = true;
        } else {
          console.warn("Fallo guardado en Supabase, usando repositorio local:", error.message);
        }
      } catch (err) {
        console.warn("Error con cliente Supabase, usando repositorio local:", err);
      }
    }

    if (!guardadoEnDb) {
      // Guardado local / offline
      const { crearLead } = await import("@/server/repositories/leads");
      await crearLead({
        nombre,
        correo,
        telefono: telefono || undefined,
        mensaje,
      });
    }

    return NextResponse.json(
      { mensaje: "Contacto recibido correctamente." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error procesando formulario de contacto:", error);

    return NextResponse.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 400 }
    );
  }
}

export async function GET() {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    // Si no hay sesión admin en local, devolver mock para pruebas locales
    const { leadsMock, solicitudesMock } = await import("@/server/repositories/datos-mock");

    const contactos = leadsMock.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      correo: c.correo,
      telefono: c.telefono,
      mensaje: c.mensaje,
      estado: c.estado,
      creado_en: c.creadoEn,
      origen: "contacto" as const,
    }));

    const solicitudes = solicitudesMock.map((s) => ({
      id: s.id,
      nombre: s.personaContacto,
      correo: s.correo,
      telefono: s.telefono,
      mensaje: s.descripcionProyecto,
      estado: s.estado,
      creado_en: s.creadoEn,
      origen: "apoyo_social" as const,
      nombre_entidad: s.nombreEntidad,
    }));

    return NextResponse.json({
      contactos: [...contactos, ...solicitudes].sort(
        (a, b) =>
          new Date(b.creado_en).getTime() -
          new Date(a.creado_en).getTime()
      ),
    });
  }

  const [resultadoContactos, resultadoApoyo] = await Promise.all([
    auth.supabase
      .from("leads_contacto")
      .select("id, nombre, correo, telefono, mensaje, estado, creado_en")
      .order("creado_en", { ascending: false }),

    auth.supabase
      .from("solicitudes_apoyo_social")
      .select(
        "id, nombre_entidad, persona_contacto, correo, telefono, descripcion_proyecto, estado, creado_en"
      )
      .order("creado_en", { ascending: false }),
  ]);

  if (resultadoContactos.error || resultadoApoyo.error) {
    // Si falla Supabase, fallback a mock
    const { leadsMock, solicitudesMock } = await import("@/server/repositories/datos-mock");

    const contactos = leadsMock.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      correo: c.correo,
      telefono: c.telefono,
      mensaje: c.mensaje,
      estado: c.estado,
      creado_en: c.creadoEn,
      origen: "contacto" as const,
    }));

    const solicitudes = solicitudesMock.map((s) => ({
      id: s.id,
      nombre: s.personaContacto,
      correo: s.correo,
      telefono: s.telefono,
      mensaje: s.descripcionProyecto,
      estado: s.estado,
      creado_en: s.creadoEn,
      origen: "apoyo_social" as const,
      nombre_entidad: s.nombreEntidad,
    }));

    return NextResponse.json({
      contactos: [...contactos, ...solicitudes].sort(
        (a, b) =>
          new Date(b.creado_en).getTime() -
          new Date(a.creado_en).getTime()
      ),
    });
  }

  const contactos = (resultadoContactos.data ?? []).map((contacto) => ({
    ...contacto,
    origen: "contacto" as const,
  }));

  const solicitudes = (resultadoApoyo.data ?? []).map((solicitud) => ({
    id: solicitud.id,
    nombre: solicitud.persona_contacto,
    correo: solicitud.correo,
    telefono: solicitud.telefono,
    mensaje: solicitud.descripcion_proyecto,
    estado: solicitud.estado,
    creado_en: solicitud.creado_en,
    origen: "apoyo_social" as const,
    nombre_entidad: solicitud.nombre_entidad,
  }));

  return NextResponse.json({
    contactos: [...contactos, ...solicitudes].sort(
      (a, b) =>
        new Date(b.creado_en).getTime() -
        new Date(a.creado_en).getTime()
    ),
  });
}
