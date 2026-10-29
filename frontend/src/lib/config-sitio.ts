import type {
  ConfigSitio,
  ConfiguracionSitio,
  EnlaceFooter,
  GrupoConfig,
} from '@/types/config';

/**
 * Catálogo, valores por defecto y utilidades de la configuración del sitio.
 *
 * Este archivo es la única fuente de verdad de las claves de
 * `configuracion_sitio` que edita el panel y consume el sitio público. Lo usan
 * tanto Client Components (formulario) como el servidor (repositorio y Server
 * Action), por eso no importa nada de `server/`.
 */

export type TipoCampo =
  | 'texto'
  | 'area'
  | 'numero'
  | 'hora'
  | 'url'
  | 'email'
  | 'tel'
  | 'lineas';

export interface CampoConfig {
  grupo: GrupoConfig;
  clave: string;
  etiqueta: string;
  tipo?: TipoCampo;
  alto?: number;
  /** Ocupa toda la fila del formulario. */
  full?: boolean;
  /** Valor inicial si la fila no existe o está en null. */
  defecto: string;
  /** Texto de ayuda bajo el campo. */
  ayuda?: string;
}

export interface GrupoCampos {
  titulo: string;
  campos: CampoConfig[];
}

export interface PestanaConfig {
  id: string;
  titulo: string;
  grupos: GrupoCampos[];
}

export const PESTANAS: PestanaConfig[] = [
  {
    id: 'generales',
    titulo: 'Textos Generales y Hero',
    grupos: [
      {
        titulo: 'Hero y marca',
        campos: [
          {
            grupo: 'general',
            clave: 'hero_subtitulo',
            etiqueta: 'Subtítulo del Hero',
            tipo: 'area',
            alto: 110,
            defecto:
              'Videos que hacen que tu marca se vea del tamaño que es. Soluciones audiovisuales profesionales, fotografía comercial, podcasts y locación de estudio en Quetzaltenango bajo la dirección de {director}.',
            ayuda: 'Puedes usar {director} y {slogan} para insertar esos valores.',
          },
          {
            grupo: 'general',
            clave: 'director_nombre',
            etiqueta: 'Nombre del Director',
            defecto: 'Luis Gonzales',
          },
          {
            grupo: 'general',
            clave: 'slogan',
            etiqueta: 'Eslogan',
            defecto: 'Tu historia, nuestra estrategia.',
          },
          {
            grupo: 'menu',
            clave: 'whatsapp_cta',
            etiqueta: 'Mensaje de WhatsApp',
            tipo: 'area',
            alto: 80,
            defecto:
              'Hola QBusiness Media, quisiera cotizar un servicio audiovisual',
            ayuda: 'Es el texto que se envía al abrir el enlace de WhatsApp.',
          },
        ],
      },
      {
        titulo: 'Métricas del Hero',
        campos: [
          {
            grupo: 'general',
            clave: 'hero_stat_1_numero',
            etiqueta: 'Métrica 1: número',
            defecto: '+150',
          },
          {
            grupo: 'general',
            clave: 'hero_stat_1_label',
            etiqueta: 'Métrica 1: etiqueta',
            defecto: 'Proyectos Realizados',
          },
          {
            grupo: 'general',
            clave: 'hero_stat_2_numero',
            etiqueta: 'Métrica 2: número',
            defecto: '100%',
          },
          {
            grupo: 'general',
            clave: 'hero_stat_2_label',
            etiqueta: 'Métrica 2: etiqueta',
            defecto: 'Clientes Satisfechos',
          },
          {
            grupo: 'general',
            clave: 'hero_stat_3_numero',
            etiqueta: 'Métrica 3: número',
            defecto: '4K Cinema',
          },
          {
            grupo: 'general',
            clave: 'hero_stat_3_label',
            etiqueta: 'Métrica 3: etiqueta',
            defecto: 'Estándar de Calidad',
          },
        ],
      },
      {
        titulo: 'Botones del Header',
        campos: [
          {
            grupo: 'general',
            clave: 'header_cta_whatsapp',
            etiqueta: 'Texto del botón de WhatsApp',
            defecto: 'Cotizar WhatsApp',
          },
          {
            grupo: 'general',
            clave: 'header_sobre',
            etiqueta: 'Texto del botón Sobre Nosotros',
            defecto: 'Sobre Qbusiness MEDIA',
          },
        ],
      },
      {
        titulo: 'Footer',
        campos: [
          {
            grupo: 'general',
            clave: 'descripcion_footer',
            etiqueta: 'Descripción del pie de página',
            tipo: 'area',
            alto: 90,
            defecto:
              'Somos una agencia de medios y creatividad dedicada a contar historias que impactan. Quetzaltenango, Guatemala.',
          },
          {
            grupo: 'general',
            clave: 'footer_servicios',
            etiqueta: 'Lista de servicios',
            tipo: 'lineas',
            alto: 150,
            full: true,
            defecto:
              'Producción Audiovisual 4K\nContenido Vertical 9:16\nFotografía Comercial de Producto\nProducción de Podcasts Broadcast\nRenta de Locación y Ciclorama\nCobertura de Eventos con Drone',
            ayuda: 'Escribe un servicio por línea.',
          },
        ],
      },
      {
        titulo: 'Sobre QBusiness Media',
        campos: [
          {
            grupo: 'sobre',
            clave: 'sobre_nosotros_titulo',
            etiqueta: 'Título del modal',
            defecto: 'Sobre QBusiness Media',
            full: true,
          },
          {
            grupo: 'sobre',
            clave: 'sobre_nosotros_parrafo_1',
            etiqueta: 'Primer párrafo',
            tipo: 'area',
            alto: 120,
            full: true,
            defecto:
              'Fundada en Quetzaltenango bajo la visión directiva de {director}, QBusiness Media se ha consolidado como una de las agencias de producción audiovisual y estrategia digital con mayor crecimiento y rigor técnico en el occidente de Guatemala.',
            ayuda: 'Puedes usar {director} y {slogan} para insertar esos valores.',
          },
          {
            grupo: 'sobre',
            clave: 'sobre_nosotros_parrafo_2',
            etiqueta: 'Segundo párrafo',
            tipo: 'area',
            alto: 120,
            full: true,
            defecto:
              'Nuestro lema "{slogan}" resume el compromiso de convertir las metas de comunicación de marcas corporativas, pymes e instituciones en piezas audiovisuales memorables con calidad cinematográfica.',
            ayuda: 'Puedes usar {director} y {slogan} para insertar esos valores.',
          },
        ],
      },
      {
        titulo: 'Métricas del modal',
        campos: [
          {
            grupo: 'sobre',
            clave: 'stat_1_numero',
            etiqueta: 'Métrica 1: número',
            defecto: '+8 Años',
          },
          {
            grupo: 'sobre',
            clave: 'stat_1_label',
            etiqueta: 'Métrica 1: etiqueta',
            defecto: 'Trayectoria',
          },
          {
            grupo: 'sobre',
            clave: 'stat_2_numero',
            etiqueta: 'Métrica 2: número',
            defecto: 'Top 1',
          },
          {
            grupo: 'sobre',
            clave: 'stat_2_label',
            etiqueta: 'Métrica 2: etiqueta',
            defecto: 'Estudio en Xela',
          },
          {
            grupo: 'sobre',
            clave: 'stat_3_numero',
            etiqueta: 'Métrica 3: número',
            defecto: '4K / Cinema',
          },
          {
            grupo: 'sobre',
            clave: 'stat_3_label',
            etiqueta: 'Métrica 3: etiqueta',
            defecto: 'Equipo Pro',
          },
        ],
      },
    ],
  },
  {
    id: 'contacto',
    titulo: 'Contacto, Redes y Redirecciones',
    grupos: [
      {
        titulo: 'Contacto',
        campos: [
          {
            grupo: 'contacto',
            clave: 'correo',
            etiqueta: 'Correo electrónico público',
            tipo: 'email',
            defecto: 'contacto@qbusinessmedia.gt',
          },
          {
            grupo: 'contacto',
            clave: 'whatsapp',
            etiqueta: 'Número de WhatsApp',
            tipo: 'tel',
            defecto: '+502 5944 8587',
          },
        ],
      },
      {
        titulo: 'Redes sociales',
        campos: [
          {
            grupo: 'redes',
            clave: 'instagram',
            etiqueta: 'Enlace de Instagram',
            tipo: 'url',
            defecto: 'https://instagram.com/qbusinessmedia',
          },
          {
            grupo: 'redes',
            clave: 'youtube',
            etiqueta: 'Enlace de YouTube',
            tipo: 'url',
            defecto: 'https://youtube.com/@qbusinessmedia',
          },
          {
            grupo: 'redes',
            clave: 'tiktok',
            etiqueta: 'Enlace de TikTok',
            tipo: 'url',
            defecto: 'https://tiktok.com/@qbusinessmedia',
          },
        ],
      },
      {
        titulo: 'Ubicación',
        campos: [
          {
            grupo: 'ubicacion',
            clave: 'direccion',
            etiqueta: 'Dirección física',
            defecto: 'Zona 3, Quetzaltenango, Guatemala',
          },
          {
            grupo: 'ubicacion',
            clave: 'link_google_maps',
            etiqueta: 'Enlace de Google Maps',
            tipo: 'url',
            full: true,
            defecto:
              'https://www.google.com/maps/search/?api=1&query=Zona+3%2C+Quetzaltenango%2C+Guatemala',
            ayuda: 'URL completa que abre el botón "Abrir en Google Maps".',
          },
        ],
      },
    ],
  },
  {
    id: 'estudio',
    titulo: 'Renta de Estudio',
    grupos: [
      {
        titulo: 'Tarifas y horario',
        campos: [
          {
            grupo: 'estudio',
            clave: 'tarifa_hora',
            etiqueta: 'Tarifa por hora (Q)',
            tipo: 'numero',
            defecto: '500',
          },
          {
            grupo: 'estudio',
            clave: 'hora_apertura',
            etiqueta: 'Hora de apertura',
            tipo: 'hora',
            defecto: '08:00',
          },
          {
            grupo: 'estudio',
            clave: 'hora_cierre',
            etiqueta: 'Hora de cierre',
            tipo: 'hora',
            defecto: '18:00',
          },
          {
            grupo: 'estudio',
            clave: 'max_pendientes_por_cliente',
            etiqueta: 'Máximo de reservas pendientes por cliente',
            tipo: 'numero',
            defecto: '3',
          },
        ],
      },
    ],
  },
];

/** Default por `grupo:clave`. */
export const CONFIG_DEFECTOS: Record<string, string> = {};

/** Todos los campos editables, en el orden del panel. */
export const CAMPOS_CONFIG: CampoConfig[] = [];

for (const pestana of PESTANAS) {
  for (const grupo of pestana.grupos) {
    for (const campo of grupo.campos) {
      CAMPOS_CONFIG.push(campo);
      CONFIG_DEFECTOS[`${campo.grupo}:${campo.clave}`] = campo.defecto;
    }
  }
}

export function buscarCampo(
  grupo: string,
  clave: string,
): CampoConfig | undefined {
  return CAMPOS_CONFIG.find(
    (campo) => campo.grupo === grupo && campo.clave === clave,
  );
}

/** Convierte un textarea en una lista de líneas no vacías. */
export function parseLineas(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean);
}

/** Convierte `Texto | /ruta` por línea en enlaces del footer. */
export function parseEnlacesFooter(texto: string): EnlaceFooter[] {
  const enlaces: EnlaceFooter[] = [];

  for (const linea of parseLineas(texto)) {
    const separador = linea.indexOf('|');
    if (separador === -1) continue;

    const textoEnlace = linea.slice(0, separador).trim();
    const href = linea.slice(separador + 1).trim();
    if (!textoEnlace || !href) continue;

    enlaces.push({ texto: textoEnlace, href });
  }

  return enlaces;
}

/**
 * Enlaces fijos del footer. Ya no se editan desde el panel de textos; la fila
 * histórica de `configuracion_sitio` se sigue leyendo para conservar lo que ya
 * estaba publicado, y este valor es el respaldo si no existe.
 */
const NAVEGACION_FOOTER_POR_DEFECTO =
  'Inicio | /\nPortafolio Multimedia | /portafolio\nBackstage & Producción | /backstage\nReseñas de Clientes | /resenas\nRenta de Estudio | /renta\nApoyo Social | /apoyo';

/**
 * Normaliza las filas de `configuracion_sitio` a un objeto tipado. Las claves
 * ausentes o con `null` usan el default del catálogo; una cadena vacía se
 * respeta porque el administrador pudo haber limpiado el campo.
 */
export function construirConfiguracionSitio(
  filas: ConfigSitio[],
): ConfiguracionSitio {
  const mapa = new Map<string, string | null>();
  for (const fila of filas) {
    mapa.set(`${fila.grupo}:${fila.clave}`, fila.valor);
  }

  const leer = (grupo: GrupoConfig, clave: string): string => {
    const llave = `${grupo}:${clave}`;
    return mapa.get(llave) ?? CONFIG_DEFECTOS[llave] ?? '';
  };

  const tarifaTexto = leer('estudio', 'tarifa_hora').trim();
  const tarifaNumero = tarifaTexto
    ? Number(tarifaTexto.replace(',', '.'))
    : null;

  const maxPendientesTexto = leer(
    'estudio',
    'max_pendientes_por_cliente',
  ).trim();
  const maxPendientes = Number.parseInt(maxPendientesTexto, 10);

  return {
    heroSubtitulo: leer('general', 'hero_subtitulo'),
    directorNombre: leer('general', 'director_nombre'),
    slogan: leer('general', 'slogan'),
    descripcionFooter: leer('general', 'descripcion_footer'),
    mensajeWhatsapp: leer('menu', 'whatsapp_cta'),

    heroStat1Numero: leer('general', 'hero_stat_1_numero'),
    heroStat1Label: leer('general', 'hero_stat_1_label'),
    heroStat2Numero: leer('general', 'hero_stat_2_numero'),
    heroStat2Label: leer('general', 'hero_stat_2_label'),
    heroStat3Numero: leer('general', 'hero_stat_3_numero'),
    heroStat3Label: leer('general', 'hero_stat_3_label'),

    headerCtaWhatsapp: leer('general', 'header_cta_whatsapp'),
    headerSobre: leer('general', 'header_sobre'),

    footerServicios: parseLineas(leer('general', 'footer_servicios')),
    footerNavegacion: parseEnlacesFooter(
      leer('general', 'footer_navegacion') || NAVEGACION_FOOTER_POR_DEFECTO,
    ),

    sobreNosotrosTitulo: leer('sobre', 'sobre_nosotros_titulo'),
    sobreNosotrosParrafo1: leer('sobre', 'sobre_nosotros_parrafo_1'),
    sobreNosotrosParrafo2: leer('sobre', 'sobre_nosotros_parrafo_2'),

    stat1Numero: leer('sobre', 'stat_1_numero'),
    stat1Label: leer('sobre', 'stat_1_label'),
    stat2Numero: leer('sobre', 'stat_2_numero'),
    stat2Label: leer('sobre', 'stat_2_label'),
    stat3Numero: leer('sobre', 'stat_3_numero'),
    stat3Label: leer('sobre', 'stat_3_label'),

    contactoEmail: leer('contacto', 'correo'),
    contactoWhatsappNumero: leer('contacto', 'whatsapp'),
    linkGoogleMaps: leer('ubicacion', 'link_google_maps'),
    linkInstagram: leer('redes', 'instagram'),
    linkYoutube: leer('redes', 'youtube'),
    linkTiktok: leer('redes', 'tiktok'),
    ubicacionDireccion: leer('ubicacion', 'direccion'),

    horaApertura: leer('estudio', 'hora_apertura'),
    horaCierre: leer('estudio', 'hora_cierre'),
    tarifaHora:
      tarifaNumero !== null && Number.isFinite(tarifaNumero)
        ? tarifaNumero
        : null,
    maxPendientesPorCliente: Number.isFinite(maxPendientes)
      ? maxPendientes
      : 3,
  };
}

/**
 * Valores iniciales del formulario: defaults del catálogo + filas reales. Las
 * filas con `null` no pisan el default; las cadenas vacías sí.
 */
export function valoresInicialesDesdeConfig(
  filas: ConfigSitio[],
): Record<string, string> {
  const valores: Record<string, string> = { ...CONFIG_DEFECTOS };

  for (const fila of filas) {
    if (fila.valor !== null) {
      valores[`${fila.grupo}:${fila.clave}`] = fila.valor;
    }
  }

  return valores;
}

/** Reemplaza los placeholders de los textos editables. */
export function interpolarTexto(
  texto: string,
  config: Pick<ConfiguracionSitio, 'directorNombre' | 'slogan'>,
): string {
  return texto
    .replace(/\{director\}/g, config.directorNombre)
    .replace(/\{slogan\}/g, config.slogan);
}

/** Enlace de WhatsApp con el número normalizado a dígitos. */
export function crearEnlaceWhatsApp(numero: string, mensaje: string): string {
  const digitos = numero.replace(/\D/g, '');
  const texto = encodeURIComponent(
    mensaje.trim() ||
      'Hola QBusiness Media, quisiera cotizar un servicio audiovisual',
  );

  return digitos
    ? `https://wa.me/${digitos}?text=${texto}`
    : `https://wa.me/?text=${texto}`;
}

const REGEX_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const REGEX_URL = /^https:\/\//i;

function validarLineas(campo: CampoConfig, valor: string): void {
  const lineas = parseLineas(valor);

  if (lineas.length > 30) {
    throw new Error(`"${campo.etiqueta}" admite como máximo 30 líneas.`);
  }

  if (campo.clave === 'footer_servicios') {
    for (const linea of lineas) {
      if (linea.length > 150) {
        throw new Error(
          'Cada servicio puede tener como máximo 150 caracteres.',
        );
      }
    }
  }
}

/**
 * Valida y normaliza el valor antes de guardarlo. Los campos vacíos se
 * permiten: el administrador puede limpiar un texto o un enlace.
 */
export function validarValor(campo: CampoConfig, valor: string): string {
  const limpio = valor.trim();
  const maximo =
    campo.tipo === 'area' || campo.tipo === 'lineas' ? 5000 : 500;

  if (limpio.length > maximo) {
    throw new Error(
      `"${campo.etiqueta}" supera el máximo de ${maximo} caracteres.`,
    );
  }

  if (!limpio) return '';

  switch (campo.tipo) {
    case 'email':
      if (!REGEX_CORREO.test(limpio)) {
        throw new Error(`"${campo.etiqueta}" no es un correo válido.`);
      }
      break;
    case 'url':
      if (!REGEX_URL.test(limpio)) {
        throw new Error(
          `"${campo.etiqueta}" debe ser una URL completa que empiece con https://.`,
        );
      }
      break;
    case 'tel':
      if (limpio.replace(/\D/g, '').length < 8) {
        throw new Error(`"${campo.etiqueta}" debe tener al menos 8 dígitos.`);
      }
      break;
    case 'hora':
      if (!REGEX_HORA.test(limpio)) {
        throw new Error(`"${campo.etiqueta}" debe tener el formato HH:MM.`);
      }
      break;
    case 'numero':
      if (
        campo.clave === 'max_pendientes_por_cliente' &&
        !/^\d+$/.test(limpio)
      ) {
        throw new Error(
          `"${campo.etiqueta}" debe ser un número entero.`,
        );
      }
      if (
        campo.clave !== 'max_pendientes_por_cliente' &&
        !/^\d+([.,]\d+)?$/.test(limpio)
      ) {
        throw new Error(`"${campo.etiqueta}" debe ser un número.`);
      }
      break;
    case 'lineas':
      validarLineas(campo, limpio);
      break;
    default:
      break;
  }

  return limpio;
}
