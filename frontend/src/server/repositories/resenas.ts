import { createSupabaseServerClient } from '@/server/supabase/server';
import type { EstadoResena, ResenaCliente, ResenaClienteInput } from '@/types/resenas';
import { resenasMock } from './datos-mock';

/**
 * Repositorio de resenas_clientes (000009 + 000026).
 * Lectura pública solo de estado='aprobada' (RLS resenas_lectura_aprobadas).
 * INSERT de cliente: solo con sesión y reserva COMPLETADA (RLS).
 * INSERT/UPDATE de admin (origen='admin') salta esa restricción.
 */

interface ResenaPublicaRow {
  id: string;
  autor: string;
  empresa_autor: string | null;
  comentario: string;
  calificacion: number | null;
  video_url: string | null;
  video_proporcion: '16/9' | '9/16' | null;
  origen: 'cliente' | 'admin';
  carpeta_id: string | null;
  creado_en: string;
}

export interface ReservaResenable {
  id: string;
  estado: 'completada';
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

export async function listarResenasAprobadas(): Promise<ResenaCliente[]> {
  if (!tieneConexionSupabase()) {
    return resenasMock.filter((r) => r.estado === 'aprobada');
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('resenas_publicas')
    .select(
      'id, autor, empresa_autor, comentario, calificacion, video_url, video_proporcion, origen, carpeta_id, creado_en',
    )
    .order('creado_en', { ascending: false });

  if (error) {
    throw new Error('No se pudieron cargar las reseñas.');
  }

  return ((data ?? []) as ResenaPublicaRow[]).map((row) => ({
    id: row.id,
    reservaId: null,
    clienteId: null,
    autor: row.autor,
    empresaAutor: row.empresa_autor,
    comentario: row.comentario,
    calificacion: row.calificacion,
    estado: 'aprobada',
    carpetaId: row.carpeta_id,
    videoUrl: row.video_url,
    videoProporcion: row.video_proporcion,
    origen: row.origen,
    creadoEn: row.creado_en,
  }));
}

/**
 * Reserva completada del cliente que aún no tiene reseña. Es la que se ofrece
 * en el formulario público; el endpoint vuelve a validar propiedad y estado.
 */
export async function obtenerReservaResenable(
  clienteId: string,
): Promise<ReservaResenable | null> {
  if (!tieneConexionSupabase()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: reservas, error } = await supabase
    .from('reservas')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('estado', 'completada')
    .order('fecha_hora_fin', { ascending: false });

  if (error) {
    throw new Error('No se pudieron consultar las reservas del cliente.');
  }

  const ids = ((reservas ?? []) as { id: string }[]).map((r) => r.id);
  if (ids.length === 0) {
    return null;
  }

  const { data: resenas, error: errorResenas } = await supabase
    .from('resenas_clientes')
    .select('reserva_id')
    .eq('cliente_id', clienteId)
    .in('reserva_id', ids);

  if (errorResenas) {
    throw new Error('No se pudieron consultar las reseñas del cliente.');
  }

  const usadas = new Set(
    ((resenas ?? []) as { reserva_id: string | null }[]).map((r) => r.reserva_id),
  );
  const libre = ids.find((id) => !usadas.has(id));

  return libre ? { id: libre, estado: 'completada' } : null;
}

export async function listarTodasLasResenas(): Promise<ResenaCliente[]> {
  // SUPABASE (admin): SELECT * FROM resenas_clientes ORDER BY creado_en DESC;
  return Promise.resolve([...resenasMock]);
}

export async function crearResenaCliente(input: ResenaClienteInput): Promise<ResenaCliente> {
  // SUPABASE (authenticated):
  // INSERT INTO resenas_clientes (reserva_id, cliente_id, autor, empresa_autor,
  //   comentario, calificacion, video_url, video_proporcion, origen, estado)
  // VALUES (..., auth.uid(), ..., 'cliente', 'pendiente') RETURNING *;
  // La RLS exige: reserva propia en estado 'completada', estado='pendiente',
  // origen='cliente', carpeta_id IS NULL.
  const nueva: ResenaCliente = {
    id: `resena-${Date.now()}`,
    reservaId: input.reservaId,
    clienteId: null,
    autor: input.autor,
    empresaAutor: input.empresaAutor ?? null,
    comentario: input.comentario,
    calificacion: input.calificacion ?? null,
    estado: 'pendiente',
    carpetaId: null,
    videoUrl: input.videoUrl ?? null,
    videoProporcion: input.videoProporcion ?? null,
    origen: 'cliente',
    creadoEn: new Date().toISOString(),
  };
  return Promise.resolve(nueva);
}

export async function moderarResena(id: string, estado: EstadoResena): Promise<void> {
  // SUPABASE (admin): UPDATE resenas_clientes SET estado = $estado WHERE id = $id;
  // Valores válidos: pendiente | aprobada | rechazada.
  const resena = resenasMock.find((r) => r.id === id);
  if (resena) resena.estado = estado;
  return Promise.resolve();
}

/** Reseña creada por un administrador (origen='admin', sin reserva asociada). */
export async function crearResenaAdmin(input: Omit<ResenaClienteInput, 'reservaId'>): Promise<ResenaCliente> {
  // SUPABASE (admin):
  // INSERT INTO resenas_clientes (autor, empresa_autor, comentario, calificacion,
  //   video_url, video_proporcion, origen, estado)
  // VALUES (..., 'admin', 'aprobada') RETURNING *;
  // La CHECK permite origen='admin' sin reserva_id.
  const nueva: ResenaCliente = {
    id: `resena-${Date.now()}`,
    reservaId: null,
    clienteId: null,
    autor: input.autor,
    empresaAutor: input.empresaAutor ?? null,
    comentario: input.comentario,
    calificacion: input.calificacion ?? null,
    estado: 'aprobada',
    carpetaId: null,
    videoUrl: input.videoUrl ?? null,
    videoProporcion: input.videoProporcion ?? null,
    origen: 'admin',
    creadoEn: new Date().toISOString(),
  };
  resenasMock.unshift(nueva);
  return Promise.resolve(nueva);
}

export async function eliminarResena(id: string): Promise<void> {
  // SUPABASE (admin): DELETE FROM resenas_clientes WHERE id = $id;
  // Preferible en la práctica: moderar a 'rechazada' para conservar historial.
  const idx = resenasMock.findIndex((r) => r.id === id);
  if (idx >= 0) resenasMock.splice(idx, 1);
  return Promise.resolve();
}
