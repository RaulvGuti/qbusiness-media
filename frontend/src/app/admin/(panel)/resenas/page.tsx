import shared from "../panel.module.css";
import { ResenasPanel } from "./ResenasPanel";

export default function ResenasPage() {
  return (
    <>
      <span className={shared.eye}>Moderación</span>
      <h1 className={shared.title}>Reseñas</h1>
      <p className={shared.sub}>Administra las reseñas realizadas por los visitantes, en texto y video.</p>
      <ResenasPanel />
    </>
  );
}
