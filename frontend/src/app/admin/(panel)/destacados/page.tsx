import shared from "../panel.module.css";
import { DestacadosPanel } from "./DestacadosPanel";

export default function DestacadosPage() {
  return (
    <>
      <span className={shared.eye}>Gestión de contenido</span>
      <h1 className={shared.title}>Administración de destacados</h1>
      <p className={shared.sub}>
        Selecciona los proyectos destacados de todos los módulos y las empresas con las que se ha trabajado.
      </p>
      <DestacadosPanel />
    </>
  );
}
