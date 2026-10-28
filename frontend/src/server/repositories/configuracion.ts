import { cache } from 'react';
import { createSupabaseServerClient } from '@/server/supabase/server';
import { construirConfiguracionSitio } from '@/lib/config-sitio';
import type {
  ConfigSitio,
  ConfiguracionSitio,
  GrupoConfig,
  NotaContacto,
} from '@/types/config';
import { configuracionMock, notasContactoMock } from './datos-mock';

/**
 * Repositorio de configuracion_sitio (000016 y 000039) y notas_contacto
 * (000025).
 *
 * configuracion_sitio: lectura pública (RLS using true); escritura exclusiva
 * del administrador principal (000038). Las lecturas caen a datos mock si no
 * hay credenciales reales de Supabase; las escrituras también, para que el
 * panel siga funcionando en desarrollo.
 *
 * Grupos permitidos (CHECK de 000039): menu, modulos, formularios, contacto,
 * redes, ubicacion, estudio, general y sobre.
 */

interface ConfigSitioRow {
  id: string;
  grupo: GrupoConfig;
  clave: string;
  valor: string | null;
  actualizado_en: string;
}

function tieneConexionSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return (
    Boolean(url && anonKey) &&
    !url.includes('tu-proyecto.supabase.co') &&
    anonKey !== 'tu-anon-key-publica'
  );
}

function mapearConfigSitio(row: ConfigSitioRow): ConfigSitio {
  return {
    id: row.id,
    grupo: row.grupo,
    clave: row.clave,
    valor: row.valor,
    actualizadoEn: row.actualizado_en,
  };
}

export async function listarConfiguracion(
  grupo?: GrupoConfig,
): Promise<ConfigSitio[]> {
  if (!tieneConexionSupabase()) {
    return configuracionMock.filter((c) => !grupo || c.grupo === grupo);
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('configuracion_sitio')
    .select('id, grupo, clave, valor, actualizado_en')
    .order('grupo', { ascending: true })
    .order('clave', { ascending: true });

  if (grupo) {
    query = query.eq('grupo', grupo);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error('No se pudo cargar la configuración del sitio.');
  }

  return ((data ?? []) as ConfigSitioRow[]).map(mapearConfigSitio);
}

export async function obtenerValorConfig(
  grupo: GrupoConfig,
  clave: string,
): Promise<string | null> {
  if (!tieneConexionSupabase()) {
    return (
      configuracionMock.find((c) => c.grupo === grupo && c.clave === clave)
        ?.valor ?? null
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('configuracion_sitio')
    .select('valor')
    .eq('grupo', grupo)
    .eq('clave', clave)
    .maybeSingle();

  if (error) {
    throw new Error('No se pudo leer la configuración del sitio.');
  }

  return (data?.valor as string | null | undefined) ?? null;
}

/**
 * Configuración pública ya normalizada. `cache()` evita repetir la consulta
 * cuando el layout y la página la piden en la misma petición.
 */
export const obtenerConfiguracionSitio =
  cache(async (): Promise<ConfiguracionSitio> => {
    try {
      const filas = await listarConfiguracion();
      return construirConfiguracionSitio(filas);
    } catch {
      // El sitio público nunca debe romperse por una caída de configuración:
      // usa los defaults del catálogo. El panel sí muestra el error real.
      return construirConfiguracionSitio([]);
    }
  });

export async function guardarConfiguraciones(
  cambios: { grupo: GrupoConfig; clave: string; valor: string }[],
): Promise<void> {
  if (cambios.length === 0) return;

  if (!tieneConexionSupabase()) {
    for (const cambio of cambios) {
      const existente = configuracionMock.find(
        (c) => c.grupo === cambio.grupo && c.clave === cambio.clave,
      );

      if (existente) {
        existente.valor = cambio.valor;
        existente.actualizadoEn = new Date().toISOString();
      } else {
        configuracionMock.push({
          id: `config-${Date.now()}-${configuracionMock.length}`,
          grupo: cambio.grupo,
          clave: cambio.clave,
          valor: cambio.valor,
          actualizadoEn: new Date().toISOString(),
        });
      }
    }
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('configuracion_sitio').upsert(
    cambios.map((cambio) => ({
      grupo: cambio.grupo,
      clave: cambio.clave,
      valor: cambio.valor,
    })),
    { onConflict: 'grupo,clave' },
  );

  if (error) {
    const mensaje = (error.message ?? '').toLowerCase();
    if (error.code === '42501' || mensaje.includes('row-level security')) {
      throw new Error(
        'No tienes permisos suficientes o tu sesión expiró para guardar la configuración.',
      );
    }
    if (error.code === '23514') {
      throw new Error(
        'La base de datos todavía no acepta estos textos. Aplica la migración 000039.',
      );
    }
    throw new Error('No se pudo guardar la configuración del sitio.');
  }
}

export async function guardarConfiguracion(
  grupo: GrupoConfig,
  clave: string,
  valor: string,
): Promise<void> {
  await guardarConfiguraciones([{ grupo, clave, valor }]);
}

/* ---------------------- notas_contacto (000025) ---------------------- */

export async function listarNotasDeLead(leadId: string): Promise<NotaContacto[]> {
  // SUPABASE (admin): SELECT * FROM notas_contacto WHERE lead_id = $leadId ORDER BY creado_en;
  return Promise.resolve(notasContactoMock.filter((n) => n.leadId === leadId));
}

export async function listarNotasDeSolicitud(solicitudId: string): Promise<NotaContacto[]> {
  // SUPABASE (admin): SELECT * FROM notas_contacto WHERE solicitud_id = $solicitudId ORDER BY creado_en;
  return Promise.resolve(notasContactoMock.filter((n) => n.solicitudId === solicitudId));
}

export async function crearNotaContacto(
  destino: { leadId?: string; solicitudId?: string },
  autorId: string,
  texto: string,
): Promise<NotaContacto> {
  // SUPABASE (admin): INSERT INTO notas_contacto (lead_id, solicitud_id, autor_id, texto)
  // VALUES (...) RETURNING *;
  // Check: exactamente uno de lead_id / solicitud_id debe ser NOT NULL.
  const nota: NotaContacto = {
    id: `nota-${Date.now()}`,
    leadId: destino.leadId ?? null,
    solicitudId: destino.solicitudId ?? null,
    autorId,
    texto,
    creadoEn: new Date().toISOString(),
  };
  notasContactoMock.push(nota);
  return Promise.resolve(nota);
}
