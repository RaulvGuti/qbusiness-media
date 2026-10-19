export type TipoOrganizacion = 'fundacion' | 'institucion' | 'ong' | 'bomberos' | 'otro';

export type EstadoSolicitudApoyo = 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'completada';

export interface SolicitudApoyoSocial {
  id: string;
  nombreOrganizacion: string;
  tipoOrganizacion: TipoOrganizacion;
  nombreContacto: string;
  cargoContacto: string;
  email: string;
  telefono: string;
  ubicacion: string;
  descripcionProyecto: string;
  objetivoApoyo: string;
  fechaTentativa: string;
  publicoBeneficiario: string;
  alcanceSolicitado: 'foto' | 'video' | 'foto-video' | 'reel' | 'otro';
  presupuestoPropio?: string;
  comentarios?: string;
  estado: EstadoSolicitudApoyo;
  fechaCreacion: string;
}