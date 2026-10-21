

import { listarContactos } from "@/server/services/admin-seguimiento";
import SeguimientoAdminTable from "@/components/admin/SeguimientoAdminTable";

export const dynamic = "force-dynamic";

export default async function ContactosPage() {
  const contactos = await listarContactos();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-qbInk">Contactos</h1>
        <p className="text-qbMuted">
          Consulta y administra los mensajes recibidos.
        </p>
      </div>
      <SeguimientoAdminTable
        seccion="contacto"
        registros={contactos}
      />
    </section>
  );
}