import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/require-admin";

type Contexto = {
  params: Promise<{ id: string }>;
};

const ESTADOS_RESENA = ["pendiente", "aprobada", "rechazada"] as const;
type EstadoResena = (typeof ESTADOS_RESENA)[number];

function esEstadoResena(valor: unknown): valor is EstadoResena {
  return (
    typeof valor === "string" &&
    (ESTADOS_RESENA as readonly string[]).includes(valor)
  );
}

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
  const estado = body?.estado;

  if (!esEstadoResena(estado)) {
    return NextResponse.json(
      { error: "El estado de la reseña no es válido" },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("resenas_clientes")
    .update({
      estado,
      revisado_por_id: auth.user.id,
      revisado_en: new Date().toISOString(),
    })
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