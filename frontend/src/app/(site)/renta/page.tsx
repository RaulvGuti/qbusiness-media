import type { Metadata } from "next";
import { Vista } from "./Vista";
import { obtenerCatalogoEstudioCliente } from "@/server/services/reservas/clients";

export const metadata: Metadata = {
  title: { absolute: "Renta de Estudio | QBusiness Media" },
};

export default async function Page() {
  const { servicios, equipos, configuracion } = await obtenerCatalogoEstudioCliente();

  return (
    <Vista
      servicios={servicios}
      equipos={equipos}
      tarifaHora={configuracion.tarifaHora}
    />
  );
}
