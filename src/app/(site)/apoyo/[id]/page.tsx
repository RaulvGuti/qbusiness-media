import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetalleCarpeta } from "@/components/galeria/DetalleCarpeta";
import { obtenerCarpetaPublicaConMedios } from "@/server/repositories/galeria";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const cargar = cache((id: string) => obtenerCarpetaPublicaConMedios(id, "apoyo_social"));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const datos = await cargar(id);
  return {
    title: { absolute: `${datos?.carpeta.nombre ?? "Evento"} | Apoyo Social | QBusiness Media` },
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
      etiqueta="Apoyo Social"
      volverHref="/apoyo"
      volverTexto="Volver a apoyo social"
    />
  );
}
