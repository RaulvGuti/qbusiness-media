import type { Metadata } from "next";
import { obtenerConfiguracionSitio } from "@/server/repositories/configuracion";
import { Vista } from "./Vista";

export const metadata: Metadata = {
  title: { absolute: "QBusiness Media | Ideas claras, crecimiento real" },
};

export default async function Page() {
  const config = await obtenerConfiguracionSitio();
  return <Vista config={config} />;
}
