import shared from "../panel.module.css";
import { listarLeads } from "@/server/repositories/leads";
import { listarSolicitudes } from "@/server/repositories/solicitudes";
import { ContactosPanel } from "./ContactosPanel";

export const metadata = { title: "Contactos | Admin" };

export default async function ContactosPage() {
  // SUPABASE (admin): leads_contacto y solicitudes_apoyo_social ordenados por creado_en.
  const [leads, solicitudes] = await Promise.all([
    listarLeads(),
    listarSolicitudes(),
  ]);

  return (
    <>
      <span className={shared.eye}>Captación</span>
      <h1 className={shared.title}>Contactos</h1>
      <p className={shared.sub}>
        Mensajes del formulario de contacto y solicitudes de apoyo social.
      </p>
      <ContactosPanel leadsIniciales={leads} solicitudesIniciales={solicitudes} />
    </>
  );
}
