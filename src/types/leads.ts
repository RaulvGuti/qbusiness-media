export type TipoServicioLead = 'video-corporativo' | 'foto-comercial' | 'podcast' | 'reels' | 'estudio' | 'otro';

export type EstadoLead = 'nuevo' | 'contactado' | 'cotizado' | 'en_proceso' | 'cerrado' | 'descartado';

export type EstadoResena = 'borrador' | 'publicada' | 'eliminada';

export interface LeadContacto {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  empresa?: string;
  tipoServicio: TipoServicioLead;
  presupuesto?: string;
  mensaje: string;
  origen: 'contactanos' | 'whatsapp' | 'landing';
  estado: EstadoLead;
  fechaCreacion: string;
}

export interface ResenaCliente {
  id: string;
  nombreCliente: string;
  empresa?: string;
  cargo?: string;
  calificacion: number; // 1-5
  testimonio: string;
  proyectoRelacionado?: string;
  estado: EstadoResena;
  fechaCreacion: string;
  fechaPublicacion?: string;
}