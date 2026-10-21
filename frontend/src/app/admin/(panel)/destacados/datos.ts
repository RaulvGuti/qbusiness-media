import type { CarpetaGaleria, Empresa } from "@/types/portafolio";

/** Etiqueta visible de los módulos de carpeta. */
export const MODULOS: { clave: CarpetaGaleria["modulo"]; texto: string }[] = [
  { clave: "portafolio", texto: "Portafolio" },
  { clave: "backstage", texto: "Backstage" },
  { clave: "estudio", texto: "Estudio" },
  { clave: "apoyo_social", texto: "Apoyo social" },
];

export const MODULO_EMPRESAS = "Empresas";

/** Ítem del catálogo de destacados: una carpeta o una empresa. */
export type ElementoCatalogo = {
  id: string;
  nombre: string;
  modulo: string;
  tipo: "carpeta" | "empresa";
};

export function construirCatalogo(
  carpetas: CarpetaGaleria[],
  empresas: Empresa[],
): ElementoCatalogo[] {
  return [
    ...carpetas.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      modulo: MODULOS.find((m) => m.clave === c.modulo)?.texto ?? c.modulo,
      tipo: "carpeta" as const,
    })),
    ...empresas.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      modulo: MODULO_EMPRESAS,
      tipo: "empresa" as const,
    })),
  ];
}

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
