/**
 * Tipos alineados a las migraciones de Supabase.
 * Tabla: configuracion_sitio (000016) — pares grupo/clave/valor.
 * Grupos permitidos (CHECK): menu, modulos, formularios, contacto,
 * redes, ubicacion, estudio, general y sobre (000039).
 * Tabla: notas_contacto (000025) — notas internas sobre un lead O una solicitud.
 */

export type GrupoConfig =
  | 'menu'
  | 'modulos'
  | 'formularios'
  | 'contacto'
  | 'redes'
  | 'ubicacion'
  | 'estudio'
  | 'general'
  | 'sobre';

export interface ConfigSitio {
  id: string;
  grupo: GrupoConfig;
  clave: string;
  valor: string | null;
  actualizadoEn: string;
}

/** Enlace editable del footer: texto visible + ruta o URL. */
export interface EnlaceFooter {
  texto: string;
  href: string;
}

/**
 * Configuración pública del sitio, ya normalizada y con los valores por
 * defecto aplicados. La construye `lib/config-sitio.ts` a partir de las filas
 * de `configuracion_sitio`.
 */
export interface ConfiguracionSitio {
  heroSubtitulo: string;
  directorNombre: string;
  slogan: string;
  descripcionFooter: string;
  mensajeWhatsapp: string;

  heroStat1Numero: string;
  heroStat1Label: string;
  heroStat2Numero: string;
  heroStat2Label: string;
  heroStat3Numero: string;
  heroStat3Label: string;

  headerCtaWhatsapp: string;
  headerSobre: string;

  footerServicios: string[];
  footerNavegacion: EnlaceFooter[];

  sobreNosotrosTitulo: string;
  sobreNosotrosParrafo1: string;
  sobreNosotrosParrafo2: string;

  stat1Numero: string;
  stat1Label: string;
  stat2Numero: string;
  stat2Label: string;
  stat3Numero: string;
  stat3Label: string;

  contactoEmail: string;
  contactoWhatsappNumero: string;
  linkGoogleMaps: string;
  linkInstagram: string;
  linkYoutube: string;
  linkTiktok: string;
  ubicacionDireccion: string;

  horaApertura: string;
  horaCierre: string;
  tarifaHora: number | null;
  maxPendientesPorCliente: number;
}

/** Cambio que envía el formulario del panel a la Server Action. */
export interface CambioConfigSitio {
  grupo: GrupoConfig;
  clave: string;
  valor: string;
}

/** notas_contacto: exactamente uno de lead_id / solicitud_id; autor_id NOT NULL. */
export interface NotaContacto {
  id: string;
  leadId: string | null;
  solicitudId: string | null;
  autorId: string;
  texto: string;
  creadoEn: string;
}

/** administradores / clientes (000012): id = auth.users.id. */
export interface PerfilUsuario {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string | null;
  creadoEn: string;
}

/** Resultado de la RPC es_admin(). */
export type EsAdmin = boolean;
