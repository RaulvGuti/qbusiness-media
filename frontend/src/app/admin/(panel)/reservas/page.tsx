import shared from "../panel.module.css";
import { listarFechasBloqueadas, listarReservas } from "@/server/repositories/estudio";
import { ReservasPanel } from "./ReservasPanel";

export const metadata = { title: "Reservas | Admin" };

export default async function ReservasPage() {
  // SUPABASE (admin): SELECT * FROM reservas ORDER BY fecha_hora_inicio DESC;
  //                    SELECT * FROM fechas_bloqueadas ORDER BY desde;
  const [reservas, fechasBloqueadas] = await Promise.all([
    listarReservas(),
    listarFechasBloqueadas(),
  ]);

  return (
    <>
      <span className={shared.eye}>Estudio</span>
      <h1 className={shared.title}>Reservas del estudio</h1>
      <p className={shared.sub}>
        Solicitudes de renta, estado de pago y bloqueos del calendario.
      </p>
      <ReservasPanel reservasIniciales={reservas} fechasIniciales={fechasBloqueadas} />
    </>
  );
}
