"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/Icon";

type Props = { open: boolean; onClose: () => void };

export function AboutModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div onClick={(e) => e.stopPropagation()} className="contents">
        <div className="bg-qbChalk border border-qbBorder w-full max-w-2xl rounded-3xl p-8 space-y-6 shadow-2xl relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-6 right-6 text-qbMuted hover:text-qbInk"
          >
            <Icon name="xmark" className="text-xl" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="bg-qbIndigo p-3 rounded-2xl inline-block shadow-sm">
              <Image
                src="/logo-header.png"
                alt="QBusiness Media"
                width={600}
                height={186}
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </div>
          </div>
          <div className="space-y-4 text-sm text-qbMuted leading-relaxed">
            <h3 className="text-2xl font-black text-qbInk">Sobre QBusiness Media</h3>
            <p>
              Fundada en Quetzaltenango bajo la visión directiva de{" "}
              <strong className="text-qbInk">Luis Gonzales</strong>, QBusiness Media se ha consolidado como
              una de las agencias de producción audiovisual y estrategia digital con mayor crecimiento y rigor
              técnico en el occidente de Guatemala.
            </p>
            <p>
              Nuestro lema{" "}
              <span className="text-qbTerracotta font-semibold">
                &quot;Tu historia, nuestra estrategia&quot;
              </span>{" "}
              resume el compromiso de convertir las metas de comunicación de marcas corporativas, pymes e
              instituciones en piezas audiovisuales memorables con calidad cinematográfica.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-qbBorder text-center">
              <div className="bg-qbLinen p-3 rounded-xl border border-qbBorder">
                <div className="text-xl font-bold text-qbTerracotta">+8 Años</div>
                <div className="text-[11px] text-qbMuted">Trayectoria</div>
              </div>
              <div className="bg-qbLinen p-3 rounded-xl border border-qbBorder">
                <div className="text-xl font-bold text-qbSage">Top 1</div>
                <div className="text-[11px] text-qbMuted">Estudio en Xela</div>
              </div>
              <div className="bg-qbLinen p-3 rounded-xl border border-qbBorder">
                <div className="text-xl font-bold text-qbIndigo">4K / Cinema</div>
                <div className="text-[11px] text-qbMuted">Equipo Pro</div>
              </div>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-qbTerracotta hover:bg-qbTerracottaHover text-white text-xs font-bold px-6 py-3 rounded-xl transition"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
