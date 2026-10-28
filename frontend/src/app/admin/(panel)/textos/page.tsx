import shared from "../panel.module.css";
import { listarConfiguracion } from "@/server/repositories/configuracion";
import { valoresInicialesDesdeConfig } from "@/lib/config-sitio";
import { exigirAdminPrincipalPanel } from "@/server/auth/panel";
import { TextosForm } from "./TextosForm";

export const metadata = { title: "Textos | Admin" };

export default async function TextosPage() {
  // La configuración del sitio es exclusiva del administrador principal (000038).
  await exigirAdminPrincipalPanel();

  // Filas reales + defaults del catálogo para que el formulario nunca quede
  // con campos vacíos cuando la migración aún no se aplicó.
  const configs = await listarConfiguracion();
  const valoresIniciales = valoresInicialesDesdeConfig(configs);

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
