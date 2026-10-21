/**
 * Tipos alineados a las migraciones de Supabase.
 * Tabla: leads_contacto (000010 + 000014)
 * Campos reales: id, gestionado_por_id, nombre, correo, telefono, mensaje,
 * estado ('nuevo'|'contactado'|'cerrado'), notificado_en, creado_en
 */

export type EstadoLead = 'nuevo' | 'contactado' | 'cerrado';

export interface LeadContacto {
  id: string;
  gestionadoPorId: string | null;
  nombre: string;
  correo: string;
  telefono: string | null;
  mensaje: string | null;
  estado: EstadoLead;
  notificadoEn: string | null;
  creadoEn: string;
}

/** Formulario público de contacto (ContactForm / QuoteForm). */
export interface LeadContactoInput {
  nombre: string;
  correo: string;
  telefono?: string;
  mensaje?: string;
}
