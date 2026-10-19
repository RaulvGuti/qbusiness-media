import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder';
import type { ProyectoPortafolio } from '@/types/portafolio';

interface ProjectCardProps {
  proyecto: ProyectoPortafolio;
}

export default function ProjectCard({ proyecto }: ProjectCardProps) {
  const getTipoLabel = () => {
    if (proyecto.etiquetas.some((e) => e.toLowerCase().includes('horizontal'))) return 'Contenido horizontal';
    if (proyecto.orientacion === 'horizontal') return 'Contenido horizontal';
    if (proyecto.tipo === 'video') return 'Video';
    if (proyecto.tipo === 'reel') return 'Reel';
    if (proyecto.tipo === 'backstage') return 'Backstage';
    return 'Foto';
  };

  return (
    <article className="port-card bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden group hover:border-qbTerracotta transition-all duration-300 shadow-sm cursor-pointer">
      <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
        {proyecto.imagenUrl && proyecto.imagenUrl !== '/placeholder.jpg' ? (
          <Image
            src={proyecto.imagenUrl}
            alt={proyecto.titulo}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <MediaPlaceholder label={proyecto.cliente || proyecto.titulo} className="w-full h-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-qbIndigo/90 via-qbIndigo/30 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <span className="bg-qbIndigo text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase">
            {getTipoLabel()}
          </span>
          <h3 className="text-2xl font-black text-white mt-2">{proyecto.titulo}</h3>
          <p className="text-xs text-white/80">{proyecto.cliente}</p>
        </div>
        {proyecto.videoUrl && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <Icon name="play" />
          </div>
        )}
      </div>
    </article>
  );
}