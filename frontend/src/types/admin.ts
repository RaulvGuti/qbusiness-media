import type { LeadContacto } from './leads';
import type { ReservaEstudio } from './estudio';
import type { ResenaCliente } from './resenas';
import type { SolicitudApoyoSocial } from './social';

/**
 * Roles del equipo interno (000038).
 * admin_principal: acceso total. secretaria: solo la operación del día a día.
 */
export type RolAdministrador = 'admin_principal' | 'secretaria';

/** Fila de `administradores` ligada a la sesión de Supabase Auth. */
export interface PerfilAdministrador {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string | null;
  rol: RolAdministrador;
  creadoEn: string;
}

/** Una cuenta del equipo que aparece en la gestión de usuarios. */
export type MiembroEquipo = PerfilAdministrador;

/** Datos del formulario para crear una cuenta de personal. */
export interface NuevaCuentaPersonalInput {
  nombreCompleto: string;
  correo: string;
  telefono?: string;
  password: string;
  rol: RolAdministrador;
}

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
