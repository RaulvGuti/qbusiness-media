import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/require-admin";
import { createSupabaseServerClient } from "@/server/supabase/server";

// ---------------------------------------------------------------------------
// POST /api/resenas – crear una reseña
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  // 1️⃣ Verificar que el usuario esté autenticado
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: "Inicia sesión para dejar una reseña" },
      { status: 401 },
    );
  }

  // 2️⃣ Verificar que el usuario tenga al menos una reserva CONFIRMADA
  const { data: reserva, error: reservaError } = await supabase
    .from("reservas")
    .select("id")
    .eq("cliente_id", user.id)
    .eq("estado", "confirmada")
    .limit(1)
    .single();

  if (reservaError || !reserva) {
    return NextResponse.json(
      { error: "Debes haber realizado una reserva antes de dejar una reseña" },
      { status: 403 },
    );
  }

  // 3️⃣ Procesar cuerpo de la petición
  const body = await request.json();
  const { comentario, calificacion, reserva_id } = body;

  if (!comentario || typeof calificacion !== "number") {
    return NextResponse.json(
      { error: "Campos faltantes o inválidos" },
      { status: 400 },
    );
  }

  // 3.1️⃣ Si se envía reserva_id, validar que pertenece al usuario y está confirmada
  let reservaId = reserva.id;
  if (reserva_id) {
    const { data: reservaValid, error: errValid } = await supabase
      .from("reservas")
      .select("id")
      .eq("id", reserva_id)
      .eq("cliente_id", user.id)
      .eq("estado", "confirmada")
      .single();
    if (errValid || !reservaValid) {
      return NextResponse.json(
        { error: "La reserva indicada no es válida o no pertenece a tu cuenta" },
        { status: 403 },
      );
    }
    reservaId = reservaValid.id;
  }

  // 3.2️⃣ Evitar reseña duplicada para la misma reserva
  const { data: existente } = await supabase
    .from("resenas_clientes")
    .select("id")
    .eq("reserva_id", reservaId)
    .eq("cliente_id", user.id)
    .limit(1)
    .single();
  if (existente) {
    return NextResponse.json(
      { error: "Ya has dejado una reseña para esta reserva" },
      { status: 409 },
    );
  }

  // 4️⃣ Insertar la reseña
  const { data, error } = await supabase
    .from("resenas_clientes")
    .insert({
      cliente_id: user.id,
      reserva_id: reservaId,
      comentario,
      calificacion,
      estado: "pendiente",
    })
    .select()
    .single();

  if (error) {
    console.warn("Error al crear reseña", error);
    return NextResponse.json(
      { error: "No se pudo crear la reseña" },
      { status: 500 },
    );
  }

  return NextResponse.json({ reseña: data }, { status: 201 });
}

// ---------------------------------------------------------------------------
// GET /api/resenas – obtener todas las reseñas (admin only)
// ---------------------------------------------------------------------------
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: auth.status });
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
  return NextResponse.json({ resenas: data ?? [] });
}
