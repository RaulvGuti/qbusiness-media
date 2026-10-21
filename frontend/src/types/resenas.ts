/**
 * Tipos alineados a las migraciones de Supabase.
 * Tabla: resenas_clientes (000009 + 000026)
 * Campos reales: id, reserva_id, cliente_id, autor, empresa_autor, comentario,
 * calificacion (1-5, nullable), estado ('pendiente'|'aprobada'|'rechazada'),
 * carpeta_id, video_url, video_proporcion ('16/9'|'9/16'),
 * origen ('cliente'|'admin'), creado_en
 * Restricción: origen='admin' O reserva_id IS NOT NULL
 */

export type EstadoResena = 'pendiente' | 'aprobada' | 'rechazada';
export type ProporcionVideo = '16/9' | '9/16';
export type OrigenResena = 'cliente' | 'admin';

export interface ResenaCliente {
  id: string;
  reservaId: string | null;
  clienteId: string | null;
  autor: string;
  empresaAutor: string | null;
  comentario: string;
  calificacion: number | null;
  estado: EstadoResena;
  carpetaId: string | null;
  videoUrl: string | null;
  videoProporcion: ProporcionVideo | null;
  origen: OrigenResena;
  creadoEn: string;
}

/** Formulario de reseña de cliente (requiere sesión + reserva completada). */
export interface ResenaClienteInput {
  reservaId: string;
  autor: string;
  empresaAutor?: string;
  comentario: string;
  calificacion?: number;
  videoUrl?: string;
  videoProporcion?: ProporcionVideo;
}
