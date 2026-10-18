export type Estado = "pendiente" | "aprobada" | "rechazada";

export type Video = { ratio: string; label: string; url?: string };

export type Resena = {
  id: number;
  autor: string;
  fecha: string;
  estrellas: number;
  texto: string;
  estado: Estado;
  proyecto: string | null;
  video: Video | null;
};

export const RESENAS_INICIALES: Resena[] = [
  {
    id: 1,
    autor: "Marcela Ortiz",
    fecha: "Hace 2 h",
    estrellas: 5,
    texto: "Un equipo muy profesional. El spot quedó mejor de lo que imaginábamos y entregaron antes de la fecha.",
    estado: "pendiente",
    proyecto: null,
    video: null,
  },
  {
    id: 2,
    autor: "Grupo Meridian",
    fecha: "Hace 1 día",
    estrellas: 5,
    texto: "Excelente experiencia de principio a fin. Totalmente recomendados para producción corporativa.",
    estado: "aprobada",
    proyecto: "Spot institucional Banco Atlas",
    video: { ratio: "16/9", label: "16:9" },
  },
  {
    id: 3,
    autor: "Luis Fernando Paz",
    fecha: "Hace 2 días",
    estrellas: 3,
    texto: "El resultado final fue bueno, pero la comunicación durante el proceso pudo ser más ágil.",
    estado: "pendiente",
    proyecto: null,
    video: null,
  },
  {
    id: 4,
    autor: "Café Altura",
    fecha: "Hace 3 días",
    estrellas: 5,
    texto: "Nos ayudaron a contar nuestra historia con un video vertical para redes que funcionó muy bien.",
    estado: "aprobada",
    proyecto: "Documental Raíces del Café",
    video: { ratio: "9/16", label: "9:16" },
  },
  {
    id: 5,
    autor: "Anónimo",
    fecha: "Hace 4 días",
    estrellas: 1,
    texto: "Comentario ofensivo sin relación con el servicio.",
    estado: "rechazada",
    proyecto: null,
    video: null,
  },
  {
    id: 6,
    autor: "Daniela Reyes",
    fecha: "Hace 5 días",
    estrellas: 4,
    texto: "El estudio es cómodo y el sonido es increíble. Volveremos a grabar nuestro próximo episodio.",
    estado: "aprobada",
    proyecto: "Podcast \"Voces del Barrio\"",
    video: null,
  },
  {
    id: 7,
    autor: "Fundación Horizonte",
    fecha: "Hace 1 semana",
    estrellas: 5,
    texto: "Gracias por apoyar nuestra jornada. Un trabajo con mucho corazón.",
    estado: "pendiente",
    proyecto: null,
    video: { ratio: "1/1", label: "1:1" },
  },
];

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
