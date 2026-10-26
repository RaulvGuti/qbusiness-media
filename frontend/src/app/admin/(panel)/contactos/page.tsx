
import shared from "../panel.module.css";
import { listarContactos } from "@/server/services/admin-seguimiento";
import SeguimientoAdminTable from "@/components/admin/SeguimientoAdminTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Contactos | Admin" };

export default async function ContactosPage() {
  const contactos = await listarContactos();

  return (
    <>
      <span className={shared.eye}>Captación</span>
      <h1 className={shared.title}>Contactos</h1>
      <p className={shared.sub}>Consulta y administra los mensajes recibidos.</p>
      <SeguimientoAdminTable seccion="contacto" registros={contactos} />
    </>
  );
}
