import { createSupabaseServerClient } from '@/server/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type TipoActividad = 'contacto' | 'apoyo_social' | 'resena' | 'reserva';

export interface ResumenDashboard {
  resenasPendientes: number;
  mensajesNuevos: number;
  reservasPendientes: number;
  apoyoSocialNuevo: number;
  pagosPorRevisar: number;
}

export interface ActividadDashboard {
  tipo: TipoActividad;
  entidadId: string;
  titulo: string;
  detalle: string | null;
  estado: string;
  creadoEn: string;
}

export interface DiaActividad {
  clave: string;
  etiqueta: string;
  total: number;
  esHoy: boolean;
}

const RESUMEN_DASHBOARD_VACIO: ResumenDashboard = {
  resenasPendientes: 0,
  mensajesNuevos: 0,
  reservasPendientes: 0,
  apoyoSocialNuevo: 0,
  pagosPorRevisar: 0,
};

const TABLAS_ACTIVIDAD = [
  'leads_contacto',
  'solicitudes_apoyo_social',
  'resenas_clientes',
  'reservas',
] as const;

const ETIQUETAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// Guatemala no aplica horario de verano: su desfase es siempre UTC-6.
const OFFSET_GUATEMALA_MS = 6 * 60 * 60 * 1000;

interface ResumenRow {
  resenas_pendientes: number | string;
  mensajes_nuevos: number | string;
  reservas_pendientes: number | string;
  apoyo_social_nuevo: number | string;
  pagos_por_revisar: number | string;
}

interface ActividadRow {
  tipo: string;
  entidad_id: string;
  titulo: string;
  detalle: string | null;
  estado: string;
  creado_en: string;
}

function claveDiaGuatemala(instante: Date): string {
  const local = new Date(instante.getTime() - OFFSET_GUATEMALA_MS);
  const anio = local.getUTCFullYear();
  const mes = String(local.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(local.getUTCDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function sumarDias(clave: string, dias: number): string {
  const [anio, mes, dia] = clave.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias));
  const a = fecha.getUTCFullYear();
  const m = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const d = String(fecha.getUTCDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

function rangoSemanaActual() {
  const hoy = claveDiaGuatemala(new Date());
  const [anio, mes, dia] = hoy.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const diaSemana = (fecha.getUTCDay() + 6) % 7;
  const lunes = sumarDias(hoy, -diaSemana);
  const dias = Array.from({ length: 7 }, (_, indice) => sumarDias(lunes, indice));

  return {
    hoy,
    dias,
    desde: `${lunes}T00:00:00-06:00`,
    hasta: `${sumarDias(lunes, 7)}T00:00:00-06:00`,
  };
}

/**
 * RPC dashboard_resumen() (000036): contadores de pendientes para el panel.
 * Solo responde a miembros del equipo; RLS y la propia función validan el rol.
 */
export async function obtenerResumenDashboard(
  supabase: SupabaseServerClient,
): Promise<ResumenDashboard> {
  const { data, error } = await supabase.rpc('dashboard_resumen');

  if (error) {
    console.error('No se pudo cargar el resumen del dashboard:', error.code);
    return { ...RESUMEN_DASHBOARD_VACIO };
  }

  const fila = (Array.isArray(data) ? data[0] : data) as ResumenRow | null;

  return {
    resenasPendientes: Number(fila?.resenas_pendientes ?? 0),
    mensajesNuevos: Number(fila?.mensajes_nuevos ?? 0),
    reservasPendientes: Number(fila?.reservas_pendientes ?? 0),
    apoyoSocialNuevo: Number(fila?.apoyo_social_nuevo ?? 0),
    pagosPorRevisar: Number(fila?.pagos_por_revisar ?? 0),
  };
}

/**
 * RPC actividad_reciente(n) (000036): última actividad de contactos, apoyo
 * social, reseñas y reservas, ya unificada y ordenada por fecha.
 */
export async function obtenerActividadReciente(
  supabase: SupabaseServerClient,
  limite = 6,
): Promise<ActividadDashboard[]> {
  const { data, error } = await supabase.rpc('actividad_reciente', {
    p_limite: limite,
  });

  if (error) {
    console.error('No se pudo cargar la actividad reciente:', error.code);
    return [];
  }

  return ((data ?? []) as ActividadRow[]).map((fila) => ({
    tipo: fila.tipo as TipoActividad,
    entidadId: fila.entidad_id,
    titulo: fila.titulo,
    detalle: fila.detalle,
    estado: fila.estado,
    creadoEn: fila.creado_en,
  }));
}

/**
 * Actividad de la semana actual (lunes a domingo, hora de Guatemala).
 * Cuenta los registros creados en cada una de las cuatro tablas del panel.
 */
export async function obtenerActividadSemanal(
  supabase: SupabaseServerClient,
): Promise<DiaActividad[]> {
  const { hoy, dias, desde, hasta } = rangoSemanaActual();

  const resultados = await Promise.all(
    TABLAS_ACTIVIDAD.map((tabla) =>
      supabase
        .from(tabla)
        .select('creado_en')
        .gte('creado_en', desde)
        .lt('creado_en', hasta),
    ),
  );

  const conteo = new Map(dias.map((dia) => [dia, 0]));

  for (const resultado of resultados) {
    if (resultado.error) {
      console.error(
        'No se pudo calcular la actividad semanal:',
        resultado.error.code,
      );
      continue;
    }

    for (const fila of (resultado.data ?? []) as { creado_en: string }[]) {
      const clave = claveDiaGuatemala(new Date(fila.creado_en));
      if (conteo.has(clave)) {
        conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
      }
    }
  }

  return dias.map((clave, indice) => ({
    clave,
    etiqueta: ETIQUETAS_SEMANA[indice],
    total: conteo.get(clave) ?? 0,
    esHoy: clave === hoy,
  }));
}
