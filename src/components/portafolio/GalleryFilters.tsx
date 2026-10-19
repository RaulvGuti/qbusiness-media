'use client';

import type { FiltroPortafolio } from '@/types/portafolio';

interface GalleryFiltersProps {
  filtroActivo: FiltroPortafolio;
  onFiltroChange: (filtro: FiltroPortafolio) => void;
  conteos?: Partial<Record<FiltroPortafolio, number>>;
}

const filtros: Array<{ value: FiltroPortafolio; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'fotos', label: 'Fotos' },
  { value: 'videos', label: 'Videos' },
  { value: 'contenido-horizontal', label: 'Contenido horizontal' },
  { value: 'reels', label: 'Reels' },
  { value: 'backstage', label: 'Backstage' },
];

export default function GalleryFilters({
  filtroActivo,
  onFiltroChange,
  conteos = {},
}: GalleryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filtros.map((filtro) => {
        const activo = filtroActivo === filtro.value;
        const count = conteos[filtro.value] ?? 0;

        return (
          <button
            key={filtro.value}
            onClick={() => onFiltroChange(filtro.value)}
            className={`px-4 py-2 font-semibold rounded-xl text-xs transition ${
              activo
                ? 'bg-qbChalk border border-qbBorder text-qbInk'
                : 'text-[#ECE7DE]/85 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
            type="button"
          >
            {filtro.label}
            {count > 0 && (
              <span className="ml-1.5 text-[10px] opacity-60">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}