import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/require-admin";
import { createSupabaseServerClient } from "@/server/supabase/server";

const PROPORCIONES_VIDEO = ["16/9", "9/16"] as const;

type ProporcionVideo = (typeof PROPORCIONES_VIDEO)[number];

type CuerpoResena = {
  reserva_id?: unknown;
  autor?: unknown;
  empresa_autor?: unknown;
  comentario?: unknown;
  calificacion?: unknown;
  video_url?: unknown;
  video_proporcion?: unknown;
};

function textoOpcional(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

function esProporcionVideo(valor: unknown): valor is ProporcionVideo {
  return (
    typeof valor === "string" &&
    (PROPORCIONES_VIDEO as readonly string[]).includes(valor)
  );
}

export async function POST(request: Request) {
  let cuerpo: CuerpoResena;

  try {
    cuerpo = (await request.json()) as CuerpoResena;
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no es válido" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Inicia sesión para dejar una reseña" },
      { status: 401 },
    );
  }

  const reservaId = textoOpcional(cuerpo.reserva_id);

  if (!reservaId) {
    return NextResponse.json(
      { error: "Indica la reserva que quieres reseñar" },
      { status: 400 },
    );
  }

  const comentario = textoOpcional(cuerpo.comentario);
  const calificacion = cuerpo.calificacion;

  if (!comentario) {
    return NextResponse.json(
      { error: "Escribe el comentario de tu reseña" },
      { status: 400 },
    );
  }

  if (
    typeof calificacion !== "number" ||
    !Number.isInteger(calificacion) ||
    calificacion < 1 ||
    calificacion > 5
  ) {
    return NextResponse.json(
      { error: "La calificación debe ser un número entero entre 1 y 5" },
      { status: 400 },
    );
  }

  const videoUrl = textoOpcional(cuerpo.video_url);
  const videoProporcion = videoUrl
    ? esProporcionVideo(cuerpo.video_proporcion)
      ? cuerpo.video_proporcion
      : null
    : null;

  // La reserva debe ser del cliente autenticado y estar COMPLETADA, que es lo
  // mismo que exige la RLS de resenas_clientes (000035).
  const { data: reserva, error: reservaError } = await supabase
    .from("reservas")
    .select("id, nombre")
    .eq("id", reservaId)
    .eq("cliente_id", user.id)
    .eq("estado", "completada")
    .maybeSingle();

  if (reservaError) {
    return NextResponse.json(
      { error: "No se pudo verificar la reserva" },
      { status: 500 },
    );
  }

  if (!reserva) {
    return NextResponse.json(
      {
        error:
          "La reserva no existe, no pertenece a tu cuenta o aún no está completada",
      },
      { status: 403 },
    );
  }

  const autor = textoOpcional(cuerpo.autor) ?? reserva.nombre;

  if (!autor) {
    return NextResponse.json(
      { error: "Indica el nombre con el que firmarás la reseña" },
      { status: 400 },
    );
  }

  // Una reseña por reserva (la columna reserva_id es UNIQUE).
  const { data: existente, error: existenteError } = await supabase
    .from("resenas_clientes")
    .select("id")
    .eq("reserva_id", reservaId)
    .maybeSingle();

  if (existenteError) {
    return NextResponse.json(
      { error: "No se pudo verificar si ya existe una reseña" },
      { status: 500 },
    );
  }

  if (existente) {
    return NextResponse.json(
      { error: "Ya has dejado una reseña para esta reserva" },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("resenas_clientes")
    .insert({
      cliente_id: user.id,
      reserva_id: reserva.id,
      autor,
      empresa_autor: textoOpcional(cuerpo.empresa_autor),
      comentario,
      calificacion,
      video_url: videoUrl,
      video_proporcion: videoProporcion,
      origen: "cliente",
      estado: "pendiente",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya has dejado una reseña para esta reserva" },
        { status: 409 },
      );
    }

    console.error("Error al crear reseña:", error.code);
    return NextResponse.json(
      { error: "No se pudo crear la reseña" },
      { status: 500 },
    );
  }

  return NextResponse.json({ resena: data }, { status: 201 });
}

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
