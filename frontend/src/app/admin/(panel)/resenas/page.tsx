import shared from "../panel.module.css";
import { listarTodasLasResenas } from "@/server/repositories/resenas";
import { ResenasPanel } from "./ResenasPanel";

export const dynamic = "force-dynamic";

export const metadata = { title: "Reseñas | Admin" };

export default async function ResenasPage() {
  let resenas: Awaited<ReturnType<typeof listarTodasLasResenas>> = [];

  try {
    resenas = await listarTodasLasResenas();
  } catch {
    // El panel vuelve a pedir la lista al endpoint y muestra el error real.
    console.error("No se pudieron cargar las reseñas en el panel.");
  }

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
