import type { EstadoResena, ResenaCliente, ResenaClienteInput } from '@/types/resenas';
import { resenasMock } from './datos-mock';

/**
 * Repositorio de resenas_clientes (000009 + 000026).
 * Hoy: datos mock. Al conectar Supabase:
 *   supabase.from('resenas_clientes').select(...)
 * Lectura pública solo de estado='aprobada' (RLS resenas_lectura_aprobadas).
 * INSERT de cliente: solo con sesión y reserva COMPLETADA (RLS).
 * INSERT/UPDATE de admin (origen='admin') salta esa restricción.
 */
export async function listarResenasAprobadas(): Promise<ResenaCliente[]> {
  // SUPABASE (anon/auth): SELECT * FROM resenas_clientes
  // WHERE estado = 'aprobada' ORDER BY creado_en DESC;
  return Promise.resolve(resenasMock.filter((r) => r.estado === 'aprobada'));
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
