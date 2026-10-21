import type { GrupoConfig } from "@/types/config";

export type Campo = {
  grupo: GrupoConfig;
  clave: string;
  etiqueta: string;
  tipo?: "texto" | "area" | "numero" | "hora";
  alto?: number;
};

export type Grupo = { titulo: string; campos: Campo[] };

/**
 * Campos del editor de textos. Cada campo es un par (grupo, clave) de la tabla
 * configuracion_sitio (000016). Los grupos permitidos por el CHECK son:
 * menu, modulos, formularios, contacto, redes, ubicacion, estudio.
 */
export const PESTANAS: { id: string; titulo: string; grupos: Grupo[] }[] = [
  {
    id: "generales",
    titulo: "Textos generales",
    grupos: [
      {
        titulo: "Menú",
        campos: [
          {
            grupo: "menu",
            clave: "whatsapp_cta",
            etiqueta: "Mensaje del botón de WhatsApp",
            tipo: "area",
            alto: 80,
          },
        ],
      },
    ],
  },
  {
    id: "contacto",
    titulo: "Contacto y redes",
    grupos: [
      {
        titulo: "Contacto",
        campos: [
          { grupo: "contacto", clave: "correo", etiqueta: "Correo de contacto" },
          { grupo: "contacto", clave: "whatsapp", etiqueta: "Número de WhatsApp" },
        ],
      },
      {
        titulo: "Redes sociales",
        campos: [
          { grupo: "redes", clave: "instagram", etiqueta: "Instagram" },
          { grupo: "redes", clave: "youtube", etiqueta: "YouTube" },
          { grupo: "redes", clave: "tiktok", etiqueta: "TikTok" },
        ],
      },
      {
        titulo: "Ubicación",
        campos: [
          { grupo: "ubicacion", clave: "direccion", etiqueta: "Dirección" },
        ],
      },
    ],
  },
  {
    id: "estudio",
    titulo: "Renta de estudio",
    grupos: [
      {
        titulo: "Tarifas y horario",
        campos: [
          { grupo: "estudio", clave: "tarifa_hora", etiqueta: "Tarifa por hora (Q)", tipo: "numero" },
          { grupo: "estudio", clave: "hora_apertura", etiqueta: "Hora de apertura", tipo: "hora" },
          { grupo: "estudio", clave: "hora_cierre", etiqueta: "Hora de cierre", tipo: "hora" },
          {
            grupo: "estudio",
            clave: "max_pendientes_por_cliente",
            etiqueta: "Máximo de reservas pendientes por cliente",
            tipo: "numero",
          },
        ],
      },
    ],
  },
];
