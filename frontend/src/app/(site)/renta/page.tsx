import type { Metadata } from "next";
import { Vista } from "./Vista";
import { listarEquiposActivos, listarServiciosActivos, obtenerConfiguracionEstudio } from "@/server/repositories/estudio";

export const metadata: Metadata = {
  title: { absolute: "Renta de Estudio | QBusiness Media" },
};

export default async function Page() {
  // SUPABASE: servicios_estudio activos, inventario_equipos activos,
  // configuracion_sitio grupo='estudio' (tarifa_hora).
  const [servicios, equipos, config] = await Promise.all([
    listarServiciosActivos(),
    listarEquiposActivos(),
    obtenerConfiguracionEstudio(),
  ]);

  return (
    <Vista
      servicios={servicios}
      equipos={equipos}
      tarifaHora={config.tarifaHora}
    />
  );
}
