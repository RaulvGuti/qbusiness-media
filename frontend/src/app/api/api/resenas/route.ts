
import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/require-admin";


import { createSupabaseServerClient } from "@/server/supabase/server";

export async function POST(request: Request) {
  // 1️⃣ Verificar que el usuario esté autenticado
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Inicia sesión para dejar una reseña" }, { status: 401 });
  }

  // 2️⃣ Verificar que el usuario tenga al menos una reserva confirmada
  const { data: reserva, error: reservaError } = await supabase
    .from("reservas")
    .select("id")
    .eq("cliente_id", user.id)
    .neq("estado", "cancelada")
    .limit(1)
    .single();

  if (reservaError || !reserva) {
    return NextResponse.json({ error: "Debes haber realizado una reserva antes de dejar una reseña" }, { status: 403 });
  }

  // 3️⃣ Procesar el cuerpo de la petición (campos de la reseña)
  const body = await request.json();
  const { comentario, calificacion, reserva_id } = body;

  if (!comentario || typeof calificacion !== "number") {
    return NextResponse.json({ error: "Campos faltantes o inválidos" }, { status: 400 });
  }

  // 4️⃣ Insertar la reseña (se asume tabla resenas_clientes)
  const { data, error } = await supabase
    .from("resenas_clientes")
    .insert({
      cliente_id: user.id,
      reserva_id: reserva_id ?? reserva.id,
      comentario,
      calificacion,
      estado: "pendiente",
    })
    .select()
    .single();

  if (error) {
    console.warn("Error al crear reseña", error);
    return NextResponse.json({ error: "No se pudo crear la reseña" }, { status: 500 });
  }

  return NextResponse.json({ reseña: data }, { status: 201 });
}


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
