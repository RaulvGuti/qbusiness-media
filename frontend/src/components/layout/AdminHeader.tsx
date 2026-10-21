
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminHeader.module.css";

const SECCIONES = [
  { href: "/admin/dashboard", texto: "Dashboard" },
  { href: "/admin/textos", texto: "Textos y configuración" },
  { href: "/admin/destacados", texto: "Destacados" },
  { href: "/admin/resenas", texto: "Reseñas" },
  { href: null, texto: "Galería" },
  { href: "/admin/contactos", texto: "Contactos" },
  { href: null, texto: "Reservas del estudio" },
  { href: null, texto: "Perfil y usuarios" },
] as const;

export function AdminHeader() {
  const ruta = usePathname();

  return (
    <header className={styles.top}>
      <div className={styles.inner}>
        <Image
          src="/logo-header.png"
          alt="QBusiness Media"
          width={168}
          height={52}
          priority
          className={styles.logo}
        />

        <nav className={styles.nav} aria-label="Panel administrativo">
          {SECCIONES.map(({ href, texto }) =>
            href ? (
              <Link
                key={texto}
                href={href}
                className={`${styles.link} ${
                  ruta === href || ruta.startsWith(`${href}/`)
                    ? styles.linkOn
                    : ""
                }`}
                aria-current={
                  ruta === href || ruta.startsWith(`${href}/`)
                    ? "page"
                    : undefined
                }
              >
                {texto}
              </Link>
            ) : (
              <span
                key={texto}
                className={`${styles.link} ${styles.linkOff}`}
                aria-disabled="true"
              >
                {texto}
              </span>
            ),
          )}
        </nav>

        <Link href="/login" className={styles.logout}>
          Cerrar sesión
        </Link>
      </div>
    </header>
  );
}
