import shared from "../panel.module.css";
import { exigirAdminPrincipalPanel } from "@/server/auth/panel";
import { listarEquiposAdmin } from "@/server/repositories/estudio";
import { EquipoPanel } from "./EquipoPanel";

export const metadata = { title: "Equipo | Admin" };

export default async function EquipoPage() {
  // El inventario y sus tarifas son exclusivos del administrador principal (000038).
  await exigirAdminPrincipalPanel();

  const equipos = await listarEquiposAdmin();

  return (
    <>
      <span className={shared.eye}>Estudio</span>
      <h1 className={shared.title}>Renta de equipo</h1>
      <p className={shared.sub}>
        Catálogo de equipos que se pueden sumar a una reserva. Un equipo
        inactivo no aparece en el sitio público, pero conserva su historial.
      </p>
      <EquipoPanel equiposIniciales={equipos} />
    </>
  );
}
