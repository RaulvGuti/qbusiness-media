import shared from "../panel.module.css";
import { listarApoyoSocial } from "@/server/services/admin-seguimiento";
import SeguimientoAdminTable from "@/components/admin/SeguimientoAdminTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Apoyo social | Admin" };

export default async function ApoyoSocialPage() {
  const solicitudes = await listarApoyoSocial();

  return (
    <>
      <span className={shared.eye}>Social</span>
      <h1 className={shared.title}>Apoyo social</h1>
      <p className={shared.sub}>
        Consulta y administra las solicitudes de fundaciones y bomberos.
      </p>
      <SeguimientoAdminTable seccion="apoyo_social" registros={solicitudes} />
    </>
  );
}
