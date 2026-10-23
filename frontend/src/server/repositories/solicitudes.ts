import type { EstadoSolicitudApoyo, SolicitudApoyoSocial, SolicitudApoyoSocialInput } from '@/types/social';
import { solicitudesMock } from './datos-mock';

/**
 * Repositorio de solicitudes_apoyo_social (000011 + 000025).
 * Hoy: datos mock. Al conectar Supabase:
 *   supabase.from('solicitudes_apoyo_social').select(...)
 * Escritura del formulario público: service role desde un Server Action.
 */
export async function listarSolicitudes(): Promise<SolicitudApoyoSocial[]> {
  // SUPABASE: SELECT * FROM solicitudes_apoyo_social ORDER BY creado_en DESC;
  return Promise.resolve([...solicitudesMock]);
}

export async function contarSolicitudesPorEstado(estado: EstadoSolicitudApoyo): Promise<number> {
  // SUPABASE: SELECT count(*) FROM solicitudes_apoyo_social WHERE estado = $estado;
  return Promise.resolve(solicitudesMock.filter((s) => s.estado === estado).length);
}

export async function crearSolicitud(input: SolicitudApoyoSocialInput): Promise<SolicitudApoyoSocial> {
  // SUPABASE (service role):
  // INSERT INTO solicitudes_apoyo_social
  //   (nombre_entidad, persona_contacto, correo, telefono, descripcion_proyecto, tipo_entidad, fecha_evento)
  // VALUES (...) RETURNING *;
  // El estado nace en 'nueva' (DEFAULT).
  const nueva: SolicitudApoyoSocial = {
    id: `solicitud-${Date.now()}`,
    gestionadoPorId: null,
    nombreEntidad: input.nombreEntidad,
    personaContacto: input.personaContacto,
    correo: input.correo,
    telefono: input.telefono ?? null,
    descripcionProyecto: input.descripcionProyecto ?? null,
    tipoEntidad: input.tipoEntidad ?? null,
    fechaEvento: input.fechaEvento ?? null,
    estado: 'nueva',
    notificadoEn: null,
    creadoEn: new Date().toISOString(),
  };
  solicitudesMock.unshift(nueva);
  return Promise.resolve(nueva);
}

export async function actualizarEstadoSolicitud(
  id: string,
  estado: EstadoSolicitudApoyo,
  gestionadoPorId?: string,
): Promise<void> {
  // SUPABASE: UPDATE solicitudes_apoyo_social
  // SET estado = $estado, gestionado_por_id = $gestionadoPorId WHERE id = $id;
  // Valores: nueva | en_revision | aprobada | rechazada.
  const solicitud = solicitudesMock.find((s) => s.id === id);
  if (solicitud) {
    solicitud.estado = estado;
    if (gestionadoPorId) solicitud.gestionadoPorId = gestionadoPorId;
  }
  return Promise.resolve();
}
