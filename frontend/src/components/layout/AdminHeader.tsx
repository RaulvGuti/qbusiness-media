"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cerrarSesionAction } from "@/server/actions/auth";
import { ETIQUETAS_ROL, seccionesVisibles } from "@/lib/permisos";
import type { RolAdministrador } from "@/types/admin";
import styles from "./AdminHeader.module.css";

interface Props {
  perfil: {
    nombre: string;
    rol: RolAdministrador;
  };
}

export function AdminHeader({ perfil }: Props) {
  const ruta = usePathname();
  const secciones = seccionesVisibles(perfil.rol);

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
          {secciones.map(({ href, texto }) => (
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
          ))}
        </nav>

        <div className={styles.user}>
          <span className={styles.userName}>{perfil.nombre}</span>
          <span className={styles.badge}>{ETIQUETAS_ROL[perfil.rol]}</span>
        </div>

        <form action={cerrarSesionAction} className={styles.logoutForm}>
          <button type="submit" className={styles.logout}>
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}
