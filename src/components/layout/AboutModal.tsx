"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { interpolarTexto } from "@/lib/config-sitio";
import type { ConfiguracionSitio } from "@/types/config";

type Props = {
  open: boolean;
  onClose: () => void;
  config: ConfiguracionSitio;
};

function TextoConEnfasis({
  texto,
  config,
}: {
  texto: string;
  config: ConfiguracionSitio;
}) {
  const partes = texto.split(/(\{director\}|\{slogan\})/g);

  return (
    <>
      {partes.map((parte, indice) => {
        if (parte === "{director}") {
          return (
            <strong key={indice} className="text-qbInk">
              {config.directorNombre}
            </strong>
          );
        }
        if (parte === "{slogan}") {
          return (
            <span key={indice} className="text-qbTerracotta font-semibold">
              {config.slogan}
            </span>
          );
        }
        return <span key={indice}>{parte}</span>;
      })}
    </>
  );
}

export function AboutModal({ open, onClose, config }: Props) {
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
            <h3 className="text-2xl font-black text-qbInk">
              {interpolarTexto(config.sobreNosotrosTitulo, config)}
            </h3>
            <p>
              <TextoConEnfasis
                texto={config.sobreNosotrosParrafo1}
                config={config}
              />
            </p>
            <p>
              <TextoConEnfasis
                texto={config.sobreNosotrosParrafo2}
                config={config}
              />
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-qbBorder text-center">
              <div className="bg-qbLinen p-3 rounded-xl border border-qbBorder">
                <div className="text-xl font-bold text-qbTerracotta">
                  {config.stat1Numero}
                </div>
                <div className="text-[11px] text-qbMuted">
                  {config.stat1Label}
                </div>
              </div>
              <div className="bg-qbLinen p-3 rounded-xl border border-qbBorder">
                <div className="text-xl font-bold text-qbSage">
                  {config.stat2Numero}
                </div>
                <div className="text-[11px] text-qbMuted">
                  {config.stat2Label}
                </div>
              </div>
              <div className="bg-qbLinen p-3 rounded-xl border border-qbBorder">
                <div className="text-xl font-bold text-qbIndigo">
                  {config.stat3Numero}
                </div>
                <div className="text-[11px] text-qbMuted">
                  {config.stat3Label}
                </div>
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
