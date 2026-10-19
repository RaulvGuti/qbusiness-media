import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder';
import type { BackstageItem } from '@/types/portafolio';

interface BackstageSectionProps {
  items: BackstageItem[];
  titulo?: string;
  descripcion?: string;
}

export default function BackstageSection({
  items,
  titulo = 'Backstage — General',
  descripcion = 'Un vistazo detrás de cámaras y detrás de edición, en una sola vista unificada.',
}: BackstageSectionProps) {
  return (
    <section className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-qbBorder pb-6">
        <div>
          <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">Proceso Creativo</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">{titulo}</h2>
          <p className="text-sm text-qbMuted">{descripcion}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-qbMuted">
          No hay contenido de backstage disponible por el momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <article
              key={item.id}
              className="bs-item bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden group hover:border-qbTerracotta transition duration-300 shadow-sm"
            >
              <div className="aspect-video relative overflow-hidden bg-black/40">
                {item.imagenUrl && item.imagenUrl !== '/placeholder.jpg' ? (
                  <Image
                    src={item.imagenUrl}
                    alt={item.titulo}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                ) : (
                  <MediaPlaceholder label="Backstage" className="w-full h-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-qbIndigo/80 via-transparent to-transparent opacity-80"></div>
                <span className="absolute top-3 left-3 bg-qbIndigo text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase">
                  Backstage
                </span>
                {item.videoUrl && (
                  <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                    <Icon name="play" />
                  </div>
                )}
              </div>
              <div className="p-6 space-y-2">
                <h3 className="text-lg font-bold text-qbInk line-clamp-2">{item.titulo}</h3>
                {item.descripcion && (
                  <p className="text-xs text-qbMuted leading-relaxed line-clamp-2">
                    {item.descripcion}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}