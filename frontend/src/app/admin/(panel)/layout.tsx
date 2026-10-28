import { AdminHeader } from "@/components/layout/AdminHeader";
import { ToastProvider } from "@/components/ui/Toast";
import { exigirStaffPanel } from "@/server/auth/panel";
import styles from "./panel.module.css";

/**
 * Ninguna pantalla del panel se renderiza sin sesión y sin fila en
 * `administradores` (000038). El proxy solo adelanta la redirección cuando no
 * hay sesión; la validación real del rol ocurre aquí y en cada página.
 */
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { perfil } = await exigirStaffPanel();

  return (
    <ToastProvider>
      <AdminHeader
        perfil={{ nombre: perfil.nombreCompleto, rol: perfil.rol }}
      />
      <main className={styles.page}>{children}</main>
    </ToastProvider>
  );
}
