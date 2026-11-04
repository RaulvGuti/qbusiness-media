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

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        "No se puede guardar el contacto: falta SUPABASE_SERVICE_ROLE_KEY en el servidor.",
      );
      return NextResponse.json(
        {
          error:
            "El formulario no está disponible en este momento. Escríbenos por WhatsApp.",
        },
        { status: 503 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("leads_contacto").insert({
      nombre,
      correo,
      telefono: telefono || null,
      mensaje,
      estado: "nuevo",
    });

    if (error) {
      console.error("No se pudo guardar el contacto:", error.code);
      return NextResponse.json(
        { error: "No se pudo guardar el contacto. Intenta de nuevo." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { mensaje: "Contacto recibido correctamente." },
      { status: 201 }
    );
  } catch {
    console.error("Error procesando el formulario de contacto.");

    return NextResponse.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    return NextResponse.json(
      {
        error:
          auth.status === 401
            ? "Inicia sesión para consultar los contactos."
            : "Tu cuenta no tiene acceso a los contactos.",
      },
      { status: auth.status },
    );
  }

  const [resultadoContactos, resultadoApoyo] = await Promise.all([
    auth.supabase
      .from("leads_contacto")
      .select(
        "id, nombre, correo, telefono, mensaje, empresa, tipo_servicio, presupuesto, notas_admin, actualizado_en, gestionado_por_id, estado, creado_en"
      )
      .order("creado_en", { ascending: false }),

    auth.supabase
      .from("solicitudes_apoyo_social")
      .select(
        "id, nombre_entidad, persona_contacto, correo, telefono, descripcion_proyecto, estado, creado_en"
      )
      .order("creado_en", { ascending: false }),
  ]);

  if (resultadoContactos.error || resultadoApoyo.error) {
    return NextResponse.json(
      { error: "No se pudieron consultar los contactos." },
      { status: 500 },
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
