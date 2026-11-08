import type { Metadata } from "next";
import { Vista } from "./Vista";
import { listarCarpetasPublicadasConPortada } from "@/server/repositories/galeria";

export const metadata: Metadata = {
  title: { absolute: "Portafolio | QBusiness Media" },
};

// Siempre al día: lo que el administrador publica se ve sin volver a compilar.
export const dynamic = "force-dynamic";

export default async function Page() {
  // carpetas_galeria estado='publicado' modulo='portafolio' + su portada
  const carpetas = await listarCarpetasPublicadasConPortada("portafolio");
  return <Vista carpetas={carpetas} />;
}
