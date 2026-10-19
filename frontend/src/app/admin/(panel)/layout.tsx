import { AdminHeader } from "@/components/layout/AdminHeader";
import { ToastProvider } from "@/components/ui/Toast";
import styles from "./panel.module.css";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AdminHeader />
      <main className={styles.page}>{children}</main>
    </ToastProvider>
  );
}
