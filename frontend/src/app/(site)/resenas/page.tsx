import type { Metadata } from "next";
import { Vista } from "./Vista";
import {
  listarResenasAprobadas,
  listarResenasDeCliente,
  obtenerReservaResenable,
} from "@/server/repositories/resenas";
import {
  listarReservasDeCliente,
  obtenerPerfilClienteActual,
} from "@/server/repositories/estudio";

export const metadata: Metadata = {
  title: { absolute: "Reseñas | QBusiness Media" },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const cliente = await obtenerPerfilClienteActual();

  const [resenas, reservaCompletada, reservas, resenasPropias] =
    await Promise.all([
      listarResenasAprobadas(),
      cliente
        ? obtenerReservaResenable(cliente.id)
        : Promise.resolve(null),
      cliente ? listarReservasDeCliente(cliente.id) : Promise.resolve([]),
      cliente ? listarResenasDeCliente(cliente.id) : Promise.resolve([]),
    ]);

  return (
    <Vista
      resenas={resenas}
      tieneSesion={Boolean(cliente)}
      reservaCompletada={reservaCompletada}
      reservas={reservas}
      resenasPropias={resenasPropias}
    />
  );
}
