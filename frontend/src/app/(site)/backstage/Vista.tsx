import { Icon } from "@/components/ui/Icon";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

export function Vista() {
  return (
    <section className="page-stack">
      {/* Header */}
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

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {/* Tarjeta 1 */}
        <div
          className="bs-item bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden group hover:border-qbTerracotta transition duration-300 shadow-sm"
          data-type="camaras"
        >
          <div className="aspect-video relative overflow-hidden bg-black/40">
            <MediaPlaceholder
              label="Detrás de Cámaras"
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-qbIndigo/80 via-transparent to-transparent opacity-80" />
            <span className="absolute top-3 left-3 text-[#ECE7DE]/85 hover:text-white hover:bg-white/10 text-[11px] font-bold px-2.5 py-1 rounded-md uppercase">
              Detrás de Cámaras
            </span>
          </div>

          <div className="p-6 space-y-2">
            <h3 className="text-lg font-bold text-qbInk">
              Montaje y Fotografía para Campaña con Modelos
            </h3>
            <p className="text-xs text-qbMuted leading-relaxed">
              Configuración de esquema de iluminación de 3 puntos con luces
              Aputure y modificadores softbox para spots corporativos.
            </p>
            <div className="pt-3 flex items-center justify-between text-xs text-qbMuted border-t border-qbBorder">
              <span>
                <Icon name="camera" className="mr-1 text-qbTerracotta" />
                Sony Cinema FX3
              </span>
              <span className="text-qbSage font-semibold">
                Rodaje Quetzaltenango
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta 2 */}
        <div
          className="bs-item bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden group hover:border-qbTerracotta transition duration-300 shadow-sm"
          data-type="edicion"
        >
          <div className="aspect-video relative overflow-hidden bg-black/40">
            <MediaPlaceholder
              label="Detrás de Edición"
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-qbIndigo/80 via-transparent to-transparent opacity-80" />
            <span className="absolute top-3 left-3 bg-qbSage text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase">
              Detrás de Edición
            </span>
          </div>

          <div className="p-6 space-y-2">
            <h3 className="text-lg font-bold text-qbInk">
              Edición de Video Para Spot Publicitario
            </h3>
            <p className="text-xs text-qbMuted leading-relaxed">
              Ajuste de curvas tonales, corrección de pieles y perfiles
              cinematográficos LUT en suite calibrada a estándares broadcast.
            </p>
            <div className="pt-3 flex items-center justify-between text-xs text-qbMuted border-t border-qbBorder">
              <span>
                <Icon name="sliders" className="mr-1 text-qbSage" />
                DaVinci Resolve Studio
              </span>
              <span className="text-qbIndigo font-semibold">
                Postproducción
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta 3 */}
        <div
          className="bs-item bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden group hover:border-qbTerracotta transition duration-300 shadow-sm"
          data-type="camaras"
        >
          <div className="aspect-video relative overflow-hidden bg-black/40">
            <MediaPlaceholder
              label="Grabación de Audio"
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-qbIndigo/80 via-transparent to-transparent opacity-80" />
            <span className="absolute top-3 left-3 bg-qbIndigo text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase">
              Audio &amp; Foley
            </span>
          </div>

          <div className="p-6 space-y-2">
            <h3 className="text-lg font-bold text-qbInk">
              Edición de Audio para Campañas de Marketing
            </h3>
            <p className="text-xs text-qbMuted leading-relaxed">
              Consola RodeCaster Pro II con micrófonos dinámicos Shure SM7B y
              aislamiento acústico total para una claridad vocal sin eco.
            </p>
            <div className="pt-3 flex items-center justify-between text-xs text-qbMuted border-t border-qbBorder">
              <span>
                <Icon name="microphone" className="mr-1 text-qbIndigo" />
                Shure SM7B
              </span>
              <span className="text-qbSage font-semibold">
                Acústica Calibrada
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}