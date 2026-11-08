import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { PortadaCarpeta } from "@/components/galeria/PortadaCarpeta";
import type { CarpetaConPortada } from "@/types/galeria-publica";

interface VistaProps {
  carpetas: CarpetaConPortada[];
}

export function Vista({ carpetas }: VistaProps) {
  return (
    <section className="page-stack">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-qbBorder pb-6">
          <div>
            <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">
              Galería Multimedia
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">
              Portafolio
            </h2>
            <p className="text-sm text-qbMuted">
              Explora nuestras campañas para marcas icónicas y proyectos corporativos.
            </p>
          </div>
        </div>

        {carpetas.length === 0 ? (
          <div className="text-center py-12 text-qbMuted">
            Aún no hay proyectos publicados en el portafolio.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {carpetas.map((c) => (
              <Link
                key={c.id}
                href={`/portafolio/${c.id}`}
                className="port-card block bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden group hover:border-qbTerracotta transition-all duration-300 shadow-sm"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
                  <PortadaCarpeta
                    url={c.portadaUrl}
                    tipo={c.portadaTipo}
                    titulo={c.nombre}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-qbIndigo/90 via-qbIndigo/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="bg-qbIndigo text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase">
                      {c.nombreEmpresa ?? "Proyecto"}
                    </span>
                    <h3 className="text-2xl font-black text-white mt-2">
                      {c.etiqueta ?? c.nombre}
                    </h3>
                    {c.descripcion && (
                      <p className="text-xs text-[#ECE7DE] mt-1 line-clamp-2">{c.descripcion}</p>
                    )}
                  </div>
                </div>
                <div className="p-5 flex justify-between items-center bg-qbChalk border-t border-qbBorder">
                  <span className="text-xs font-semibold text-qbSage">
                    {c.totalArchivos} archivo{c.totalArchivos === 1 ? "" : "s"}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-qbTerracotta/15 text-qbTerracotta flex items-center justify-center text-xs group-hover:bg-qbTerracotta group-hover:text-white transition">
                    <Icon name="arrow-right" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
