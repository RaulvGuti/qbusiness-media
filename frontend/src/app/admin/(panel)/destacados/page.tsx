import shared from "../panel.module.css";
import {
  listarDestacados,
  listarTodasLasCarpetas,
  listarTodasLasEmpresas,
} from "@/server/repositories/galeria";
import { exigirAdminPrincipalPanel } from "@/server/auth/panel";
import { construirCatalogo } from "./datos";
import { DestacadosPanel } from "./DestacadosPanel";

export const metadata = { title: "Destacados | Admin" };

export default async function DestacadosPage() {
  // Los destacados del inicio son contenido de marca: solo el principal (000038).
  await exigirAdminPrincipalPanel();

  // SUPABASE (admin): destacados (con joins), carpetas_galeria y empresas.
  const [destacados, carpetas, empresas] = await Promise.all([
    listarDestacados(),
    listarTodasLasCarpetas(),
    listarTodasLasEmpresas(),
  ]);

  const ordenActual = destacados.map((d) => d.carpetaId ?? d.empresaId).filter((x): x is string => !!x);

  return (
    <>
      <span className={shared.eye}>Gestión de contenido</span>
      <h1 className={shared.title}>Administración de destacados</h1>
      <p className={shared.sub}>
        Selecciona las carpetas y empresas destacadas del inicio. El orden se
        guarda en la tabla <code>destacados</code> (posicion única).
      </p>
      <DestacadosPanel
        catalogo={construirCatalogo(carpetas, empresas)}
        destacadosIniciales={ordenActual}
      />
    </>
  );
}
