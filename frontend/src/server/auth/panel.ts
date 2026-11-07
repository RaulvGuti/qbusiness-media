import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/require-admin";

/**
 * Guards de render para el panel (000038).
 *
 * Se ejecutan dentro del layout y de cada página protegida. Validan la sesión
 * y el rol contra la base de datos antes de renderizar, así que no dependen de
 * lo que diga el cliente ni de una cookie.
 */

/** Cualquier miembro del equipo. Si no hay sesión, vuelve al login del panel. */
export async function exigirStaffPanel() {
  const acceso = await requireAdmin();

  if (!acceso.authorized) {
    redirect("/admin");
  }

  return acceso;
}

/** Solo el administrador principal; el resto vuelve al dashboard con aviso. */
export async function exigirAdminPrincipalPanel() {
  const acceso = await requireAdmin();

  if (!acceso.authorized) {
    redirect("/admin");
  }

  if (acceso.perfil.rol !== "admin_principal") {
    redirect("/admin/dashboard?permiso=denegado");
  }

  return acceso;
}
