
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/require-admin";

export async function GET() {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: auth.status },
    );
  }

  const { data, error } = await auth.supabase
    .from("resenas_clientes")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error al consultar reseñas:", error);

    return NextResponse.json(
      { error: "No se pudieron cargar las reseñas" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    resenas: data ?? [],
  });
}
