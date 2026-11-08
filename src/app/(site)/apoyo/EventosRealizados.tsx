import Link from 'next/link';
import { PortadaCarpeta } from '@/components/galeria/PortadaCarpeta';
import type { CarpetaConPortada } from '@/types/galeria-publica';

interface EventoEstatico {
  id: string;
  etiqueta: string;
  titulo: string;
  descripcion: string;
}

/** Se muestran solo mientras no haya carpetas publicadas en Gestor de galería › Apoyo social. */

const eventosEstaticos: EventoEstatico[] = [
  {
    id: 'navidad',
    etiqueta: 'Donación Navideña',
    titulo: 'Campaña de Recolección Navideña',
    descripcion:
      'Producción de video spot solidario y recolección de juguetes para hogares infantiles en Quetzaltenango.',
  },
  {
    id: 'bomberos',
    etiqueta: 'Evento Bomberos',
    titulo: 'Cuerpo de Bomberos Voluntarios',
    descripcion:
      'Documentación y difusión audiovisual para la colecta de equipamiento y mantenimiento de unidades de auxilio.',
  },
  {
    id: 'taller',
    etiqueta: 'Taller Comunitario',
    titulo: 'Talleres de Medios para Jóvenes',
    descripcion:
      'Capacitaciones gratuitas en producción de video digital para jóvenes emprendedores locales.',
  },
];

interface EventosRealizadosProps {
  carpetas: CarpetaConPortada[];
}

export default function EventosRealizados({ carpetas }: EventosRealizadosProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h3 className="text-lg font-bold text-qbInk">Eventos Realizados</h3>
        <span className="text-[11px] text-qbMuted">Impacto Comunitario QBusiness</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {carpetas.length > 0
          ? carpetas.map((c) => (
              <Link
                key={c.id}
                href={`/apoyo/${c.id}`}
                className="group block bg-qbChalk border border-qbBorder rounded-2xl p-3 space-y-3 shadow-sm hover:border-qbTerracotta transition"
              >
                <div className="relative aspect-[16/10] rounded-xl bg-black/40 overflow-hidden">
                  <span className="absolute top-2 left-2 z-10 bg-black text-qbInk text-[10px] font-bold px-2 py-0.5 rounded">
                    {c.etiqueta ?? 'Apoyo social'}
                  </span>
                  <PortadaCarpeta
                    url={c.portadaUrl}
                    tipo={c.portadaTipo}
                    titulo={c.nombre}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="px-1 pb-1 space-y-1">
                  <h4 className="text-sm font-bold text-qbInk">{c.nombre}</h4>
                  {c.descripcion && (
                    <p className="text-xs text-qbMuted leading-relaxed line-clamp-3">{c.descripcion}</p>
                  )}
                  <p className="text-[11px] text-qbMuted">
                    {c.totalArchivos} archivo{c.totalArchivos === 1 ? '' : 's'} · Ver contenido →
                  </p>
                </div>
              </Link>
            ))
          : eventosEstaticos.map((ev) => (
              <article
                key={ev.id}
                className="bg-qbChalk border border-qbBorder rounded-2xl p-3 space-y-3 shadow-sm"
              >
                <div className="relative aspect-[16/10] rounded-xl bg-black/40 overflow-hidden flex items-center justify-center">
                  <span className="absolute top-2 left-2 z-10 bg-black text-qbInk text-[10px] font-bold px-2 py-0.5 rounded">
                    {ev.etiqueta}
                  </span>
                  <span className="text-[11px] text-qbMuted border border-dashed border-qbBorder rounded-lg px-3 py-6">
                    Foto del evento
                  </span>
                </div>
                <div className="px-1 pb-1 space-y-1">
                  <h4 className="text-sm font-bold text-qbInk">{ev.titulo}</h4>
                  <p className="text-xs text-qbMuted leading-relaxed">{ev.descripcion}</p>
                </div>
              </article>
            ))}
      </div>
    </div>
  );
}