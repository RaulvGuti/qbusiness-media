interface EventoApoyo {
  id: string;
  etiqueta: string;
  titulo: string;
  descripcion: string;
  /** Foto del evento. Si no hay, se muestra el espacio vacío (se llenará desde Gestor de galería › Apoyo social). */
  imagen?: string;
}

const eventos: EventoApoyo[] = [
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

export default function EventosRealizados() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h3 className="text-lg font-bold text-qbInk">Eventos Realizados</h3>
        <span className="text-[11px] text-qbMuted">Impacto Comunitario QBusiness</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {eventos.map((ev) => (
          <article
            key={ev.id}
            className="bg-qbChalk border border-qbBorder rounded-2xl p-3 space-y-3 shadow-sm"
          >
            <div className="relative aspect-[16/10] rounded-xl bg-black/40 overflow-hidden flex items-center justify-center">
              <span className="absolute top-2 left-2 z-10 bg-black text-qbInk text-[10px] font-bold px-2 py-0.5 rounded">
                {ev.etiqueta}
              </span>
              {ev.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ev.imagen} alt={ev.titulo} className="h-full w-full object-contain" />
              ) : (
                <span className="text-[11px] text-qbMuted border border-dashed border-qbBorder rounded-lg px-3 py-6">
                  Foto del evento
                </span>
              )}
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
