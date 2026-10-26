import type { Metadata } from "next";
import { Vista, type MedioEstudio } from "./Vista";
import { obtenerCatalogoEstudioCliente } from "@/server/services/reservas/clients";
import { listarMediosPublicos } from "@/server/repositories/galeria";

export const metadata: Metadata = {
  title: { absolute: "Renta de Estudio | QBusiness Media" },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const [{ servicios, equipos, configuracion }, medios] = await Promise.all([
    obtenerCatalogoEstudioCliente(),
    // archivos de las carpetas publicadas del módulo "estudio"
    listarMediosPublicos("estudio"),
  ]);

  const mediosEstudio: MedioEstudio[] = medios.map((m) => ({
    id: m.id,
    tipo: m.tipo === "imagen" ? "foto" : m.tipo,
    url: m.url,
    titulo: m.pieFoto ?? m.nombre ?? undefined,
  }));

  return (
    <Vista
      servicios={servicios}
      equipos={equipos}
      tarifaHora={configuracion.tarifaHora}
      medios={mediosEstudio}
    />
  );
}

