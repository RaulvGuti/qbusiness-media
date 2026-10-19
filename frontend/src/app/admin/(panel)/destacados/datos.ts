export const MODULOS = ["Producción audiovisual", "Fotografía", "Renta de estudio", "Ayuda social", "Empresas"] as const;

export type Elemento = { id: number; nombre: string; modulo: (typeof MODULOS)[number] };

export const CATALOGO: Elemento[] = [
  { id: 1, nombre: "Spot institucional Banco Atlas", modulo: "Producción audiovisual" },
  { id: 2, nombre: "Videoclip \"Luz de Medianoche\"", modulo: "Producción audiovisual" },
  { id: 3, nombre: "Documental Raíces del Café", modulo: "Producción audiovisual" },
  { id: 4, nombre: "Campaña de producto Aurora", modulo: "Fotografía" },
  { id: 5, nombre: "Sesión de moda Colección Otoño", modulo: "Fotografía" },
  { id: 6, nombre: "Podcast \"Voces del Barrio\"", modulo: "Renta de estudio" },
  { id: 7, nombre: "Sesión de grabación Banda Eco", modulo: "Renta de estudio" },
  { id: 8, nombre: "Jornada Cámaras por la Niñez", modulo: "Ayuda social" },
  { id: 9, nombre: "Banco Atlas", modulo: "Empresas" },
  { id: 10, nombre: "Café Altura", modulo: "Empresas" },
  { id: 11, nombre: "Grupo Meridian", modulo: "Empresas" },
  { id: 12, nombre: "Fundación Horizonte", modulo: "Empresas" },
];

export const DESTACADOS_INICIALES = [1, 9, 3, 10];

export function iniciales(texto: string) {
  return texto
    .replace(/["“”]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
