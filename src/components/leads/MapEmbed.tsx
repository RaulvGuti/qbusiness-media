'use client';

import { Icon } from '@/components/ui/Icon';

interface MapEmbedProps {
  direccion: string;
  linkMapa: string;
}

export default function MapEmbed({ direccion, linkMapa }: MapEmbedProps) {
  const lugar = direccion.trim() || 'Quetzaltenango, Guatemala';
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(lugar)}&output=embed`;
  const urlMapa =
    linkMapa.trim() ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`;

  return (
    <div className="bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-qbBorder space-y-1">
        <h3 className="text-sm font-bold text-qbInk uppercase tracking-wider">Ubicación</h3>
        <p className="text-sm text-qbMuted">{lugar}</p>
      </div>
      <div className="aspect-[16/9] w-full bg-black/40">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Mapa - ${lugar}`}
        />
      </div>
      <div className="p-4 border-t border-qbBorder flex justify-end">
        <a
          href={urlMapa}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition flex items-center"
        >
          <Icon name="location-dot" className="mr-2" />
          Ver en Google Maps
        </a>
      </div>
    </div>
  );
}
