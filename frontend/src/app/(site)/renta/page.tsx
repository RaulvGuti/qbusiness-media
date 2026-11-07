import type { Metadata } from "next";
import { Vista, type MedioEstudio } from "./Vista";
import { obtenerCatalogoEstudioCliente } from "@/server/services/reservas/clients";
import { listarMediosPublicos } from "@/server/repositories/galeria";
import { listarReservasDeCliente } from "@/server/repositories/estudio";
import { listarResenasDeCliente } from "@/server/repositories/resenas";

export const metadata: Metadata = {
  title: { absolute: "Renta de Estudio | QBusiness Media" },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const [{ servicios, equipos, paquetes, cliente }, medios] =
    await Promise.all([
      obtenerCatalogoEstudioCliente(),
      // archivos de las carpetas publicadas del módulo "estudio"
      listarMediosPublicos("estudio"),
    ]);

  const [reservas, resenasPropias] = cliente
    ? await Promise.all([
        listarReservasDeCliente(cliente.id),
        listarResenasDeCliente(cliente.id),
      ])
    : [[], []];

  // El descuento de lealtad se aplica desde la quinta reserva completada.
  const reservasCompletadas = reservas.filter(
    (reserva) => reserva.estado === "completada",
  ).length;

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
      paquetes={paquetes}
      reservasCompletadas={reservasCompletadas}
      medios={mediosEstudio}
      cliente={cliente}
      reservas={reservas}
      resenasPropias={resenasPropias}
    />
  );
}

