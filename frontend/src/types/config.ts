/**
 * Tipos alineados a las migraciones de Supabase.
 * Tabla: configuracion_sitio (000016) — pares grupo/clave/valor.
 * Grupos permitidos (CHECK): menu, modulos, formularios, contacto,
 * redes, ubicacion, estudio.
 * Tabla: notas_contacto (000025) — notas internas sobre un lead O una solicitud.
 */

export type GrupoConfig = 'menu' | 'modulos' | 'formularios' | 'contacto' | 'redes' | 'ubicacion' | 'estudio';

export interface ConfigSitio {
  id: string;
  grupo: GrupoConfig;
  clave: string;
  valor: string | null;
  actualizadoEn: string;
}

/** notas_contacto: exactamente uno de lead_id / solicitud_id; autor_id NOT NULL. */
export interface NotaContacto {
  id: string;
  leadId: string | null;
  solicitudId: string | null;
  autorId: string;
  texto: string;
  creadoEn: string;
}

/** administradores / clientes (000012): id = auth.users.id. */
export interface PerfilUsuario {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string | null;
  creadoEn: string;
}

/** Resultado de la RPC es_admin(). */
export type EsAdmin = boolean;
