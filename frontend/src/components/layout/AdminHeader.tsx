"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cerrarSesionAction } from "@/server/actions/auth";
import { ETIQUETAS_ROL, seccionesVisibles } from "@/lib/permisos";
import type { RolAdministrador } from "@/types/admin";
import { ScrollableNav, navLinkClass } from "./ScrollableNav";

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
    <header className="sticky top-0 z-40 border-b border-[#262626] bg-[#181818]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 min-[1001px]:h-20 min-[1001px]:flex-nowrap min-[1001px]:py-0">
        <Image
          src="/logo-header.png"
          alt="QBusiness Media"
          width={168}
          height={52}
          priority
          className="h-[52px] w-auto shrink-0 object-contain"
        />

        <ScrollableNav
          ariaLabel="Panel administrativo"
          className="order-3 w-full min-[1001px]:order-none min-[1001px]:w-auto min-[1001px]:flex-1"
        >
          {secciones.map(({ href, texto }) => {
            const activo = ruta === href || ruta.startsWith(`${href}/`);
            return (
              <Link
                key={texto}
                href={href}
                className={navLinkClass(activo)}
                aria-current={activo ? "page" : undefined}
              >
                {texto}
              </Link>
            );
          })}
        </ScrollableNav>

        <div className="flex max-w-[190px] shrink-0 flex-col items-end gap-[3px] leading-tight">
          <span className="max-w-full overflow-hidden text-[12.5px] font-semibold text-ellipsis whitespace-nowrap text-white">
            {perfil.nombre}
          </span>
          <span className="whitespace-nowrap rounded-full border border-[#3a3a3a] px-2 py-[2px] text-[10px] font-bold tracking-[0.08em] text-[#bdbdbd] uppercase">
            {ETIQUETAS_ROL[perfil.rol]}
          </span>
        </div>

        <form action={cerrarSesionAction} className="m-0 shrink-0">
          <button
            type="submit"
            className="cursor-pointer rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}
