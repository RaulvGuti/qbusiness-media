'use client';

import { Icon } from '@/components/ui/Icon';

export default function MapEmbed() {
  const direccion = 'Quetzaltenango, Guatemala';
  const embedUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.456!2d-91.526!3d14.834!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDUwJzAyLjQiTiA5McKwMzEnMzMuNiJX!5e0!3m2!1ses!2sgt!4v0';

  return (
    <div className="bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-qbBorder space-y-1">
        <h3 className="text-sm font-bold text-qbInk uppercase tracking-wider">Ubicación</h3>
        <p className="text-sm text-qbMuted">{direccion}</p>
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
          title={`Mapa - ${direccion}`}
        />
      </div>
      <div className="p-4 border-t border-qbBorder flex justify-end">
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(direccion)}`}
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