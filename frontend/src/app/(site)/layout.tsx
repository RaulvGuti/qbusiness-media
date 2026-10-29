import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ToastProvider } from "@/components/ui/Toast";
import { obtenerConfiguracionSitio } from "@/server/repositories/configuracion";
import { obtenerPerfilClienteActual } from "@/server/repositories/estudio";
import "../styles/sitio.css";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, cliente] = await Promise.all([
    obtenerConfiguracionSitio(),
    obtenerPerfilClienteActual(),
  ]);

  return (
    <ToastProvider>
      <div className="sitio flex min-h-screen flex-col justify-between bg-qbLinen font-sans text-qbInk antialiased selection:bg-white selection:text-black">
        <SiteHeader config={config} sesionActiva={Boolean(cliente)} />
        <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>
        <SiteFooter config={config} />
      </div>
    </ToastProvider>
  );
}
