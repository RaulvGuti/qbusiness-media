import { Icon } from "@/components/ui/Icon";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

export function Vista() {
  return (
    <section className="page-stack">
      {/* Sección Vista Principal de Portafolio */}
      <div id="portfolio-overview" className="space-y-8">
        {/* Header y Filtros */}
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

          <div className="flex flex-wrap gap-2">
            <button className="port-filter-btn px-4 py-2 text-[#ECE7DE]/85 hover:text-white hover:bg-white/10 font-semibold rounded-xl text-xs transition">
              Todos
            </button>
            <button className="port-filter-btn px-4 py-2 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs transition">
              Contenido Horizontal
            </button>
            <button className="port-filter-btn px-4 py-2 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs transition">
              Contenido Vertical
            </button>
            <button className="port-filter-btn px-4 py-2 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs transition">
              Fotografía
            </button>
          </div>
        </div>

        {/* Grid de Tarjetas de Clientes / Proyectos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tarjeta 1: McDía Feliz */}
          <div
            className="port-card bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden group hover:border-qbTerracotta transition-all duration-300 shadow-sm cursor-pointer"
            data-category="comercial"
          >
            <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
              <MediaPlaceholder
                label="McDía Feliz"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-qbIndigo/90 via-qbIndigo/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="bg-qbIndigo text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase">
                  3 Proyectos
                </span>
                <h3 className="text-2xl font-black text-white mt-2">
                  McDía Feliz
                </h3>
                <p className="text-xs text-[#ECE7DE] mt-1">
                  Campaña solidaria, spots de televisión y contenido digital.
                </p>
              </div>
            </div>

            <div className="p-5 flex justify-between items-center bg-qbChalk border-t border-qbBorder">
              <span className="text-xs font-semibold text-qbSage">
                Abrir galería completa
              </span>
              <span className="w-8 h-8 rounded-full bg-qbTerracotta/15 text-qbTerracotta flex items-center justify-center text-xs group-hover:bg-qbTerracotta group-hover:text-white transition">
                →
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Landívar Xela */}
          <div
            className="port-card bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden group hover:border-qbTerracotta transition-all duration-300 shadow-sm cursor-pointer"
            data-category="comercial"
          >
            <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
              <MediaPlaceholder
                label="Landívar Xela"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-qbIndigo/90 via-qbIndigo/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="bg-qbIndigo text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase">
                  3 Campañas
                </span>
                <h3 className="text-2xl font-black text-white mt-2">
                  Landívar Xela
                </h3>
                <p className="text-xs text-[#ECE7DE] mt-1">
                  Admisiones, recorridos universitarios y producción de campus.
                </p>
              </div>
            </div>

            <div className="p-5 flex justify-between items-center bg-qbChalk border-t border-qbBorder">
              <span className="text-xs font-semibold text-qbSage">
                Abrir galería completa
              </span>
              <span className="w-8 h-8 rounded-full bg-qbTerracotta/15 text-qbTerracotta flex items-center justify-center text-xs group-hover:bg-qbTerracotta group-hover:text-white transition">
                →
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Teatro Municipal */}
          <div
            className="port-card bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden group hover:border-qbTerracotta transition-all duration-300 shadow-sm cursor-pointer"
            data-category="vertical"
          >
            <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
              <MediaPlaceholder
                label="Teatro Municipal"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-qbIndigo/90 via-qbIndigo/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="bg-qbIndigo text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase">
                  Temporada de Gala
                </span>
                <h3 className="text-2xl font-black text-white mt-2">
                  Teatro Municipal
                </h3>
                <p className="text-xs text-[#ECE7DE] mt-1">
                  Conciertos en vivo, artes escénicas y piezas de patrimonio.
                </p>
              </div>
            </div>

            <div className="p-5 flex justify-between items-center bg-qbChalk border-t border-qbBorder">
              <span className="text-xs font-semibold text-qbSage">
                Abrir galería completa
              </span>
              <span className="w-8 h-8 rounded-full bg-qbTerracotta/15 text-qbTerracotta flex items-center justify-center text-xs group-hover:bg-qbTerracotta group-hover:text-white transition">
                →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Vista Detalle de Proyecto (Oculta por defecto) */}
      <div id="portfolio-detail" className="hidden space-y-8">
        <div className="flex items-center justify-between border-b border-qbBorder pb-4">
          <button className="inline-flex items-center text-sm font-bold text-qbInk hover:text-qbTerracotta bg-qbChalk hover:bg-qbChalkHover border border-qbBorder px-4 py-2 rounded-xl transition">
            <Icon name="arrow-left" className="mr-2 text-qbTerracotta" />
            Regresar a Portafolio
          </button>
          <span
            id="detail-client-badge"
            className="bg-qbTerracotta/15 text-qbTerracotta border border-qbTerracotta/25 px-3 py-1 rounded-full text-xs font-bold uppercase"
          >
            McDía Feliz
          </span>
        </div>

        <div className="bg-qbChalk border border-qbBorder p-8 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="max-w-3xl space-y-3">
            <h2
              id="detail-client-title"
              className="text-3xl sm:text-4xl font-extrabold text-qbInk"
            >
              McDía Feliz
            </h2>
            <p
              id="detail-client-desc"
              className="text-qbMuted text-sm sm:text-base leading-relaxed"
            >
              Cobertura audiovisual integral y producción de contenido dinámico
              para la tradicional jornada benéfica del McDía Feliz en
              Quetzaltenango. Creación de spots promocionales, entrevistas,
              registro de donaciones y cobertura en tiempo real para redes
              sociales.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-qbBorder">
            <button
              id="subproj-btn-1"
              className="subproj-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#ECE7DE]/85 hover:text-white hover:bg-white/10"
            >
              Proyecto 1: Campaña Solidaria
            </button>
            <button
              id="subproj-btn-2"
              className="subproj-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-qbLinen text-qbInk hover:bg-qbChalk border border-qbBorder"
            >
              Proyecto 2: Activación en Restaurantes
            </button>
            <button
              id="subproj-btn-3"
              className="subproj-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-qbLinen text-qbInk hover:bg-qbChalk border border-qbBorder"
            >
              Proyecto 3: Aftermovie y Cierre
            </button>
          </div>
        </div>

        <div id="subproject-content" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 id="subproj-heading" className="text-xl font-bold text-qbInk">
              Proyecto 1: Material Producido
            </h3>
            <span className="text-xs text-qbSage font-semibold">
              <Icon name="check-circle" className="mr-1" />
              Formatos 16:9 y 9:16 disponibles
            </span>
          </div>

          <div
            id="subproj-grid"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          />
        </div>
      </div>
    </section>
  );
}