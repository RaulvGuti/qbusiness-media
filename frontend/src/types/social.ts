/**
 * Tipos alineados a las migraciones de Supabase.
 * Tabla: solicitudes_apoyo_social (000011 + 000014 + 000025)
 * Campos reales: id, gestionado_por_id, nombre_entidad, persona_contacto,
 * correo, telefono, descripcion_proyecto, tipo_entidad, fecha_evento,
 * estado ('nueva'|'en_revision'|'aprobada'|'rechazada'), notificado_en, creado_en
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
  tipoEntidad: string | null;
  fechaEvento: string | null;
  estado: EstadoSolicitudApoyo;
  notificadoEn: string | null;
  creadoEn: string;
}

/** Formulario público de solicitud de apoyo social. */
export interface SolicitudApoyoSocialInput {
  nombreEntidad: string;
  personaContacto: string;
  correo: string;
  telefono?: string;
  descripcionProyecto?: string;
  tipoEntidad?: string;
  fechaEvento?: string;
}
