import shared from "../panel.module.css";
import {
  listarTodasLasCarpetas,
  listarTodasLasEmpresas,
  listarTodosLosArchivos,
} from "@/server/repositories/galeria";
import { exigirAdminPrincipalPanel } from "@/server/auth/panel";
import { GaleriaPanel } from "./GaleriaPanel";

export const metadata = { title: "Galería | Admin" };

export default async function GaleriaPage() {
  // La galería es contenido de marca: solo la administra el principal (000038).
  await exigirAdminPrincipalPanel();

  // SUPABASE (admin): carpetas_galeria, archivos_galeria y empresas.
  const [carpetas, archivos, empresas] = await Promise.all([
    listarTodasLasCarpetas(),
    listarTodosLosArchivos(),
    listarTodasLasEmpresas(),
  ]);

  return (
    <>
      <span className={shared.eye}>Contenido</span>
      <h1 className={shared.title}>Galería</h1>
      <p className={shared.sub}>
        Carpetas de portafolio, backstage y archivos subidos. Las fotos y videos
        se guardan en Cloudflare R2 y se sirven desde el CDN configurado.
      </p>
      <GaleriaPanel
        carpetasIniciales={carpetas}
        archivosIniciales={archivos}
        empresasIniciales={empresas}
      />
    </>
  );
}
