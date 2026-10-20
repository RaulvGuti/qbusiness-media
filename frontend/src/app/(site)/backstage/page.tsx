import type { Metadata } from "next";
import { Vista } from "./Vista";
import { listarCarpetasPublicadas } from "@/server/repositories/galeria";

export const metadata: Metadata = {
  title: { absolute: "Backstage | QBusiness Media" },
};

export default async function Page() {
  // SUPABASE: SELECT * FROM carpetas_galeria WHERE estado='publicado' AND modulo='backstage'
  const carpetas = await listarCarpetasPublicadas('backstage');
  return <Vista carpetas={carpetas} />;
}
