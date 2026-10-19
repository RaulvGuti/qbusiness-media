import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ToastProvider } from "@/components/ui/Toast";
import "../(sitio)/sitio.css";

export default function EstudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="sitio flex min-h-screen flex-col justify-between bg-qbLinen font-sans text-qbInk antialiased selection:bg-white selection:text-black">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>
        <SiteFooter />
      </div>
    </ToastProvider>
  );
}