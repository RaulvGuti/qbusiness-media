import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/require-admin";

type Contexto = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: Contexto,
) {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: auth.status },
    );
  }

  const { id } = await params;
  const body = await request.json();

  if (typeof body.publicado !== "boolean") {
    return NextResponse.json(
      { error: "El campo publicado debe ser verdadero o falso" },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("resenas_clientes")
    .update({ publicado: body.publicado })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar la reseña" },
      { status: 500 },
    );
  }

  return NextResponse.json({ resena: data });
}