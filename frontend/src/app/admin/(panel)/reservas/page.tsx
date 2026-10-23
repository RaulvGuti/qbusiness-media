import shared from "../panel.module.css";
import { obtenerPanelReservasAdmin } from "@/server/services/reservas/admin";
import { ReservasPanel } from "./ReservasPanel";

export const metadata = { title: "Reservas | Admin" };

export default async function ReservasPage() {
  const { reservas, fechasBloqueadas } = await obtenerPanelReservasAdmin();

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
