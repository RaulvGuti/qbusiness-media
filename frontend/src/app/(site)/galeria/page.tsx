'use client';

import { useState } from 'react';
import GalleryFilters from '@/components/portafolio/GalleryFilters';
import ProjectCard from '@/components/portafolio/ProjectCard';
import BackstageSection from '@/components/portafolio/BackstageSection';
import type {
  BackstageItem,
  FiltroPortafolio,
  ProyectoPortafolio,
} from '@/types/portafolio';

const proyectosMock: ProyectoPortafolio[] = [
  {
    id: 'p1',
    titulo: 'Campaña Comercial Producto X',
    cliente: 'Cliente A',
    tipo: 'video',
    orientacion: 'horizontal',
    fechaPublicacion: '2025-09-15',
    etiquetas: ['Contenido horizontal', 'Comercial'],
    imagenUrl: '/placeholder.jpg',
    videoUrl: '#',
    destacado: true,
  },
  {
    id: 'p2',
    titulo: 'Sesión Fotográfica Catálogo',
    cliente: 'Cliente B',
    tipo: 'foto',
    orientacion: 'vertical',
    fechaPublicacion: '2025-08-20',
    etiquetas: ['Fotografía', 'Catálogo'],
    imagenUrl: '/placeholder.jpg',
  },
  {
    id: 'p3',
    titulo: 'Reel Lanzamiento',
    cliente: 'Cliente C',
    tipo: 'reel',
    orientacion: 'vertical',
    fechaPublicacion: '2025-07-10',
    etiquetas: ['Reels', 'Lanzamiento'],
    imagenUrl: '/placeholder.jpg',
    videoUrl: '#',
  },
  {
    id: 'p4',
    titulo: 'Video Corporativo',
    cliente: 'Cliente D',
    tipo: 'video',
    orientacion: 'horizontal',
    fechaPublicacion: '2025-06-05',
    etiquetas: ['Contenido horizontal', 'Corporativo'],
    imagenUrl: '/placeholder.jpg',
    videoUrl: '#',
  },
];

const backstageMock: BackstageItem[] = [
  {
    id: 'b1',
    titulo: 'Detrás de cámaras — Set Comercial',
    categoria: 'general',
    tipo: 'foto',
    imagenUrl: '/placeholder.jpg',
    descripcion: 'Preparación, iluminación y equipo en acción.',
  },
  {
    id: 'b2',
    titulo: 'Detrás de edición — Flujo de postproducción',
    categoria: 'general',
    tipo: 'video',
    imagenUrl: '/placeholder.jpg',
    videoUrl: '#',
    descripcion: 'Proceso unificado de backstage (cámaras + edición).',
  },
  {
    id: 'b3',
    titulo: 'Making Of — Rodaje',
    categoria: 'general',
    tipo: 'foto',
    imagenUrl: '/placeholder.jpg',
    descripcion: 'Equipo y equipo creativo trabajando en conjunto.',
  },
];

export default function GaleriaPage() {
  const [filtro, setFiltro] = useState<FiltroPortafolio>('todos');

  const proyectosFiltrados = proyectosMock.filter((p) => {
    if (filtro === 'todos') return true;
    if (filtro === 'fotos') return p.tipo === 'foto';
    if (filtro === 'videos') return p.tipo === 'video';
    if (filtro === 'contenido-horizontal') {
      return (
        p.etiquetas.some((e) => e.toLowerCase().includes('horizontal')) ||
        p.orientacion === 'horizontal'
      );
    }
    if (filtro === 'reels') return p.tipo === 'reel';
    if (filtro === 'backstage') return p.tipo === 'backstage';
    return true;
  });

  const conteos = {
    todos: proyectosMock.length,
    fotos: proyectosMock.filter((p) => p.tipo === 'foto').length,
    videos: proyectosMock.filter((p) => p.tipo === 'video').length,
    'contenido-horizontal': proyectosMock.filter(
      (p) =>
        p.etiquetas.some((e) => e.toLowerCase().includes('horizontal')) ||
        p.orientacion === 'horizontal'
    ).length,
    reels: proyectosMock.filter((p) => p.tipo === 'reel').length,
    backstage: proyectosMock.filter((p) => p.tipo === 'backstage').length,
  } as Partial<Record<FiltroPortafolio, number>>;

  return (
    <section className="page-stack">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-qbBorder pb-6">
        <div>
          <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">Galería Multimedia</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">Portafolio</h2>
          <p className="text-sm text-qbMuted">Explora nuestras campañas y proyectos corporativos.</p>
        </div>
        <GalleryFilters
          filtroActivo={filtro}
          onFiltroChange={setFiltro}
          conteos={conteos}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {proyectosFiltrados.map((p) => (
          <ProjectCard key={p.id} proyecto={p} />
        ))}
      </div>

      {proyectosFiltrados.length === 0 && (
        <div className="text-center py-10 text-qbMuted">
          No hay proyectos para el filtro seleccionado.
        </div>
      )}

      <div className="pt-6">
        <BackstageSection items={backstageMock} />
      </div>
    </section>
  );
}