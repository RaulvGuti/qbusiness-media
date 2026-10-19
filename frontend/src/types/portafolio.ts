export type ProyectoTipo = 'foto' | 'video' | 'reel' | 'backstage';

export type FiltroPortafolio =
  | 'todos'
  | 'fotos'
  | 'videos'
  | 'contenido-horizontal'
  | 'reels'
  | 'backstage';

export interface ProyectoPortafolio {
  id: string;
  titulo: string;
  cliente: string;
  tipo: ProyectoTipo;
  orientacion: 'vertical' | 'horizontal' | 'cuadrado';
  fechaPublicacion: string;
  etiquetas: string[];
  imagenUrl: string;
  videoUrl?: string;
  destacado?: boolean;
}

export interface BackstageItem {
  id: string;
  titulo: string;
  categoria: 'detras-camaras' | 'detras-edicion' | 'general';
  tipo: 'foto' | 'video' | 'reel';
  imagenUrl: string;
  videoUrl?: string;
  descripcion?: string;
}