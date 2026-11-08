
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/require-admin";

const ESTADOS_CONTACTO = ["nuevo", "contactado", "cerrado"] as const;
const ESTADOS_APOYO = [
  "nueva",
  "en_revision",
  "aprobada",
  "rechazada",
] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const acceso = await requireAdmin();

  if (!acceso.authorized) {
    return NextResponse.json(
      { error: "No tienes autorización para modificar registros." },
      { status: acceso.status }
    );
  }

  const { id } = await context.params;

  let body: { estado?: string; origen?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "La solicitud no contiene JSON válido." },
      { status: 400 }
    );
  }

  if (body.origen === "apoyo_social") {
    if (!ESTADOS_APOYO.includes(body.estado as (typeof ESTADOS_APOYO)[number])) {
      return NextResponse.json(
        { error: "Debes indicar un estado válido para la solicitud." },
        { status: 400 }
      );
    }

    const { data, error } = await acceso.supabase
      .from("solicitudes_apoyo_social")
      .update({ estado: body.estado })
      .eq("id", id)
      .select("id, estado")
      .maybeSingle();

    if (error) {
      console.error("Error actualizando solicitud de apoyo:", error.message);
      return NextResponse.json(
        { error: "No se pudo actualizar la solicitud." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No se encontró la solicitud." },
        { status: 404 }
      );
    }

    return NextResponse.json({ registro: data });
  }

  if (body.origen !== "contacto" ||
      !ESTADOS_CONTACTO.includes(body.estado as (typeof ESTADOS_CONTACTO)[number])) {
    return NextResponse.json(
      { error: "Debes indicar un origen y un estado válidos." },
      { status: 400 }
    );
  }

  const { data, error } = await acceso.supabase
    .from("leads_contacto")
    .update({ estado: body.estado })
    .eq("id", id)
    .select("id, estado")
    .maybeSingle();

  if (error) {
    console.error("Error actualizando contacto:", error.message);
    return NextResponse.json(
      { error: "No se pudo actualizar el contacto." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "No se encontró el contacto." },
      { status: 404 }
    );
  }

  return NextResponse.json({ registro: data });
}
