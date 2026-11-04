
import shared from "../panel.module.css";
import { listarContactos } from "@/server/services/admin-seguimiento";
import SeguimientoAdminTable from "@/components/admin/SeguimientoAdminTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Contactos | Admin" };

export default async function ContactosPage() {
  let contactos: Awaited<ReturnType<typeof listarContactos>> = [];
  let error: string | null = null;

  try {
    contactos = await listarContactos();
  } catch (e) {
    error =
      e instanceof Error
        ? e.message
        : "No se pudieron cargar los contactos.";
    console.error("Error cargando contactos en el panel:", error);
  }

  return (
    <>
      <span className={shared.eye}>Captación</span>
      <h1 className={shared.title}>Contactos</h1>
      <p className={shared.sub}>Consulta y administra los mensajes recibidos.</p>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {!error && (
        <SeguimientoAdminTable seccion="contacto" registros={contactos} />
      )}
    </>
  );
}
