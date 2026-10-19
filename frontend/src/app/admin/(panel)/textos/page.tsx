import shared from "../panel.module.css";
import { TextosForm } from "./TextosForm";

export default function TextosPage() {
  return (
    <>
      <span className={shared.eye}>Gestión de contenido</span>
      <h1 className={shared.title}>Textos y configuración del sitio</h1>
      <p className={shared.sub}>Edita el contenido que se muestra en el sitio público.</p>
      <TextosForm />
    </>
  );
}
