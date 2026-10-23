import type { EstadoLead, LeadContacto, LeadContactoInput } from '@/types/leads';
import { leadsMock } from './datos-mock';

/**
 * Repositorio de leads_contacto (000010).
 * Hoy: datos mock. Al conectar Supabase, reemplazar el cuerpo por:
 *   const { data, error } = await supabase.from('leads_contacto').select(...);
 * Escritura del formulario público: service role desde un Server Action
 * (RLS no permite INSERT a anon).
 */
export async function listarLeads(): Promise<LeadContacto[]> {
  // SUPABASE: SELECT * FROM leads_contacto ORDER BY creado_en DESC;
  // RLS: solo admin (ALL). El público inserta vía service role en el servidor.
  return Promise.resolve([...leadsMock]);
}

export async function contarLeadsPorEstado(estado: EstadoLead): Promise<number> {
  // SUPABASE: SELECT count(*) FROM leads_contacto WHERE estado = $estado;
  return Promise.resolve(leadsMock.filter((l) => l.estado === estado).length);
}

export async function crearLead(input: LeadContactoInput): Promise<LeadContacto> {
  // SUPABASE (service role): INSERT INTO leads_contacto (nombre, correo, telefono, mensaje)
  // VALUES (...) RETURNING *;
  // El estado nace en 'nuevo' (DEFAULT). notificado_en lo pone el servicio de notificación.
  const nuevo: LeadContacto = {
    id: `lead-${Date.now()}`,
    gestionadoPorId: null,
    nombre: input.nombre,
    correo: input.correo,
    telefono: input.telefono ?? null,
    mensaje: input.mensaje ?? null,
    estado: 'nuevo',
    notificadoEn: null,
    creadoEn: new Date().toISOString(),
  };
  leadsMock.unshift(nuevo);
  return Promise.resolve(nuevo);
}

export async function actualizarEstadoLead(id: string, estado: EstadoLead, gestionadoPorId?: string): Promise<void> {
  // SUPABASE: UPDATE leads_contacto SET estado = $estado, gestionado_por_id = $gestionadoPorId
  // WHERE id = $id;
  const lead = leadsMock.find((l) => l.id === id);
  if (lead) {
    lead.estado = estado;
    if (gestionadoPorId) lead.gestionadoPorId = gestionadoPorId;
  }
  return Promise.resolve();
}
