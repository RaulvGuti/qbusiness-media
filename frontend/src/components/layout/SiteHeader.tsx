"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { crearEnlaceWhatsApp } from "@/lib/config-sitio";
import type { ConfiguracionSitio } from "@/types/config";
import { AboutModal } from "./AboutModal";
import { ScrollableNav, navLinkClass } from "./ScrollableNav";

const SECCIONES = [
  { href: "/", texto: "Inicio" },
  { href: "/portafolio", texto: "Portafolio" },
  { href: "/backstage", texto: "Backstage" },
  { href: "/resenas", texto: "Reseñas" },
  { href: "/renta", texto: "Renta de Estudio" },
  { href: "/apoyo", texto: "Apoyo Social" },
] as const;

interface SiteHeaderProps {
  config: ConfiguracionSitio;
}

export function SiteHeader({ config }: SiteHeaderProps) {
  const ruta = usePathname();
  const [sobre, setSobre] = useState(false);
  const whatsapp = crearEnlaceWhatsApp(
    config.contactoWhatsappNumero,
    config.mensajeWhatsapp,
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-qbIndigoHover bg-qbIndigo/95 shadow-md backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:h-20 lg:flex-nowrap lg:gap-4 lg:px-8 lg:py-0">
          <Link href="/" className="group flex shrink-0 items-center space-x-3">
            <Image
              src="/logo-header.png"
              alt="QBusiness Media"
              width={600}
              height={186}
              priority
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-14 lg:h-16"
            />
          </Link>

          <ScrollableNav
            ariaLabel="Principal"
            arrowClassName="site-nav-arrow"
            className="order-3 w-full lg:order-none lg:w-auto lg:flex-1"
          >
            {SECCIONES.map(({ href, texto }) => {
              const activo = ruta === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={activo ? "page" : undefined}
                  className={navLinkClass(activo)}
                >
                  {texto}
                </Link>
              );
            })}
          </ScrollableNav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSobre(true)}
              className="inline-flex items-center rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 sm:px-3.5"
            >
              <Icon name="info-circle" className="mr-1.5" />
              <span className="hidden sm:inline">{config.headerSobre}</span>
            </button>
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl bg-qbSage px-3 py-2.5 text-xs font-bold text-white transition duration-200 hover:bg-qbSageHover sm:px-4 sm:text-sm"
            >
              <Icon name="whatsapp" className="text-base sm:mr-1.5" />{" "}
              <span className="hidden sm:inline">
                {config.headerCtaWhatsapp}
              </span>
            </a>
            <Link
              href="/login"
              aria-label="Acceso de clientes"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-white transition-colors hover:text-white/70"
            >
              <Icon name="lock" />
            </Link>
          </div>
        </div>
      </header>
      <AboutModal
        open={sobre}
        onClose={() => setSobre(false)}
        config={config}
      />
    </>
  );
}
