import type { RolAdministrador } from "@/types/admin";

/**
 * Permisos del panel administrativo (000038).
 *
 * Este archivo es la única fuente de verdad del lado del cliente y del
 * servidor: el menú, los accesos rápidos y los guards de cada página leen de
 * aquí. La base de datos repite la misma separación con RLS y triggers, porque
 * el frontend nunca es la única barrera.
 */

export const ETIQUETAS_ROL: Record<RolAdministrador, string> = {
  admin_principal: "Administrador principal",
  secretaria: "Secretaría",
};

export const DESCRIPCION_ROL: Record<RolAdministrador, string> = {
  admin_principal:
    "Acceso total: operación, contenido del sitio, tarifas, configuración y cuentas del equipo.",
  secretaria:
    "Acceso a la operación: contactos, apoyo social, reseñas y reservas. El contenido, las tarifas y las cuentas quedan en manos del administrador principal.",
};

export type Permiso =
  | "dashboard"
  | "galeria"
  | "textos"
  | "destacados"
  | "contactos"
  | "apoyo-social"
  | "resenas"
  | "reservas"
  | "perfil"
  | "equipo";

const PERMISOS_POR_ROL: Record<RolAdministrador, readonly Permiso[]> = {
  admin_principal: [
    "dashboard",
    "galeria",
    "textos",
    "destacados",
    "contactos",
    "apoyo-social",
    "resenas",
    "reservas",
    "perfil",
    "equipo",
  ],
  secretaria: [
    "dashboard",
    "contactos",
    "apoyo-social",
    "resenas",
    "reservas",
    "perfil",
  ],
};

export interface SeccionPanel {
  href: string;
  texto: string;
  permiso: Permiso;
}

/** Secciones del menú superior, en el orden en que se muestran. */
export const SECCIONES_PANEL: readonly SeccionPanel[] = [
  { href: "/admin/dashboard", texto: "Dashboard", permiso: "dashboard" },
  { href: "/admin/galeria", texto: "Galería", permiso: "galeria" },
  { href: "/admin/textos", texto: "Textos y configuración", permiso: "textos" },
  { href: "/admin/destacados", texto: "Destacados", permiso: "destacados" },
  { href: "/admin/contactos", texto: "Contactos", permiso: "contactos" },
  { href: "/admin/apoyo-social", texto: "Apoyo social", permiso: "apoyo-social" },
  { href: "/admin/resenas", texto: "Reseñas", permiso: "resenas" },
  { href: "/admin/reservas", texto: "Reservas del estudio", permiso: "reservas" },
  { href: "/admin/perfil", texto: "Perfil", permiso: "perfil" },
];

export function puede(
  rol: RolAdministrador | null | undefined,
  permiso: Permiso,
): boolean {
  if (!rol) return false;
  return PERMISOS_POR_ROL[rol].includes(permiso);
}

/** Secciones que el rol puede ver, para pintar el menú y los accesos rápidos. */
export function seccionesVisibles(rol: RolAdministrador): SeccionPanel[] {
  return SECCIONES_PANEL.filter((seccion) => puede(rol, seccion.permiso));
}
