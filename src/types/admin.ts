import type { LeadContacto } from './leads';
import type { ReservaEstudio } from './estudio';
import type { ResenaCliente } from './leads';
import type { SolicitudApoyoSocial } from './social';

export interface DashboardStats {
  totalLeads: number;
  leadsNuevos: number;
  reservasPendientes: number;
  reservasConfirmadas: number;
  resenasBorrador: number;
  resenasPublicadas: number;
  solicitudesPendientes: number;
}

export interface AdminData {
  leads: LeadContacto[];
  reservas: ReservaEstudio[];
  resenas: ResenaCliente[];
  solicitudesApoyo: SolicitudApoyoSocial[];
  stats: DashboardStats;
}