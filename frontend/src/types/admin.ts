import type { LeadContacto } from './leads';
import type { ReservaEstudio } from './estudio';
import type { ResenaCliente } from './resenas';
import type { SolicitudApoyoSocial } from './social';

/** KPIs del dashboard administrativo, calculados sobre los estados reales. */
export interface DashboardStats {
  leadsNuevos: number;
  leadsContactados: number;
  leadsCerrados: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  reservasCompletadas: number;
  resenasPendientes: number;
  resenasAprobadas: number;
  solicitudesNuevas: number;
  solicitudesEnRevision: number;
}

export interface AdminData {
  leads: LeadContacto[];
  reservas: ReservaEstudio[];
  resenas: ResenaCliente[];
  solicitudesApoyo: SolicitudApoyoSocial[];
  stats: DashboardStats;
}
