import shared from "../panel.module.css";
import { listarTodasLasResenas } from "@/server/repositories/resenas";
import { ResenasPanel } from "./ResenasPanel";

export const metadata = { title: "Reseñas | Admin" };

export default async function ResenasPage() {
  // SUPABASE (admin): SELECT * FROM resenas_clientes ORDER BY creado_en DESC;
  const resenas = await listarTodasLasResenas();

  return (
    <>
      <span className={shared.eye}>Moderación</span>
      <h1 className={shared.title}>Reseñas</h1>
      <p className={shared.sub}>
        Administra las reseñas de clientes y administradores, en texto y video.
      </p>
      <ResenasPanel resenasIniciales={resenas} />
    </>
  );
}
