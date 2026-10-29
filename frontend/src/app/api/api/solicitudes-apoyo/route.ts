import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { requireAdmin } from "@/server/auth/require-admin";
import { createSupabaseServerClient } from "@/server/supabase/server";

const ESTADOS = [
  "nueva",
  "en_revision",
  "aprobada",
  "rechazada",
] as const;

export async function POST(request: Request) {
  try {
    // Verify user session (any logged-in user)
    const supabaseSrv = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabaseSrv.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Inicia sesión para enviar una solicitud de apoyo." }, { status: 401 });
    }

    const body = await request.json();

    const nombreEntidad = String(body.nombreEntidad ?? body.nombreOrganizacion ?? "").trim();
    const personaContacto = String(body.personaContacto ?? body.nombreContacto ?? "").trim();
    const correo = String(body.correo ?? body.email ?? "").trim().toLowerCase();
    const telefono = String(body.telefono ?? "").trim();
    const descripcion = String(body.descripcionProyecto ?? "").trim();
    const tipoEntidad = String(body.tipoEntidad ?? "").trim() || null;
    const fechaEvento = String(body.fechaEvento ?? "").trim() || null;

    if (!nombreEntidad || !personaContacto || !correo || !descripcion) {
      return NextResponse.json({ error: "Completa los campos obligatorios." }, { status: 400 });
    }

    if (
      nombreEntidad.length > 200 ||
      personaContacto.length > 200 ||
      correo.length > 254 ||
      telefono.length > 40 ||
      descripcion.length > 5000 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {
      return NextResponse.json({ error: "Los datos ingresados no son válidos." }, { status: 400 });
    }

    let guardadoEnDb = false;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase
          .from("solicitudes_apoyo_social")
          .insert({
            nombre_entidad: nombreEntidad,
            persona_contacto: personaContacto,
            correo,
            telefono: telefono || null,
            descripcion_proyecto: descripcion,
            tipo_organizacion: tipoEntidad,
            fecha_tentativa: fechaEvento || null,
            estado: "nueva",
          });
        if (!error) {
          guardadoEnDb = true;
        } else {
          console.warn("Fallo guardado en Supabase, usando repositorio local:", error.message);
        }
      } catch (err) {
        console.warn("Error con cliente Supabase, usando repositorio local:", err);
      }
    }

    if (!guardadoEnDb) {
      const { crearSolicitud } = await import("@/server/repositories/solicitudes");
      await crearSolicitud({
        nombreEntidad,
        personaContacto,
        correo,
        telefono: telefono || undefined,
        descripcionProyecto: descripcion,
        tipoEntidad: tipoEntidad || undefined,
        fechaEvento: fechaEvento || undefined,
      });
    }

    return NextResponse.json({ mensaje: "Solicitud enviada correctamente." }, { status: 201 });
  } catch (error) {
    console.error("Error procesando solicitud de apoyo:", error);
    return NextResponse.json({ error: "No se pudo procesar la solicitud." }, { status: 400 });
  }
}

export async function GET() {
  const acceso = await requireAdmin();

  if (!acceso.authorized) {
    return NextResponse.json(
      {
        error:
          acceso.status === 401
            ? "Inicia sesión para consultar las solicitudes."
            : "Tu cuenta no tiene acceso a las solicitudes.",
      },
      { status: acceso.status },
    );
  }

  const { data, error } = await acceso.supabase
    .from("solicitudes_apoyo_social")
    .select(
      "id, nombre_entidad, persona_contacto, correo, telefono, descripcion_proyecto, tipo_entidad, fecha_evento, tipo_organizacion, cargo_contacto, ubicacion, objetivo_apoyo, fecha_tentativa, publico_beneficiario, alcance_solicitado, presupuesto_propio, comentarios, notas_admin, actualizado_en, gestionado_por_id, estado, creado_en"
    )
    .order("creado_en", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "No se pudieron consultar las solicitudes." }, { status: 500 });
  }

  return NextResponse.json({ solicitudes: data });
}

export async function PATCH(request: Request) {
  const acceso = await requireAdmin();

  if (!acceso.authorized) {
    return NextResponse.json(
      {
        error:
          acceso.status === 401
            ? "Inicia sesión para modificar las solicitudes."
            : "Tu cuenta no tiene acceso a las solicitudes.",
      },
      { status: acceso.status },
    );
  }

  let body: { id?: string; estado?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La solicitud no contiene JSON válido." }, { status: 400 });
  }

  if (!body.id || !ESTADOS.includes(body.estado as (typeof ESTADOS)[number])) {
    return NextResponse.json({ error: "Debes indicar una solicitud y un estado válido." }, { status: 400 });
  }

  const { data, error } = await acceso.supabase
    .from("solicitudes_apoyo_social")
    .update({ estado: body.estado })
    .eq("id", body.id)
    .select("id, estado")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "No se pudo actualizar el estado de la solicitud." }, { status: 500 });
  }

  return NextResponse.json({ solicitud: data });
}
