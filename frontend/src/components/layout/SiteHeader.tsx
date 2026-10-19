"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { AboutModal } from "./AboutModal";

const SECCIONES = [
  { href: "/", texto: "Inicio" },
  { href: "/portafolio", texto: "Portafolio" },
  { href: "/backstage", texto: "Backstage" },
  { href: "/resenas", texto: "Reseñas" },
  { href: "/renta", texto: "Renta de Estudio" },
  { href: "/apoyo", texto: "Apoyo Social" },
] as const;

const WHATSAPP =
  "https://wa.me/50212345678?text=Hola%20QBusiness%20Media,%20quisiera%20cotizar%20un%20servicio%20audiovisual";

export function SiteHeader() {
  const ruta = usePathname();
  const [menu, setMenu] = useState(false);
  const [sobre, setSobre] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-qbIndigoHover bg-qbIndigo/95 shadow-md backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center space-x-3">
            <Image
              src="/logo-header.png"
              alt="QBusiness Media"
              width={600}
              height={186}
              priority
              className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-16"
            />
          </Link>

          <nav className="hidden items-center space-x-1 lg:flex xl:space-x-2" aria-label="Principal">
            {SECCIONES.map(({ href, texto }) => (
              <Link
                key={href}
                href={href}
                aria-current={ruta === href ? "page" : undefined}
                className={`nav-btn rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                  ruta === href
                    ? "bg-qbTerracotta text-white"
                    : "text-[#ECE7DE]/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {texto}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={() => setSobre(true)}
              className="hidden items-center rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20 md:inline-flex"
            >
              <Icon name="info-circle" className="mr-1.5" /> Sobre Qbusiness MEDIA
            </button>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl bg-qbSage px-4 py-2.5 text-xs font-bold text-white transition duration-200 hover:bg-qbSageHover sm:text-sm"
            >
              <Icon name="whatsapp" className="mr-1.5 text-base" /> Cotizar WhatsApp
            </a>
            <Link
              href="/login"
              aria-label="Acceso administrativo"
              className="nav-btn inline-flex rounded-xl p-2.5 text-sm"
            >
              <Icon name="lock" />
            </Link>
            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
              className="rounded-xl p-2 text-white transition hover:bg-white/10 lg:hidden"
            >
              <Icon name="bars" className="text-xl" />
            </button>
          </div>
        </div>

        {menu && (
          <div className="space-y-2 border-b border-qbIndigoHover bg-qbIndigo px-4 pt-3 pb-5 lg:hidden">
            {SECCIONES.map(({ href, texto }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenu(false)}
                className={`block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium ${
                  ruta === href ? "bg-qbTerracotta text-white" : "text-[#ECE7DE] hover:bg-white/10"
                }`}
              >
                {texto}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setSobre(true);
                setMenu(false);
              }}
              className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-white hover:bg-white/10"
            >
              Sobre Qbusiness MEDIA
            </button>
          </div>
        )}
      </header>
      <AboutModal open={sobre} onClose={() => setSobre(false)} />
    </>
  );
}
