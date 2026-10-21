import type { Metadata } from "next";
import { Vista } from "./Vista";
import { listarDestacadosPublicos } from "@/server/repositories/galeria";

export const metadata: Metadata = {
  title: { absolute: "Portafolio | QBusiness Media" },
};

export default async function Page() {
  // SUPABASE: destacados + carpetas_galeria estado='publicado' + empresas activa=true
  const destacados = await listarDestacadosPublicos();
  return <Vista destacados={destacados} />;
}
