import { listarApoyoSocial } from "@/server/services/admin-seguimiento";
import SeguimientoAdminTable from "@/components/admin/SeguimientoAdminTable";

export const dynamic = "force-dynamic";

export default async function ApoyoSocialPage() {
  const solicitudes = await listarApoyoSocial();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-qbInk">Apoyo social</h1>
        <p className="text-qbMuted">
          Consulta y administra las solicitudes de fundaciones y bomberos.
        </p>
      </div>
      <SeguimientoAdminTable
        seccion="apoyo_social"
        registros={solicitudes}
      />
    </section>
  );
}
