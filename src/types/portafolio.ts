/**
 * Tipos alineados a las migraciones de Supabase.
 * Tablas (modelo v2 de galería, 000023 + 000024 + 000033):
 * empresas, carpetas_galeria, archivos_galeria, destacados.
 * La tabla legada `portafolio` (000003) NO se usa en el frontend.
 */

export type ModuloCarpeta = 'inicio' | 'portafolio' | 'backstage' | 'estudio' | 'apoyo_social';
export type EstadoCarpeta = 'borrador' | 'publicado';
export type TipoArchivo = 'imagen' | 'video' | 'enlace';
export type OrientacionArchivo = 'vertical' | 'horizontal' | 'cuadrada';

/** empresas: nombre UNIQUE, logo_ruta en bucket `logos`, activa. */
export interface Empresa {
  id: string;
  nombre: string;
  logoRuta: string | null;
  portadaRuta: string | null;
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

/**
 * archivos_galeria: ruta_storage guarda la URL pública final de R2 (o una ruta
 * legacy de Supabase Storage) y url_externa para enlaces; al menos una.
 */
export interface ArchivoGaleria {
  id: string;
  carpetaId: string;
  tipo: TipoArchivo;
  esPortada: boolean;
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

/** Motivos esperados de una operación de galería fallida. */
export type CodigoResultadoGaleria =
  | 'SIN_SESION'
  | 'SIN_PERMISO'
  | 'DATOS_INVALIDOS'
  | 'MIME_NO_PERMITIDO'
  | 'ARCHIVO_MUY_GRANDE'
  | 'CARPETA_INVALIDA'
  | 'SIN_CONFIGURACION'
  | 'ERROR_BD'
  | 'ERROR_R2'
  | 'ERROR_RED'
  | 'ERROR_INESPERADO';

/**
 * Resultado serializable de las acciones de galería.
 *
 * Los errores esperados se devuelven como datos para que el mensaje llegue al
 * navegador; lanzarlos desde una Server Action hace que producción los oculte
 * detrás de un error genérico de React.
 */
export type ResultadoGaleria<T> =
  | { ok: true; data: T }
  | { ok: false; codigo: CodigoResultadoGaleria; mensaje: string };

/** Datos que el navegador necesita para subir un archivo a R2. */
export interface FirmaSubidaGaleria {
  key: string;
  publicUrl: string;
  uploadUrl: string | null;
  headers: Record<string, string>;
  mock: boolean;
}
