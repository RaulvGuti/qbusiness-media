import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder';

interface PortadaCarpetaProps {
  url: string | null;
  tipo: 'imagen' | 'video' | null;
  titulo: string;
  className?: string;
}

/** Portada de una tarjeta: foto, primer cuadro del video o el marcador si no hay archivo. */
export function PortadaCarpeta({ url, tipo, titulo, className = '' }: PortadaCarpetaProps) {
  if (!url) {
    return <MediaPlaceholder label={titulo} className={`w-full h-full object-contain ${className}`} />;
  }
  if (tipo === 'video') {
    return (
      <video
        src={`${url}#t=0.1`}
        muted
        playsInline
        preload="metadata"
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={titulo} loading="lazy" className={`w-full h-full object-cover ${className}`} />
  );
}
