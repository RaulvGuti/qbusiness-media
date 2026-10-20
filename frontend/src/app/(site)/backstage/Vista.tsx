import { Icon } from "@/components/ui/Icon";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import type { CarpetaGaleria } from "@/types/portafolio";

interface VistaProps {
  carpetas: CarpetaGaleria[];
}

const ETIQUETA_CATEGORIA: Record<string, string> = {
  'detras-camaras': 'Detrás de Cámaras',
  'detras-edicion': 'Detrás de Edición',
};

export function Vista({ carpetas }: VistaProps) {
  return (
    <section className="page-stack">
      <div className="border-b border-qbBorder pb-6">
        <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">
          Proceso Creativo
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">
          Backstage
        </h2>
        <p className="text-sm text-qbMuted mt-1">
          Detrás de cámaras de nuestros rodajes, pruebas de iluminación y
          suites de postproducción.
        </p>
      </div>

      {carpetas.length === 0 ? (
        <div className="text-center py-12 text-qbMuted">
          Aún no hay contenido de backstage publicado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {carpetas.map((carpeta) => (
            <div
              key={carpeta.id}
              className="bs-item bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden group hover:border-qbTerracotta transition duration-300 shadow-sm"
            >
              <div className="aspect-video relative overflow-hidden bg-black/40">
                <MediaPlaceholder
                  label={carpeta.nombre}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-qbIndigo/80 via-transparent to-transparent opacity-80" />
                <span className="absolute top-3 left-3 bg-qbTerracotta text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase">
                  {ETIQUETA_CATEGORIA[carpeta.categoria ?? ''] ?? 'Backstage'}
                </span>
              </div>

              <div className="p-6 space-y-2">
                <h3 className="text-lg font-bold text-qbInk">{carpeta.nombre}</h3>
                {carpeta.descripcion && (
                  <p className="text-xs text-qbMuted leading-relaxed">
                    {carpeta.descripcion}
                  </p>
                )}
                <div className="pt-3 flex items-center justify-between text-xs text-qbMuted border-t border-qbBorder">
                  <span>
                    <Icon name="camera" className="mr-1 text-qbTerracotta" />
                    {carpeta.equipoUsado ?? 'Producción QBusiness'}
                  </span>
                  <span className="text-qbSage font-semibold">
                    {carpeta.lugar ?? 'Quetzaltenango'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
