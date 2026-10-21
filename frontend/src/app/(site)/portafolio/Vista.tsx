import { Icon } from "@/components/ui/Icon";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import type { Destacado } from "@/types/portafolio";

interface VistaProps {
  destacados: Destacado[];
}

function tarjetaDestacado(d: Destacado) {
  if (d.carpeta) {
    return {
      key: d.carpeta.id,
      titulo: d.carpeta.etiqueta ?? d.carpeta.nombre,
      descripcion: d.carpeta.descripcion ?? '',
      badge: d.carpeta.nombreEmpresa ?? d.carpeta.modulo,
      etiqueta: 'Proyecto',
    };
  }
  if (d.empresa) {
    return {
      key: d.empresa.id,
      titulo: d.empresa.nombre,
      descripcion: d.empresa.descripcion ?? '',
      badge: 'Cliente',
      etiqueta: 'Empresa',
    };
  }
  return null;
}

export function Vista({ destacados }: VistaProps) {
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

        {destacados.length === 0 ? (
          <div className="text-center py-12 text-qbMuted">
            Aún no hay proyectos publicados en el portafolio.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {destacados.map((d) => {
              const datos = tarjetaDestacado(d);
              if (!datos) return null;
              return (
                <div
                  key={datos.key}
                  className="port-card bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden group hover:border-qbTerracotta transition-all duration-300 shadow-sm"
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
                    <MediaPlaceholder
                      label={datos.titulo}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-qbIndigo/90 via-qbIndigo/30 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="bg-qbIndigo text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase">
                        {datos.badge}
                      </span>
                      <h3 className="text-2xl font-black text-white mt-2">
                        {datos.titulo}
                      </h3>
                      <p className="text-xs text-[#ECE7DE] mt-1 line-clamp-2">
                        {datos.descripcion}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 flex justify-between items-center bg-qbChalk border-t border-qbBorder">
                    <span className="text-xs font-semibold text-qbSage">
                      {datos.etiqueta}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-qbTerracotta/15 text-qbTerracotta flex items-center justify-center text-xs group-hover:bg-qbTerracotta group-hover:text-white transition">
                      <Icon name="arrow-right" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
