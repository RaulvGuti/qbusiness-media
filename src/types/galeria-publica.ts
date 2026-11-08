import type { ArchivoGaleria, CarpetaGaleria } from '@/types/portafolio';

export type TipoMedio = 'imagen' | 'video' | 'enlace';

/** Archivo de una carpeta ya listo para mostrarse en el sitio público. */
export interface MedioPublico {
  id: string;
  tipo: TipoMedio;
  /** imagen/video: URL pública del archivo · enlace: URL de incrustación (iframe). */
  url: string;
  /** Miniatura (p. ej. la de YouTube en los enlaces) o null. */
  miniatura: string | null;
  pieFoto: string | null;
  nombre: string | null;
  orientacion: ArchivoGaleria['orientacion'];
  esPortada: boolean;
}

/** Carpeta con su portada ya resuelta (URL pública lista para <img>/<video>). */
export interface CarpetaConPortada extends CarpetaGaleria {
  portadaUrl: string | null;
  portadaTipo: 'imagen' | 'video' | null;
  totalArchivos: number;
}

export interface CarpetaConMedios {
  carpeta: CarpetaConPortada;
  medios: MedioPublico[];
}

/** Destacado del inicio ya resuelto para la tarjeta pública. */
export interface DestacadoPublico {
  id: string;
  tipo: 'carpeta' | 'empresa';
  titulo: string;
  descripcion: string | null;
  etiqueta: string | null;
  imagenUrl: string | null;
  imagenTipo: 'imagen' | 'video' | null;
  href: string;
}
