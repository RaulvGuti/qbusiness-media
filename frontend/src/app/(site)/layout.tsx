import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ToastProvider } from "@/components/ui/Toast";
import { obtenerConfiguracionSitio } from "@/server/repositories/configuracion";
import "../styles/sitio.css";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await obtenerConfiguracionSitio();

  return (
    <ToastProvider>
      <div className="sitio flex min-h-screen flex-col justify-between bg-qbLinen font-sans text-qbInk antialiased selection:bg-white selection:text-black">
        <SiteHeader config={config} />
        <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>
        <SiteFooter config={config} />
      </div>
    </ToastProvider>
  );
}
