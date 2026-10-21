/**
 * Tipos alineados a las migraciones de Supabase.
 * Tablas (modelo v2 de galería, 000023 + 000024):
 * empresas, carpetas_galeria, archivos_galeria, destacados.
 * La tabla legada `portafolio` (000003) NO se usa en el frontend.
 */

export type ModuloCarpeta = 'portafolio' | 'backstage' | 'estudio' | 'apoyo_social';
export type EstadoCarpeta = 'borrador' | 'publicado';
export type TipoArchivo = 'imagen' | 'video' | 'enlace';
export type OrientacionArchivo = 'vertical' | 'horizontal' | 'cuadrada';

/** empresas: nombre UNIQUE, logo_ruta en bucket `logos`, activa. */
export interface Empresa {
  id: string;
  nombre: string;
  logoRuta: string | null;
  descripcion: string | null;
  activa: boolean;
}

/** carpetas_galeria: agrupa archivos por módulo; publicada_en se fija por trigger. */
export interface CarpetaGaleria {
  id: string;
  modulo: ModuloCarpeta;
  nombre: string;
  etiqueta: string | null;
  descripcion: string | null;
  filtro: string | null;
  categoria: string | null;
  equipoUsado: string | null;
  lugar: string | null;
  empresaId: string | null;
  estado: EstadoCarpeta;
  publicadaEn: string | null;
  creadoPor: string | null;
  creadoEn: string;
  actualizadoEn: string;
  nombreEmpresa?: string | null;
  logoEmpresa?: string | null;
}

/** archivos_galeria: ruta_storage en bucket `galeria` o url_externa (al menos una). */
export interface ArchivoGaleria {
  id: string;
  carpetaId: string;
  tipo: TipoArchivo;
  rutaStorage: string | null;
  urlExterna: string | null;
  urlMiniatura: string | null;
  nombreOriginal: string | null;
  pieFoto: string | null;
  orientacion: OrientacionArchivo;
  anchoPx: number | null;
  altoPx: number | null;
  orden: number;
  creadoEn: string;
}

/** destacados: XOR carpeta_id / empresa_id, posicion UNIQUE. */
export interface Destacado {
  id: string;
  carpetaId: string | null;
  empresaId: string | null;
  posicion: number;
  carpeta?: CarpetaGaleria;
  empresa?: Empresa;
}

/** Filtros de la vista pública de portafolio. */
export type FiltroPortafolio =
  | 'todos'
  | 'imagen'
  | 'video'
  | 'vertical'
  | 'horizontal'
  | 'cuadrada';
