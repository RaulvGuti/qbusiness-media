
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { requireAdmin } from "@/server/auth/require-admin";

const ESTADOS = [
  "nueva",
  "en_revision",
  "aprobada",
  "rechazada",
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nombreEntidad = String(body.nombreOrganizacion ?? "").trim();
    const personaContacto = String(body.nombreContacto ?? "").trim();
    const correo = String(body.email ?? "").trim().toLowerCase();
    const telefono = String(body.telefono ?? "").trim();
    const descripcion = String(body.descripcionProyecto ?? "").trim();

    if (
      !nombreEntidad ||
      !personaContacto ||
      !correo ||
      !telefono ||
      !descripcion
    ) {
      return NextResponse.json(
        { error: "Completa los campos obligatorios." },
        { status: 400 }
      );
    }

    if (
      nombreEntidad.length > 200 ||
      personaContacto.length > 200 ||
      correo.length > 254 ||
      telefono.length > 40 ||
      descripcion.length > 5000 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {
      return NextResponse.json(
        { error: "Los datos ingresados no son válidos." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("solicitudes_apoyo_social")
      .insert({
        nombre_entidad: nombreEntidad,
        persona_contacto: personaContacto,
        correo,
        telefono,
        descripcion_proyecto: descripcion,
        estado: "nueva",
      });

    if (error) {
      console.error("Error guardando solicitud:", error.message);
      return NextResponse.json(
        { error: "No se pudo guardar la solicitud." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { mensaje: "Solicitud enviada correctamente." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 400 }
    );
  }
}

export async function GET() {
  const acceso = await requireAdmin();

  if (!acceso.authorized) {
    return NextResponse.json(
      { error: "No tienes autorización para consultar las solicitudes." },
      { status: acceso.status }
    );
  }

  const { data, error } = await acceso.supabase
    .from("solicitudes_apoyo_social")
    .select(
      "id, nombre_entidad, persona_contacto, correo, telefono, descripcion_proyecto, estado, creado_en"
    )
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error consultando solicitudes:", error.message);
    return NextResponse.json(
      { error: "No se pudieron consultar las solicitudes." },
      { status: 500 }
    );
  }

  return NextResponse.json({ solicitudes: data });
}

export async function PATCH(request: Request) {
  const acceso = await requireAdmin();

  if (!acceso.authorized) {
    return NextResponse.json(
      { error: "No tienes autorización para modificar solicitudes." },
      { status: acceso.status }
    );
  }

  let body: { id?: string; estado?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "La solicitud no contiene JSON válido." },
      { status: 400 }
    );
  }

  if (
    !body.id ||
    !ESTADOS.includes(body.estado as (typeof ESTADOS)[number])
  ) {
    return NextResponse.json(
      { error: "Debes indicar una solicitud y un estado válido." },
      { status: 400 }
    );
  }

  const { data, error } = await acceso.supabase
    .from("solicitudes_apoyo_social")
    .update({ estado: body.estado })
    .eq("id", body.id)
    .select("id, estado")
    .maybeSingle();

  if (error) {
    console.error("Error actualizando solicitud:", error.message);
    return NextResponse.json(
      { error: "No se pudo actualizar el estado de la solicitud." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "No se encontró la solicitud." },
      { status: 404 }
    );
  }

  return NextResponse.json({ solicitud: data });
}
