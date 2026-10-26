'use server';

import { createSupabaseServerClient } from '@/server/supabase/server';
import type {
  ArchivoGaleria,
  CarpetaGaleria,
  Destacado,
  Empresa,
  ModuloCarpeta,
} from '@/types/portafolio';
import { archivosMock, carpetasMock, destacadosMock, empresasMock } from './datos-mock';
import { construirUrlStorage, esUuid, urlEmbed } from '@/lib/utils/galeria-publica';
import type {
  CarpetaConMedios,
  CarpetaConPortada,
  MedioPublico,
  TipoMedio,
} from '@/types/galeria-publica';

/**
 * Repositorio del modelo v2 de galería (000023, 000033 y 000037):
 * empresas, carpetas_galeria, archivos_galeria, destacados.
 * Buckets de Storage: `galeria` (archivos) y `logos` (logos de empresas).
 * Las subidas de archivos las hace el navegador directo al bucket (sesión del
 * administrador, políticas de 000027); aquí solo se registran, ordenan y borran.
 * Lectura pública: RLS deja ver solo carpetas 'publicado' y empresas activas.
 * Las lecturas caen a datos mock si no hay credenciales reales de Supabase;
 * las escrituras exigen conexión.
 */

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const BUCKET = 'galeria';

function tieneConexionSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return (
    Boolean(url && anonKey) &&
    !url.includes('tu-proyecto.supabase.co') &&
    anonKey !== 'tu-anon-key-publica'
  );
}

function exigirConexion(): void {
  if (!tieneConexionSupabase()) {
    throw new Error('Supabase no está configurado: define NEXT_PUBLIC_SUPABASE_URL y la anon key.');
  }
}

function fallar(error: { code?: string; message?: string }, porDefecto: string): never {
  const mensaje = (error.message ?? '').trim();
  if (error.code === '42501' || mensaje.includes('row-level security')) {
    throw new Error('No tienes permisos suficientes o tu sesión expiró para realizar esta acción.');
  }
  if (error.code === '23505') {
    throw new Error('Ya existe un registro con esos datos.');
  }
  throw new Error(mensaje || porDefecto);
}

/* ------------------------------------------------------------------ */
/* Filas y mapeo                                                       */
/* ------------------------------------------------------------------ */

type EmpresaRow = {
  id: string;
  nombre: string;
  logo_ruta: string | null;
  portada_ruta: string | null;
  descripcion: string | null;
  activa: boolean;
};

type CarpetaRow = {
  id: string;
  modulo: string;
  nombre: string;
  etiqueta: string | null;
  descripcion: string | null;
  filtro: string | null;
  categoria: string | null;
  equipo_usado: string | null;
  lugar: string | null;
  empresa_id: string | null;
  estado: string;
  publicada_en: string | null;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
  empresas?: { nombre: string; logo_ruta: string | null } | null;
};

type ArchivoRow = {
  id: string;
  carpeta_id: string;
  tipo: string;
  es_portada: boolean;
  ruta_storage: string | null;
  url_externa: string | null;
  url_miniatura: string | null;
  nombre_original: string | null;
  pie_foto: string | null;
  orientacion: string;
  ancho_px: number | null;
  alto_px: number | null;
  orden: number;
  creado_en: string;
};

type DestacadoRow = {
  id: string;
  carpeta_id: string | null;
  empresa_id: string | null;
  posicion: number;
  carpetas_galeria: CarpetaRow | null;
  empresas: EmpresaRow | null;
};

const CARPETA_SELECT = '*, empresas(nombre, logo_ruta)';

const mapearEmpresa = (r: EmpresaRow): Empresa => ({
  id: r.id,
  nombre: r.nombre,
  logoRuta: r.logo_ruta,
  portadaRuta: r.portada_ruta,
  descripcion: r.descripcion,
  activa: r.activa,
});

const mapearCarpeta = (r: CarpetaRow): CarpetaGaleria => ({
  id: r.id,
  modulo: r.modulo as ModuloCarpeta,
  nombre: r.nombre,
  etiqueta: r.etiqueta,
  descripcion: r.descripcion,
  filtro: r.filtro,
  categoria: r.categoria,
  equipoUsado: r.equipo_usado,
  lugar: r.lugar,
  empresaId: r.empresa_id,
  estado: r.estado as CarpetaGaleria['estado'],
  publicadaEn: r.publicada_en,
  creadoPor: r.creado_por,
  creadoEn: r.creado_en,
  actualizadoEn: r.actualizado_en,
  nombreEmpresa: r.empresas?.nombre ?? null,
  logoEmpresa: r.empresas?.logo_ruta ?? null,
});

const mapearArchivo = (r: ArchivoRow): ArchivoGaleria => ({
  id: r.id,
  carpetaId: r.carpeta_id,
  tipo: r.tipo as ArchivoGaleria['tipo'],
  esPortada: r.es_portada,
  rutaStorage: r.ruta_storage,
  urlExterna: r.url_externa,
  urlMiniatura: r.url_miniatura,
  nombreOriginal: r.nombre_original,
  pieFoto: r.pie_foto,
  orientacion: r.orientacion as ArchivoGaleria['orientacion'],
  anchoPx: r.ancho_px,
  altoPx: r.alto_px,
  orden: r.orden,
  creadoEn: r.creado_en,
});

const mapearDestacado = (r: DestacadoRow): Destacado => {
  const base: Destacado = {
    id: r.id,
    carpetaId: r.carpeta_id,
    empresaId: r.empresa_id,
    posicion: r.posicion,
  };
  if (r.carpeta_id && r.carpetas_galeria) return { ...base, carpeta: mapearCarpeta(r.carpetas_galeria) };
  if (r.empresa_id && r.empresas) return { ...base, empresa: mapearEmpresa(r.empresas) };
  return base;
};

/* ------------------------------------------------------------------ */
/* Lecturas: empresas                                                  */
/* ------------------------------------------------------------------ */

export async function listarEmpresasActivas(): Promise<Empresa[]> {
  if (!tieneConexionSupabase()) return empresasMock.filter((e) => e.activa);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('activa', true)
    .order('nombre', { ascending: true });

  if (error) fallar(error, 'No se pudieron cargar las empresas.');
  return ((data ?? []) as EmpresaRow[]).map(mapearEmpresa);
}

export async function listarTodasLasEmpresas(): Promise<Empresa[]> {
  if (!tieneConexionSupabase()) return [...empresasMock];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) fallar(error, 'No se pudieron cargar las empresas.');
  return ((data ?? []) as EmpresaRow[]).map(mapearEmpresa);
}

/* ------------------------------------------------------------------ */
/* Lecturas: carpetas                                                  */
/* ------------------------------------------------------------------ */

export async function listarCarpetasPublicadas(modulo?: ModuloCarpeta): Promise<CarpetaGaleria[]> {
  if (!tieneConexionSupabase()) {
    return carpetasMock
      .filter((c) => c.estado === 'publicado' && (!modulo || c.modulo === modulo))
      .sort((a, b) => (b.publicadaEn ?? '').localeCompare(a.publicadaEn ?? ''));
  }

  const supabase = await createSupabaseServerClient();
  let consulta = supabase
    .from('carpetas_galeria')
    .select(CARPETA_SELECT)
    .eq('estado', 'publicado')
    .order('publicada_en', { ascending: false });
  if (modulo) consulta = consulta.eq('modulo', modulo);

  const { data, error } = await consulta;
  if (error) fallar(error, 'No se pudieron cargar las carpetas publicadas.');
  return ((data ?? []) as CarpetaRow[]).map(mapearCarpeta);
}

export async function listarTodasLasCarpetas(modulo?: ModuloCarpeta): Promise<CarpetaGaleria[]> {
  if (!tieneConexionSupabase()) return carpetasMock.filter((c) => !modulo || c.modulo === modulo);

  const supabase = await createSupabaseServerClient();
  let consulta = supabase
    .from('carpetas_galeria')
    .select(CARPETA_SELECT)
    .order('creado_en', { ascending: false });
  if (modulo) consulta = consulta.eq('modulo', modulo);

  const { data, error } = await consulta;
  if (error) fallar(error, 'No se pudieron cargar las carpetas.');
  return ((data ?? []) as CarpetaRow[]).map(mapearCarpeta);
}

export async function obtenerCarpeta(id: string): Promise<CarpetaGaleria | null> {
  if (!tieneConexionSupabase()) return carpetasMock.find((c) => c.id === id) ?? null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('carpetas_galeria')
    .select(CARPETA_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) fallar(error, 'No se pudo cargar la carpeta.');
  return data ? mapearCarpeta(data as CarpetaRow) : null;
}

export async function actualizarEstadoCarpeta(
  id: string,
  estado: 'borrador' | 'publicado',
): Promise<void> {
  if (!tieneConexionSupabase()) {
    const carpeta = carpetasMock.find((c) => c.id === id);
    if (carpeta) {
      carpeta.estado = estado;
      carpeta.publicadaEn = estado === 'publicado' ? new Date().toISOString() : null;
      carpeta.actualizadoEn = new Date().toISOString();
    }
    return;
  }

  // El trigger set_publicada_en fija o limpia publicada_en.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('carpetas_galeria')
    .update({ estado })
    .eq('id', id)
    .select('id');

  if (error) fallar(error, 'No se pudo actualizar el estado de la carpeta.');
  if (!data || data.length === 0) {
    throw new Error('No se encontró la carpeta o no tienes permiso para modificarla.');
  }
}

/* ------------------------------------------------------------------ */
/* Lecturas: archivos                                                  */
/* ------------------------------------------------------------------ */

export async function listarArchivosDeCarpeta(carpetaId: string): Promise<ArchivoGaleria[]> {
  if (!tieneConexionSupabase()) {
    return archivosMock.filter((a) => a.carpetaId === carpetaId).sort((a, b) => a.orden - b.orden);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('archivos_galeria')
    .select('*')
    .eq('carpeta_id', carpetaId)
    .order('orden', { ascending: true });

  if (error) fallar(error, 'No se pudieron cargar los archivos.');
  return ((data ?? []) as ArchivoRow[]).map(mapearArchivo);
}

export async function listarTodosLosArchivos(): Promise<ArchivoGaleria[]> {
  if (!tieneConexionSupabase()) return [...archivosMock];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('archivos_galeria')
    .select('*')
    .order('carpeta_id', { ascending: true })
    .order('orden', { ascending: true });

  if (error) fallar(error, 'No se pudieron cargar los archivos.');
  return ((data ?? []) as ArchivoRow[]).map(mapearArchivo);
}

export async function carpetaPublicada(carpetaId: string): Promise<boolean> {
  if (!tieneConexionSupabase()) {
    return carpetasMock.find((c) => c.id === carpetaId)?.estado === 'publicado';
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('carpeta_publicada', { p_id: carpetaId });
  if (error) fallar(error, 'No se pudo comprobar la carpeta.');
  return Boolean(data);
}

/* ------------------------------------------------------------------ */
/* Lecturas: destacados                                                */
/* ------------------------------------------------------------------ */

export async function listarDestacados(): Promise<Destacado[]> {
  if (!tieneConexionSupabase()) {
    return [...destacadosMock]
      .sort((a, b) => a.posicion - b.posicion)
      .map((d) => {
        if (d.carpetaId) {
          const carpeta = carpetasMock.find((c) => c.id === d.carpetaId);
          return { ...d, carpeta: carpeta ? { ...carpeta } : undefined };
        }
        if (d.empresaId) {
          const empresa = empresasMock.find((e) => e.id === d.empresaId);
          return { ...d, empresa: empresa ? { ...empresa } : undefined };
        }
        return d;
      });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('destacados')
    .select('id, carpeta_id, empresa_id, posicion, carpetas_galeria(*, empresas(nombre, logo_ruta)), empresas(*)')
    .order('posicion', { ascending: true });

  if (error) fallar(error, 'No se pudieron cargar los destacados.');
  return ((data ?? []) as unknown as DestacadoRow[]).map(mapearDestacado);
}

/** Destacados públicos: solo carpetas publicadas y empresas activas (RLS + filtro). */
export async function listarDestacadosPublicos(): Promise<Destacado[]> {
  const todos = await listarDestacados();
  return todos.filter(
    (d) =>
      (d.carpeta && d.carpeta.estado === 'publicado') || (d.empresa && d.empresa.activa),
  );
}

/* ------------------------------------------------------------------ */
/* Lecturas públicas con portada y medios (sitio público)              */
/* ------------------------------------------------------------------ */

/** Ruta de Storage o URL absoluta -> URL lista para <img>/<video>. */
function resolverArchivo(valor: string | null): string | null {
  if (!valor) return null;
  if (/^https?:\/\//i.test(valor)) return valor;
  return construirUrlStorage(BUCKET, valor);
}

function aMedio(a: ArchivoGaleria): MedioPublico | null {
  const tipo = a.tipo as TipoMedio;
  const base = {
    id: a.id,
    miniatura: resolverArchivo(a.urlMiniatura),
    pieFoto: a.pieFoto,
    nombre: a.nombreOriginal,
    orientacion: a.orientacion,
    esPortada: a.esPortada,
  };

  if (tipo === 'enlace') {
    const embed = a.urlExterna ? urlEmbed(a.urlExterna) : null;
    return embed ? { ...base, tipo, url: embed } : null;
  }

  const url = a.rutaStorage ? construirUrlStorage(BUCKET, a.rutaStorage) : a.urlExterna;
  return url ? { ...base, tipo, url } : null;
}

function construirMedios(archivos: ArchivoGaleria[]): MedioPublico[] {
  return [...archivos]
    .sort((x, y) => x.orden - y.orden)
    .map(aMedio)
    .filter((m): m is MedioPublico => m !== null);
}

/** Portada marcada; si no hay, el primer archivo que no sea enlace; si no, la miniatura de un enlace. */
function elegirPortada(medios: MedioPublico[]): {
  url: string | null;
  tipo: 'imagen' | 'video' | null;
} {
  const visuales = medios.filter((m) => m.tipo !== 'enlace');
  const elegido = visuales.find((m) => m.esPortada) ?? visuales[0];
  if (elegido) return { url: elegido.url, tipo: elegido.tipo === 'video' ? 'video' : 'imagen' };

  const enlace = medios.find((m) => m.miniatura);
  return enlace?.miniatura ? { url: enlace.miniatura, tipo: 'imagen' } : { url: null, tipo: null };
}

function conPortada(carpeta: CarpetaGaleria, archivos: ArchivoGaleria[]): CarpetaConPortada {
  const medios = construirMedios(archivos);
  const portada = elegirPortada(medios);
  return {
    ...carpeta,
    portadaUrl: portada.url,
    portadaTipo: portada.tipo,
    totalArchivos: medios.length,
  };
}

/** Una sola consulta para los archivos de varias carpetas (RLS: solo las publicadas para el público). */
async function archivosPorCarpeta(ids: string[]): Promise<Map<string, ArchivoGaleria[]>> {
  const mapa = new Map<string, ArchivoGaleria[]>();
  if (ids.length === 0) return mapa;

  let archivos: ArchivoGaleria[];
  if (!tieneConexionSupabase()) {
    archivos = archivosMock.filter((a) => ids.includes(a.carpetaId));
  } else {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('archivos_galeria')
      .select('*')
      .in('carpeta_id', ids)
      .order('orden', { ascending: true })
      .order('creado_en', { ascending: true });
    if (error) fallar(error, 'No se pudieron cargar los archivos.');
    archivos = ((data ?? []) as ArchivoRow[]).map(mapearArchivo);
  }

  for (const a of archivos) {
    const lista = mapa.get(a.carpetaId);
    if (lista) lista.push(a);
    else mapa.set(a.carpetaId, [a]);
  }
  return mapa;
}

/** Carpetas publicadas (de un módulo) con su portada lista para mostrarse. */
export async function listarCarpetasPublicadasConPortada(
  modulo?: ModuloCarpeta,
): Promise<CarpetaConPortada[]> {
  const carpetas = await listarCarpetasPublicadas(modulo);
  const porCarpeta = await archivosPorCarpeta(carpetas.map((c) => c.id));
  return carpetas.map((c) => conPortada(c, porCarpeta.get(c.id) ?? []));
}

/** Una carpeta publicada con todos sus archivos; null si no existe, no está publicada o es de otro módulo. */
export async function obtenerCarpetaPublicaConMedios(
  id: string,
  modulo?: ModuloCarpeta,
): Promise<CarpetaConMedios | null> {
  if (tieneConexionSupabase() && !esUuid(id)) return null;

  const carpeta = await obtenerCarpeta(id);
  if (!carpeta || carpeta.estado !== 'publicado') return null;
  if (modulo && carpeta.modulo !== modulo) return null;

  const archivos = (await archivosPorCarpeta([id])).get(id) ?? [];
  return { carpeta: conPortada(carpeta, archivos), medios: construirMedios(archivos) };
}

/** Todos los archivos de las carpetas publicadas de un módulo (p. ej. la galería de Renta de estudio). */
export async function listarMediosPublicos(modulo: ModuloCarpeta): Promise<MedioPublico[]> {
  const carpetas = await listarCarpetasPublicadas(modulo);
  const porCarpeta = await archivosPorCarpeta(carpetas.map((c) => c.id));
  return carpetas.flatMap((c) => construirMedios(porCarpeta.get(c.id) ?? []));
}

/* ------------------------------------------------------------------ */
/* Escrituras (administrador)                                          */
/* ------------------------------------------------------------------ */

interface CrearCarpetaInput {
  modulo: string;
  nombre: string;
  etiqueta?: string;
  descripcion?: string;
  filtro?: string;
}

/**
 * Crea la carpeta. En inicio/portafolio también busca o crea la empresa con el
 * mismo nombre y la enlaza (empresa_id). Devuelve la empresa para que la UI la
 * agregue a su lista.
 */
export async function crearCarpetaGaleria(
  input: CrearCarpetaInput,
): Promise<{ carpeta: CarpetaGaleria; empresa: Empresa | null }> {
  exigirConexion();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc('crear_carpeta_galeria', {
    p_modulo: input.modulo,
    p_nombre: input.nombre,
    p_etiqueta: input.etiqueta ?? null,
    p_descripcion: input.descripcion ?? null,
    p_filtro: input.filtro ?? null,
  });
  if (error) fallar(error, 'No se pudo crear la carpeta.');

  const fila = (Array.isArray(data) ? data[0] : data) as
    | { o_carpeta_id: string; o_empresa_id: string | null }
    | undefined;
  if (!fila) throw new Error('No se pudo crear la carpeta.');

  const { data: carpeta, error: errCarpeta } = await supabase
    .from('carpetas_galeria')
    .select(CARPETA_SELECT)
    .eq('id', fila.o_carpeta_id)
    .single();
  if (errCarpeta) fallar(errCarpeta, 'La carpeta se creó pero no se pudo leer.');

  let empresa: Empresa | null = null;
  if (fila.o_empresa_id) {
    const { data: emp, error: errEmp } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', fila.o_empresa_id)
      .single();
    if (errEmp) fallar(errEmp, 'No se pudo leer la empresa de la carpeta.');
    empresa = mapearEmpresa(emp as EmpresaRow);
  }

  return { carpeta: mapearCarpeta(carpeta as CarpetaRow), empresa };
}

interface RegistrarArchivoInput {
  carpetaId: string;
  tipo: 'imagen' | 'video' | 'enlace';
  rutaStorage?: string | null;
  urlExterna?: string | null;
  urlMiniatura?: string | null;
  nombreOriginal?: string | null;
  orientacion: 'horizontal' | 'vertical' | 'cuadrada';
  anchoPx?: number | null;
  altoPx?: number | null;
}

/**
 * Registra un archivo ya subido a Storage (o un enlace externo). El primero que
 * no sea enlace queda como portada si la carpeta aún no tiene una.
 */
export async function registrarArchivoGaleria(input: RegistrarArchivoInput): Promise<ArchivoGaleria> {
  exigirConexion();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc('agregar_archivo_galeria', {
    p_carpeta_id: input.carpetaId,
    p_tipo: input.tipo,
    p_ruta_storage: input.rutaStorage ?? null,
    p_url_externa: input.urlExterna ?? null,
    p_url_miniatura: input.urlMiniatura ?? null,
    p_nombre_original: input.nombreOriginal ?? null,
    p_orientacion: input.orientacion,
    p_ancho_px: input.anchoPx ?? null,
    p_alto_px: input.altoPx ?? null,
  });
  if (error) fallar(error, 'No se pudo registrar el archivo.');

  return mapearArchivo((Array.isArray(data) ? data[0] : data) as ArchivoRow);
}

export async function actualizarPieFoto(id: string, pieFoto: string): Promise<void> {
  exigirConexion();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('archivos_galeria')
    .update({ pie_foto: pieFoto.trim() || null })
    .eq('id', id)
    .select('id');

  if (error) fallar(error, 'No se pudo guardar el pie de foto.');
  if (!data || data.length === 0) throw new Error('No se encontró el archivo.');
}

export async function definirPortada(carpetaId: string, archivoId: string): Promise<void> {
  exigirConexion();
  const supabase = await createSupabaseServerClient();

  // definir_portada (000033) solo recibe el archivo: deduce la carpeta de él.
  // `carpetaId` se conserva en la firma por compatibilidad con el Gestor.
  void carpetaId;
  const { error } = await supabase.rpc('definir_portada', { p_archivo_id: archivoId });
  if (error) fallar(error, 'No se pudo cambiar la portada.');
}

export async function reordenarArchivos(carpetaId: string, ids: string[]): Promise<void> {
  exigirConexion();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc('reordenar_archivos', {
    p_carpeta_id: carpetaId,
    p_orden: ids,
  });
  if (error) fallar(error, 'No se pudo guardar el nuevo orden.');
}

/** Borra el registro (reasignando la portada) y luego los objetos de Storage. */
export async function eliminarArchivoGaleria(id: string): Promise<void> {
  exigirConexion();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc('eliminar_archivo_galeria', { p_archivo_id: id });
  if (error) fallar(error, 'No se pudo eliminar el archivo.');

  const fila = (Array.isArray(data) ? data[0] : data) as
    | { o_ruta_storage: string | null; o_url_miniatura: string | null }
    | undefined;

  // La miniatura puede ser una URL externa (p. ej. YouTube): solo se borran rutas de Storage.
  const rutas = [fila?.o_ruta_storage, fila?.o_url_miniatura].filter(
    (r): r is string => Boolean(r) && !/^https?:\/\//i.test(r as string),
  );
  if (rutas.length > 0) {
    const { error: errStorage } = await supabase.storage.from(BUCKET).remove(rutas);
    // El registro ya no existe: un objeto huérfano no debe bloquear al administrador.
    if (errStorage) console.error('No se pudo borrar el objeto de Storage:', errStorage.message);
  }
}

interface DestacadoEntrada {
  tipo: 'carpeta' | 'empresa';
  id: string;
}

/** Reemplaza todos los destacados; la posición es el lugar en la lista. */
export async function guardarDestacados(items: DestacadoEntrada[]): Promise<void> {
  exigirConexion();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc('guardar_destacados', { p_items: items });
  if (error) fallar(error, 'No se pudieron guardar los destacados.');
}
