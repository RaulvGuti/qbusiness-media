import type {
  ArchivoGaleria,
  CarpetaGaleria,
  Destacado,
  Empresa,
  ModuloCarpeta,
} from '@/types/portafolio';
import { archivosMock, carpetasMock, destacadosMock, empresasMock } from './datos-mock';

/**
 * Repositorio del modelo v2 de galería (000023 + 000024):
 * empresas, carpetas_galeria, archivos_galeria, destacados.
 * La tabla legada `portafolio` NO se usa.
 * Buckets de Storage: `galeria` (archivos) y `logos` (logos de empresas).
 * Lectura pública: solo carpetas estado='publicado' y empresas activa=true.
 */
export async function listarEmpresasActivas(): Promise<Empresa[]> {
  // SUPABASE (anon): SELECT * FROM empresas WHERE activa = true ORDER BY nombre;
  return Promise.resolve(empresasMock.filter((e) => e.activa));
}

export async function listarTodasLasEmpresas(): Promise<Empresa[]> {
  // SUPABASE (admin): SELECT * FROM empresas ORDER BY nombre;
  return Promise.resolve([...empresasMock]);
}

export async function listarCarpetasPublicadas(modulo?: ModuloCarpeta): Promise<CarpetaGaleria[]> {
  // SUPABASE (anon): SELECT c.*, e.nombre AS nombre_empresa, e.logo_ruta AS logo_empresa
  // FROM carpetas_galeria c LEFT JOIN empresas e ON e.id = c.empresa_id
  // WHERE c.estado = 'publicado' [AND c.modulo = $modulo]
  // ORDER BY c.publicada_en DESC;
  return Promise.resolve(
    carpetasMock
      .filter((c) => c.estado === 'publicado' && (!modulo || c.modulo === modulo))
      .sort((a, b) => (b.publicadaEn ?? '').localeCompare(a.publicadaEn ?? '')),
  );
}

export async function listarTodasLasCarpetas(modulo?: ModuloCarpeta): Promise<CarpetaGaleria[]> {
  // SUPABASE (admin): SELECT * FROM carpetas_galeria [WHERE modulo = $modulo] ORDER BY creado_en DESC;
  return Promise.resolve(
    carpetasMock.filter((c) => !modulo || c.modulo === modulo),
  );
}

export async function obtenerCarpeta(id: string): Promise<CarpetaGaleria | null> {
  // SUPABASE: SELECT * FROM carpetas_galeria WHERE id = $id;
  return Promise.resolve(carpetasMock.find((c) => c.id === id) ?? null);
}

export async function actualizarEstadoCarpeta(
  id: string,
  estado: 'borrador' | 'publicado',
): Promise<void> {
  // SUPABASE (admin): UPDATE carpetas_galeria SET estado = $estado WHERE id = $id;
  // El trigger fija publicada_en al pasar a 'publicado'.
  const carpeta = carpetasMock.find((c) => c.id === id);
  if (carpeta) {
    carpeta.estado = estado;
    carpeta.publicadaEn = estado === 'publicado' ? new Date().toISOString() : null;
    carpeta.actualizadoEn = new Date().toISOString();
  }
  return Promise.resolve();
}

export async function listarArchivosDeCarpeta(carpetaId: string): Promise<ArchivoGaleria[]> {
  // SUPABASE (anon, vía carpeta_publicada): SELECT * FROM archivos_galeria
  // WHERE carpeta_id = $carpetaId ORDER BY orden;
  return Promise.resolve(
    archivosMock
      .filter((a) => a.carpetaId === carpetaId)
      .sort((a, b) => a.orden - b.orden),
  );
}

export async function listarTodosLosArchivos(): Promise<ArchivoGaleria[]> {
  // SUPABASE (admin): SELECT * FROM archivos_galeria ORDER BY carpeta_id, orden;
  return Promise.resolve([...archivosMock]);
}

/**
 * RPC carpeta_publicada(p_id uuid) → boolean (000023).
 * La política de archivos_galeria la invoca; aquí queda tipada para el cliente.
 */
export async function carpetaPublicada(carpetaId: string): Promise<boolean> {
  // SUPABASE: await supabase.rpc('carpeta_publicada', { p_id: carpetaId });
  const carpeta = carpetasMock.find((c) => c.id === carpetaId);
  return Promise.resolve(carpeta?.estado === 'publicado');
}

export async function listarDestacados(): Promise<Destacado[]> {
  // SUPABASE (anon): SELECT d.*, c.nombre AS carpeta_nombre, e.nombre AS empresa_nombre
  // FROM destacados d
  // LEFT JOIN carpetas_galeria c ON c.id = d.carpeta_id
  // LEFT JOIN empresas e ON e.id = d.empresa_id
  // ORDER BY d.posicion;
  // Check: exactamente uno de carpeta_id / empresa_id; posicion UNIQUE.
  return Promise.resolve(
    [...destacadosMock]
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
      }),
  );
}

/** Destacados públicos: solo carpetas publicadas y empresas activas. */
export async function listarDestacadosPublicos(): Promise<Destacado[]> {
  const todos = await listarDestacados();
  return Promise.resolve(
    todos.filter(
      (d) =>
        (d.carpeta && d.carpeta.estado === 'publicado') ||
        (d.empresa && d.empresa.activa),
    ),
  );
}
