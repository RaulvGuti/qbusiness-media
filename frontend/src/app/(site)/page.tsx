import type { Metadata } from "next";
import { obtenerConfiguracionSitio } from "@/server/repositories/configuracion";
import { listarDestacadosPublicosConPortada } from "@/server/repositories/galeria";
import { Vista } from "./Vista";

export const metadata: Metadata = {
  title: { absolute: "QBusiness Media | Ideas claras, crecimiento real" },
};

export default async function Page() {
  const [config, destacados] = await Promise.all([
    obtenerConfiguracionSitio(),
    listarDestacadosPublicosConPortada(),
  ]);
  return <Vista config={config} destacados={destacados} />;
}
