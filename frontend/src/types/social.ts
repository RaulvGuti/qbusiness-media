/**
 * Tipos alineados a las migraciones de Supabase.
 * Tabla: solicitudes_apoyo_social (000011 + 000014 + 000025 + 000030)
 * Campos reales: id, gestionado_por_id, nombre_entidad, persona_contacto,
 * correo, telefono, descripcion_proyecto, tipo_organizacion, fecha_tentativa,
 * estado ('nueva'|'en_revision'|'aprobada'|'rechazada'), notificado_en, creado_en
 * tipo_entidad y fecha_evento (000025) quedan solo para registros anteriores.
 */

export type EstadoSolicitudApoyo = 'nueva' | 'en_revision' | 'aprobada' | 'rechazada';

export interface SolicitudApoyoSocial {
  id: string;
  gestionadoPorId: string | null;
  nombreEntidad: string;
  personaContacto: string;
  correo: string;
  telefono: string | null;
  descripcionProyecto: string | null;
  tipoOrganizacion: string | null;
  fechaTentativa: string | null;
  estado: EstadoSolicitudApoyo;
  notificadoEn: string | null;
  creadoEn: string;
}

/**
 * Formulario público de solicitud de apoyo social. Conserva los nombres del
 * formulario; la API los guarda en tipo_organizacion y fecha_tentativa.
 */
export interface SolicitudApoyoSocialInput {
  nombreEntidad: string;
  personaContacto: string;
  correo: string;
  telefono?: string;
  descripcionProyecto?: string;
  tipoEntidad?: string;
  fechaEvento?: string;
}
