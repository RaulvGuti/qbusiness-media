import type { ConfigSitio, GrupoConfig, NotaContacto } from '@/types/config';
import { configuracionMock, notasContactoMock } from './datos-mock';

/**
 * Repositorio de configuracion_sitio (000016) y notas_contacto (000025).
 * configuracion_sitio: lectura pública (RLS using true); escritura admin.
 * Grupos permitidos (CHECK): menu, modulos, formularios, contacto, redes,
 * ubicacion, estudio.
 */
export async function listarConfiguracion(grupo?: GrupoConfig): Promise<ConfigSitio[]> {
  // SUPABASE (anon): SELECT * FROM configuracion_sitio [WHERE grupo = $grupo]
  // ORDER BY grupo, clave;
  return Promise.resolve(
    configuracionMock.filter((c) => !grupo || c.grupo === grupo),
  );
}

export async function obtenerValorConfig(grupo: GrupoConfig, clave: string): Promise<string | null> {
  // SUPABASE (anon): SELECT valor FROM configuracion_sitio
  // WHERE grupo = $grupo AND clave = $clave;
  return Promise.resolve(configuracionMock.find((c) => c.grupo === grupo && c.clave === clave)?.valor ?? null);
}

export async function guardarConfiguracion(grupo: GrupoConfig, clave: string, valor: string): Promise<void> {
  // SUPABASE (admin): INSERT INTO configuracion_sitio (grupo, clave, valor)
  // VALUES ($grupo, $clave, $valor)
  // ON CONFLICT (grupo, clave) DO UPDATE SET valor = EXCLUDED.valor;
  const existente = configuracionMock.find((c) => c.grupo === grupo && c.clave === clave);
  if (existente) {
    existente.valor = valor;
    existente.actualizadoEn = new Date().toISOString();
  } else {
    configuracionMock.push({
      id: `config-${Date.now()}`,
      grupo,
      clave,
      valor,
      actualizadoEn: new Date().toISOString(),
    });
  }
  return Promise.resolve();
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
