import shared from "../panel.module.css";
import { listarTodasLasResenas } from "@/server/repositories/resenas";
import type { ResenaCliente } from "@/types/resenas";
import { ResenasPanel } from "./ResenasPanel";
import type { Resena } from "./datos";

export const metadata = { title: "Reseñas | Admin" };

function aVista(r: ResenaCliente): Resena {
  return {
    id: r.id,
    autor: r.autor,
    fecha: new Date(r.creadoEn).toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    estrellas: r.calificacion ?? 0,
    texto: r.comentario,
    estado: r.estado,
    empresa: r.empresaAutor,
    origen: r.origen,
    video: r.videoUrl
      ? {
          ratio: r.videoProporcion ?? "16/9",
          label: r.videoProporcion ?? "16/9",
          url: r.videoUrl,
        }
      : null,
  };
}

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
      <ResenasPanel resenasIniciales={resenas.map(aVista)} />
    </>
  );
}
