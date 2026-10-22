
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/require-admin";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nombre = String(body.nombre ?? "").trim();
    const correo = String(body.email ?? "").trim().toLowerCase();
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

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("leads_contacto").insert({
      nombre,
      correo,
      telefono: telefono || null,
      mensaje,
      estado: "nuevo",
    });

    if (error) {
      console.error("Error guardando contacto:", error.message);
      return NextResponse.json(
        { error: "No se pudo guardar el contacto." },
        { status: 500 }
      );
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
    return NextResponse.json(
      { error: "No autorizado" },
      { status: auth.status }
    );
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
    console.error(
      "Error consultando registros:",
      resultadoContactos.error?.message,
      resultadoApoyo.error?.message
    );

    return NextResponse.json(
      { error: "No se pudieron consultar los registros." },
      { status: 500 }
    );
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
