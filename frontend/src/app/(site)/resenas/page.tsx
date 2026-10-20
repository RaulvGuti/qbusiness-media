import type { Metadata } from "next";
import { Vista } from "./Vista";
import { listarResenasAprobadas } from "@/server/repositories/resenas";

export const metadata: Metadata = {
  title: { absolute: "Reseñas | QBusiness Media" },
};

export default async function Page() {
  // SUPABASE (anon): SELECT * FROM resenas_clientes WHERE estado='aprobada'
  // ORDER BY creado_en DESC;  (lectura pública por RLS)
  const resenas = await listarResenasAprobadas();
  return <Vista resenas={resenas} />;
}
