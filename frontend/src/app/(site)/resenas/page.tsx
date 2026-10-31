import type { Metadata } from "next";
import { Vista } from "./Vista";
import {
  listarResenasAprobadas,
  obtenerReservaResenable,
} from "@/server/repositories/resenas";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const metadata: Metadata = {
  title: { absolute: "Reseñas | QBusiness Media" },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resenas = await listarResenasAprobadas();
  const reservaCompletada = user
    ? await obtenerReservaResenable(user.id)
    : null;

  return (
    <Vista
      resenas={resenas}
      tieneSesion={Boolean(user)}
      reservaCompletada={reservaCompletada}
    />
  );
}
