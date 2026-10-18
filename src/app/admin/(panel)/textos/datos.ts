export type Campo = {
  etiqueta: string;
  valor: string;
  largo?: boolean;
  alto?: number;
};

export type Grupo = { titulo: string; campos: Campo[] };

export const PESTANAS = [
  {
    id: "generales",
    titulo: "Textos generales",
    grupos: [
      {
        titulo: "Menú",
        campos: [
          { etiqueta: "Inicio", valor: "Inicio" },
          { etiqueta: "Backstage", valor: "Backstage" },
          { etiqueta: "Apoyo social", valor: "Apoyo social" },
          { etiqueta: "Renta de estudio", valor: "Renta de estudio" },
        ],
      },
      {
        titulo: "Encabezados de módulos",
        campos: [
          { etiqueta: "Título", valor: "Nuestro trabajo" },
          { etiqueta: "Subtítulo", valor: "Producción audiovisual a tu medida" },
          {
            etiqueta: "Descripción introductoria",
            valor: "Conoce los proyectos que hemos realizado junto a nuestros clientes.",
            largo: true,
          },
        ],
      },
      {
        titulo: "Sobre QBusiness MEDIA",
        campos: [
          {
            etiqueta: "Texto",
            valor: "Somos una empresa dedicada a la producción de contenido audiovisual.",
            largo: true,
            alto: 120,
          },
        ],
      },
      {
        titulo: "Formularios",
        campos: [
          { etiqueta: "Etiqueta del nombre", valor: "Nombre completo" },
          { etiqueta: "Etiqueta del correo", valor: "Correo electrónico" },
          { etiqueta: "Texto del botón", valor: "Enviar mensaje" },
          { etiqueta: "Mensaje de confirmación", valor: "Gracias, te contactaremos pronto." },
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
          { etiqueta: "Número de WhatsApp", valor: "+502 0000 0000" },
          { etiqueta: "Correo de contacto", valor: "contacto@qbusiness.com" },
          { etiqueta: "Teléfono", valor: "+502 0000 0000" },
          { etiqueta: "Horario de atención", valor: "Lunes a viernes, 9:00 a 18:00" },
        ],
      },
      {
        titulo: "Redes sociales",
        campos: [
          { etiqueta: "Instagram", valor: "https://instagram.com/" },
          { etiqueta: "Facebook", valor: "https://facebook.com/" },
          { etiqueta: "TikTok", valor: "https://tiktok.com/" },
          { etiqueta: "YouTube", valor: "https://youtube.com/" },
        ],
      },
      {
        titulo: "Ubicación",
        campos: [
          { etiqueta: "Dirección", valor: "Ciudad de Guatemala, Guatemala", largo: false },
          { etiqueta: "Enlace del mapa", valor: "https://maps.google.com/" },
        ],
      },
    ],
  },
  {
    id: "estudio",
    titulo: "Renta de estudio",
    grupos: [
      {
        titulo: "Información general",
        campos: [
          { etiqueta: "Precio por hora", valor: "Q 0.00" },
          { etiqueta: "Ubicación del estudio", valor: "Ciudad de Guatemala, Guatemala" },
          {
            etiqueta: "Características",
            valor: "Cabina insonorizada, iluminación profesional, fondos intercambiables, equipo de audio.",
            largo: true,
          },
        ],
      },
    ],
  },
] as const;
