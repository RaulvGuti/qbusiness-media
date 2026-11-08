
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/require-admin";

const ESTADOS = [
  "nueva",
  "en_revision",
  "aprobada",
  "rechazada",
] as const;

export async function GET() {
  const acceso = await requireAdmin();

  if (!acceso.authorized) {
    return NextResponse.json(
      { error: "No tienes autorización para consultar las solicitudes." },
      { status: acceso.status },
    );
  }

  const { data, error } = await acceso.supabase
    .from("solicitudes_apoyo_social")
    .select(
      "id, nombre_entidad, persona_contacto, correo, telefono, descripcion_proyecto, estado, creado_en",
    )
    .order("creado_en", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron consultar las solicitudes." },
      { status: 500 },
    );
  }

  return NextResponse.json({ solicitudes: data });
}

export async function PATCH(request: Request) {
  const acceso = await requireAdmin();

  if (!acceso.authorized) {
    return NextResponse.json(
      { error: "No tienes autorización para modificar solicitudes." },
      { status: acceso.status },
    );
  }

  let body: { id?: string; estado?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "La solicitud no contiene JSON válido." },
      { status: 400 },
    );
  }

  if (
    !body.id ||
    !ESTADOS.includes(body.estado as (typeof ESTADOS)[number])
  ) {
    return NextResponse.json(
      { error: "Debes indicar una solicitud y un estado válido." },
      { status: 400 },
    );
  }

  const { data, error } = await acceso.supabase
    .from("solicitudes_apoyo_social")
    .update({ estado: body.estado })
    .eq("id", body.id)
    .select("id, estado")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar el estado de la solicitud." },
      { status: 500 },
    );
  }

  return NextResponse.json({ solicitud: data });
}
