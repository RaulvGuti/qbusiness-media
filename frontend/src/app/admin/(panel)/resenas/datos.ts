export type Estado = "pendiente" | "aprobada" | "rechazada";

export type Video = { ratio: string; label: string; url?: string };

/** Vista de una ResenaCliente (types/resenas) para el panel de moderación. */
export type Resena = {
  id: string;
  autor: string;
  fecha: string;
  estrellas: number;
  texto: string;
  estado: Estado;
  empresa: string | null;
  origen: "cliente" | "admin";
  video: Video | null;
};

export const FILTROS_ESTADO: { clave: "todas" | Estado; texto: string }[] = [
  { clave: "todas", texto: "Todas" },
  { clave: "pendiente", texto: "Pendientes" },
  { clave: "aprobada", texto: "Aprobadas" },
  { clave: "rechazada", texto: "Rechazadas" },
];

export const FILTROS_TIPO = [
  { clave: "todos", texto: "Texto y video" },
  { clave: "texto", texto: "Solo texto" },
  { clave: "video", texto: "Con video" },
] as const;
