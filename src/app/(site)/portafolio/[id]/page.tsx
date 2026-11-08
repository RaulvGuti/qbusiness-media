import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetalleCarpeta } from "@/components/galeria/DetalleCarpeta";
import { obtenerCarpetaPublicaConMedios } from "@/server/repositories/galeria";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Una sola consulta por petición (la comparten generateMetadata y la página).
const cargar = cache((id: string) => obtenerCarpetaPublicaConMedios(id, "portafolio"));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const datos = await cargar(id);
  return {
    title: { absolute: `${datos?.carpeta.nombre ?? "Proyecto"} | Portafolio | QBusiness Media` },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const datos = await cargar(id);
  if (!datos) notFound();

  return (
    <DetalleCarpeta
      carpeta={datos.carpeta}
      medios={datos.medios}
      etiqueta="Portafolio"
      volverHref="/portafolio"
      volverTexto="Volver al portafolio"
    />
  );
}
