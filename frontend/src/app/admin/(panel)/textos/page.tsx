import shared from "../panel.module.css";
import { listarConfiguracion } from "@/server/repositories/configuracion";
import { exigirAdminPrincipalPanel } from "@/server/auth/panel";
import { TextosForm } from "./TextosForm";

export const metadata = { title: "Textos | Admin" };

export default async function TextosPage() {
  // La configuración del sitio es exclusiva del administrador principal (000038).
  await exigirAdminPrincipalPanel();

  // SUPABASE (anon/admin): SELECT * FROM configuracion_sitio ORDER BY grupo, clave;
  const configs = await listarConfiguracion();

  const valoresIniciales: Record<string, string> = {};
  for (const c of configs) {
    valoresIniciales[`${c.grupo}:${c.clave}`] = c.valor ?? "";
  }

  return (
    <>
      <span className={shared.eye}>Gestión de contenido</span>
      <h1 className={shared.title}>Textos y configuración del sitio</h1>
      <p className={shared.sub}>
        Valores de la tabla <code>configuracion_sitio</code> que se muestran en
        el sitio público.
      </p>
      <TextosForm valoresIniciales={valoresIniciales} />
    </>
  );
}
