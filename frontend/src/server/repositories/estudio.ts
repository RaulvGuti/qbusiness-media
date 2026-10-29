'use server';

import { createSupabaseServerClient } from '@/server/supabase/server';
import type { PerfilUsuario } from '@/types/config';
import type {
  ConfiguracionEstudio,
  EquipoEstudio,
  EstadoPagoReserva,
  EstadoReserva,
  FechaBloqueada,
  HorarioOcupado,
  ReservaEquipo,
  ReservaEstudio,
  ReservaServicio,
  ServicioEstudio,
  SolicitarReservaInput,
} from '@/types/estudio';
import {
  equiposMock,
  fechasBloqueadasMock,
  horariosOcupadosMock,
  reservasMock,
  reservaEquiposMock,
  reservaServiciosMock,
  serviciosMock,
} from './datos-mock';

/**
 * Verifica si el entorno tiene credenciales reales de Supabase configuradas.
 * Si aún tiene los valores de ejemplo de `.env.example` o está vacío, el
 * repositorio usa los datos mock como respaldo para no romper `npm run build`.
 */
function tieneConexionSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return (
    Boolean(url && anonKey) &&
    !url.includes('tu-proyecto.supabase.co') &&
    anonKey !== 'tu-anon-key-publica'
  );
}

/* ==========================================================================
 * Control de concurrencia, idempotencia y normalización de errores de BD
 * ========================================================================== */

let colaCalendario: Promise<unknown> = Promise.resolve();
const solicitudesEnVuelo = new Map<string, number>();
const VENTANA_IDEMPOTENCIA_MS = 5000;

/**
 * Serializa operaciones de escritura sobre el calendario del salón para
 * impedir condiciones de carrera entre dos peticiones simultáneas en el
 * mismo proceso antes de llegar a la restricción GiST de PostgreSQL.
 */
async function ejecutarEnSeccionCriticaCalendario<T>(
  tarea: () => Promise<T>,
): Promise<T> {
  const ejecucion = colaCalendario.then(() => tarea());
  colaCalendario = ejecucion.catch(() => undefined);
  return ejecucion;
}

/**
 * Impide que el mismo cliente envíe dos veces seguidas la misma solicitud
 * en paralelo (por ejemplo, doble clic en el botón de reservar).
 */
function verificarYRegistrarIdempotencia(huella: string): () => void {
  const ahora = Date.now();
  for (const [k, ts] of solicitudesEnVuelo.entries()) {
    if (ahora - ts > VENTANA_IDEMPOTENCIA_MS) {
      solicitudesEnVuelo.delete(k);
    }
  }

  const ultimoEnvio = solicitudesEnVuelo.get(huella);
  if (ultimoEnvio && ahora - ultimoEnvio <= VENTANA_IDEMPOTENCIA_MS) {
    throw new Error(
      'Tu solicitud ya se está procesando. Espera unos segundos antes de volver a intentarlo.',
    );
  }

  solicitudesEnVuelo.set(huella, ahora);
  return () => {
    solicitudesEnVuelo.delete(huella);
  };
}

/**
 * Traduce errores internos de PostgreSQL (como `23P01` exclusion_violation
 * cuando dos clientes reservan en el mismo milisegundo) a mensajes seguros
 * y legibles para el usuario sin exponer detalles internos del esquema.
 */
function normalizarErrorReserva(
  error: { code?: string; message?: string } | null | undefined,
  mensajePorDefecto = 'No se pudo procesar la operación de reserva.',
): Error {
  if (!error) return new Error(mensajePorDefecto);

  const codigo = error.code ?? '';
  const mensaje = (error.message ?? '').trim();

  if (
    codigo === '23P01' ||
    mensaje.includes('reservas_fecha_hora_inicio_fecha_hora_fin_excl') ||
    mensaje.includes('conflicting key value violates exclusion constraint')
  ) {
    return new Error(
      'Ese horario acaba de ser reservado por otra persona. Por favor elige otro horario.',
    );
  }

  if (codigo === '42501' || mensaje.includes('row-level security policy')) {
    return new Error(
      'No tienes permisos suficientes o tu sesión expiró para realizar esta acción.',
    );
  }

  return new Error(mensaje || mensajePorDefecto);
}

function construirIsoGuatemala(fecha: string, hora: string): string {
  const h = hora.slice(0, 5);
  return `${fecha}T${h}:00-06:00`;
}

function intervalosSeTraslapan(
  inicioA: string,
  finA: string,
  inicioB: string,
  finB: string,
): boolean {
  const a0 = new Date(inicioA).getTime();
  const a1 = new Date(finA).getTime();
  const b0 = new Date(inicioB).getTime();
  const b1 = new Date(finB).getTime();
  if (Number.isNaN(a0) || Number.isNaN(a1) || Number.isNaN(b0) || Number.isNaN(b1)) {
    return false;
  }
  return a0 < b1 && b0 < a1;
}

function expandirBloqueosEnRango(
  bloqueos: FechaBloqueada[],
  desde: string,
  hasta: string,
): HorarioOcupado[] {
  const resultado: HorarioOcupado[] = [];
  for (const b of bloqueos) {
    const inicioFecha = b.desde > desde ? b.desde : desde;
    const finFecha = b.hasta < hasta ? b.hasta : hasta;
    if (finFecha < inicioFecha) continue;

    const cursor = new Date(`${inicioFecha}T00:00:00Z`);
    const limite = new Date(`${finFecha}T00:00:00Z`);

    while (cursor <= limite) {
      const dia = cursor.toISOString().slice(0, 10);
      const hIni = b.horaDesde ? b.horaDesde.slice(0, 5) : '00:00';
      const inicioIso = construirIsoGuatemala(dia, hIni);
      const finIso = b.horaHasta
        ? construirIsoGuatemala(dia, b.horaHasta.slice(0, 5))
        : `${dia}T23:59:59-06:00`;

      resultado.push({
        inicio: inicioIso,
        fin: finIso,
        tipo: 'BLOQUEO',
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return resultado;
}

/* ==========================================================================
 * Filas SQL (snake_case) y mapeadores a tipos del dominio (camelCase)
 * ========================================================================== */

interface ServicioRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_por_hora: number | string;
  activo: boolean;
}

interface EquipoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  cantidad_total: number;
  precio_por_hora: number | string;
  activo: boolean;
}

interface ReservaRow {
  id: string;
  cliente_id: string | null;
  creado_por: string | null;
  nombre: string;
  correo: string;
  telefono: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: EstadoReserva;
  estado_pago: EstadoPagoReserva;
  total_calculado: number | string | null;
  tarifa_hora_aplicada: number | string | null;
  url_comprobante_pago: string | null;
  notas_cliente: string | null;
  creado_en: string;
}

interface ReservaServicioRow {
  reserva_id: string;
  servicio_id: string;
  precio_congelado: number | string;
  servicios_estudio?: { nombre: string } | { nombre: string }[] | null;
}

interface ReservaEquipoRow {
  reserva_id: string;
  equipo_id: string;
  cantidad_rentada: number;
  precio_congelado: number | string;
  inventario_equipos?: { nombre: string } | { nombre: string }[] | null;
}

interface FechaBloqueadaRow {
  id: string;
  desde: string;
  hasta: string;
  hora_desde: string | null;
  hora_hasta: string | null;
  motivo: string | null;
  creado_por: string;
  creado_en: string;
}

interface ConfiguracionRow {
  clave: string;
  valor: string | null;
}

interface ClienteRow {
  id: string;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  creado_en: string;
}

interface HorarioOcupadoRow {
  inicio: string;
  fin: string;
  tipo: 'RESERVA' | 'BLOQUEO';
}

function mapearServicio(row: ServicioRow): ServicioEstudio {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? null,
    precioPorHora: Number(row.precio_por_hora),
    activo: Boolean(row.activo),
  };
}

function mapearEquipo(row: EquipoRow): EquipoEstudio {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? null,
    cantidadTotal: Number(row.cantidad_total),
    precioPorHora: Number(row.precio_por_hora),
    activo: Boolean(row.activo),
  };
}

function mapearReserva(row: ReservaRow): ReservaEstudio {
  return {
    id: row.id,
    clienteId: row.cliente_id ?? null,
    creadoPor: row.creado_por ?? null,
    nombre: row.nombre,
    correo: row.correo,
    telefono: row.telefono,
    fechaHoraInicio: row.fecha_hora_inicio,
    fechaHoraFin: row.fecha_hora_fin,
    estado: row.estado,
    estadoPago: row.estado_pago,
    totalCalculado:
      row.total_calculado !== null && row.total_calculado !== undefined
        ? Number(row.total_calculado)
        : null,
    tarifaHoraAplicada:
      row.tarifa_hora_aplicada !== null && row.tarifa_hora_aplicada !== undefined
        ? Number(row.tarifa_hora_aplicada)
        : null,
    urlComprobantePago: row.url_comprobante_pago ?? null,
    notasCliente: row.notas_cliente ?? null,
    creadoEn: row.creado_en,
  };
}

function mapearReservaServicio(row: ReservaServicioRow): ReservaServicio {
  const rel = Array.isArray(row.servicios_estudio)
    ? row.servicios_estudio[0]
    : row.servicios_estudio;
  return {
    reservaId: row.reserva_id,
    servicioId: row.servicio_id,
    precioCongelado: Number(row.precio_congelado),
    nombreServicio: rel?.nombre,
  };
}

function mapearReservaEquipo(row: ReservaEquipoRow): ReservaEquipo {
  const rel = Array.isArray(row.inventario_equipos)
    ? row.inventario_equipos[0]
    : row.inventario_equipos;
  return {
    reservaId: row.reserva_id,
    equipoId: row.equipo_id,
    cantidadRentada: Number(row.cantidad_rentada),
    precioCongelado: Number(row.precio_congelado),
    nombreEquipo: rel?.nombre,
  };
}

function mapearFechaBloqueada(row: FechaBloqueadaRow): FechaBloqueada {
  return {
    id: row.id,
    desde: row.desde,
    hasta: row.hasta,
    horaDesde: row.hora_desde ?? null,
    horaHasta: row.hora_hasta ?? null,
    motivo: row.motivo ?? null,
    creadoPor: row.creado_por,
    creadoEn: row.creado_en,
  };
}

function mapearConfiguracionEstudio(filas: ConfiguracionRow[]): ConfiguracionEstudio {
  const mapa = new Map(filas.map((f) => [f.clave, f.valor]));
  const tarifaRaw = mapa.get('tarifa_hora');
  const tarifaNum =
    tarifaRaw !== undefined && tarifaRaw !== null && tarifaRaw.trim() !== ''
      ? Number(tarifaRaw)
      : null;
  const maxPendRaw = Number(mapa.get('max_pendientes_por_cliente'));

  return {
    tarifaHora: tarifaNum !== null && Number.isFinite(tarifaNum) ? tarifaNum : null,
    maxPendientesPorCliente:
      Number.isFinite(maxPendRaw) && maxPendRaw > 0 ? maxPendRaw : 3,
    horaApertura: mapa.get('hora_apertura') || '08:00',
    horaCierre: mapa.get('hora_cierre') || '18:00',
  };
}

function mapearCliente(row: ClienteRow): PerfilUsuario {
  return {
    id: row.id,
    nombreCompleto: row.nombre_completo,
    correo: row.correo,
    telefono: row.telefono ?? null,
    creadoEn: row.creado_en,
  };
}

/* ==========================================================================
 * Consultas y mutaciones del repositorio de estudio
 * ========================================================================== */

/**
 * Obtiene el perfil del cliente autenticado en la sesión actual.
 * Devuelve `null` si no hay sesión activa o si el usuario no está registrado
 * en la tabla `clientes` (000012 / 000013).
 */
export async function obtenerPerfilClienteActual(): Promise<PerfilUsuario | null> {
  if (!tieneConexionSupabase()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: fila, error } = await supabase
    .from('clientes')
    .select('id, nombre_completo, correo, telefono, creado_en')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !fila) {
    return null;
  }

  return mapearCliente(fila as ClienteRow);
}

export async function listarServiciosActivos(): Promise<ServicioEstudio[]> {
  if (!tieneConexionSupabase()) {
    return serviciosMock.filter((s) => s.activo);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('servicios_estudio')
    .select('id, nombre, descripcion, precio_por_hora, activo')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) {
    throw normalizarErrorReserva(error, 'No se pudieron cargar los servicios activos.');
  }

  return ((data ?? []) as ServicioRow[]).map(mapearServicio);
}

export async function listarEquiposActivos(): Promise<EquipoEstudio[]> {
  if (!tieneConexionSupabase()) {
    return equiposMock.filter((e) => e.activo);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inventario_equipos')
    .select('id, nombre, descripcion, cantidad_total, precio_por_hora, activo')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) {
    throw normalizarErrorReserva(error, 'No se pudieron cargar los equipos activos.');
  }

  return ((data ?? []) as EquipoRow[]).map(mapearEquipo);
}

export async function listarReservas(): Promise<ReservaEstudio[]> {
  if (!tieneConexionSupabase()) {
    return [...reservasMock];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .order('fecha_hora_inicio', { ascending: false });

  if (error) {
    throw normalizarErrorReserva(error, 'No se pudieron listar las reservas.');
  }

  return ((data ?? []) as ReservaRow[]).map(mapearReserva);
}

export async function listarReservasDeCliente(clienteId: string): Promise<ReservaEstudio[]> {
  if (!tieneConexionSupabase()) {
    return reservasMock.filter((r) => r.clienteId === clienteId);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('fecha_hora_inicio', { ascending: false });

  if (error) {
    throw normalizarErrorReserva(error, 'No se pudieron obtener las reservas del cliente.');
  }

  return ((data ?? []) as ReservaRow[]).map(mapearReserva);
}

export async function listarServiciosDeReserva(reservaId: string): Promise<ReservaServicio[]> {
  if (!tieneConexionSupabase()) {
    return reservaServiciosMock.filter((rs) => rs.reservaId === reservaId);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reserva_servicios')
    .select('reserva_id, servicio_id, precio_congelado, servicios_estudio(nombre)')
    .eq('reserva_id', reservaId);

  if (error) {
    throw normalizarErrorReserva(error, 'No se pudieron obtener los servicios de la reserva.');
  }

  return ((data ?? []) as ReservaServicioRow[]).map(mapearReservaServicio);
}

export async function listarEquiposDeReserva(reservaId: string): Promise<ReservaEquipo[]> {
  if (!tieneConexionSupabase()) {
    return reservaEquiposMock.filter((re) => re.reservaId === reservaId);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reserva_equipos')
    .select('reserva_id, equipo_id, cantidad_rentada, precio_congelado, inventario_equipos(nombre)')
    .eq('reserva_id', reservaId);

  if (error) {
    throw normalizarErrorReserva(error, 'No se pudieron obtener los equipos de la reserva.');
  }

  return ((data ?? []) as ReservaEquipoRow[]).map(mapearReservaEquipo);
}

export async function obtenerConfiguracionEstudio(): Promise<ConfiguracionEstudio> {
  if (!tieneConexionSupabase()) {
    return {
      tarifaHora: 500,
      maxPendientesPorCliente: 3,
      horaApertura: '08:00',
      horaCierre: '18:00',
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('configuracion_sitio')
    .select('clave, valor')
    .eq('grupo', 'estudio');

  if (error) {
    throw normalizarErrorReserva(error, 'No se pudo cargar la configuración del estudio.');
  }

  return mapearConfiguracionEstudio((data ?? []) as ConfiguracionRow[]);
}

/**
 * RPC horarios_ocupados(p_desde date, p_hasta date) → TABLE(inicio, fin, tipo).
 * Devuelve solo horarios y tipo (RESERVA o BLOQUEO), sin datos personales.
 */
export async function obtenerHorariosOcupados(
  desde: string,
  hasta: string,
): Promise<HorarioOcupado[]> {
  if (!tieneConexionSupabase()) {
    const inicioRango = construirIsoGuatemala(desde, '00:00');
    const finRango = `${hasta}T23:59:59-06:00`;

    const deReservas: HorarioOcupado[] = reservasMock
      .filter(
        (r) =>
          r.estado !== 'cancelada' &&
          intervalosSeTraslapan(r.fechaHoraInicio, r.fechaHoraFin, inicioRango, finRango),
      )
      .map((r) => ({
        inicio: r.fechaHoraInicio,
        fin: r.fechaHoraFin,
        tipo: 'RESERVA' as const,
      }));

    const deBloqueos = expandirBloqueosEnRango(fechasBloqueadasMock, desde, hasta);
    const estaticos = horariosOcupadosMock.filter((h) =>
      intervalosSeTraslapan(h.inicio, h.fin, inicioRango, finRango),
    );

    return [...deReservas, ...deBloqueos, ...estaticos];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('horarios_ocupados', {
    p_desde: desde,
    p_hasta: hasta,
  });

  if (error) {
    throw normalizarErrorReserva(error, 'No se pudieron consultar los horarios ocupados.');
  }

  return ((data ?? []) as HorarioOcupadoRow[]).map((row) => ({
    inicio: row.inicio,
    fin: row.fin,
    tipo: row.tipo,
  }));
}

/**
 * RPC solicitar_reserva(p_nombre, p_correo, p_telefono, p_fecha, p_hora_inicio,
 *   p_hora_fin, p_notas, p_servicios uuid[], p_equipos jsonb) → uuid.
 * Serializa peticiones concurrentes mediante `ejecutarEnSeccionCriticaCalendario`,
 * aplica control de idempotencia y traduce conflictos GiST `23P01`.
 */
export async function solicitarReserva(input: SolicitarReservaInput): Promise<string> {
  const huella = `${input.correo.trim().toLowerCase()}|${input.fecha}|${input.horaInicio.slice(0, 5)}|${input.horaFin.slice(0, 5)}`;
  const liberarIdempotencia = verificarYRegistrarIdempotencia(huella);

  try {
    return await ejecutarEnSeccionCriticaCalendario(async () => {
      if (!tieneConexionSupabase()) {
        const inicioIso = construirIsoGuatemala(input.fecha, input.horaInicio);
        const finIso = construirIsoGuatemala(input.fecha, input.horaFin);

        const ocupados = await obtenerHorariosOcupados(input.fecha, input.fecha);
        const hayChoque = ocupados.some((o) =>
          intervalosSeTraslapan(inicioIso, finIso, o.inicio, o.fin),
        );
        if (hayChoque) {
          throw new Error('Ese horario ya está reservado o bloqueado.');
        }

        const config = await obtenerConfiguracionEstudio();
        const tarifaHora = config.tarifaHora ?? 0;
        if (tarifaHora <= 0) {
          throw new Error('La tarifa por hora aún no está configurada.');
        }

        // Validar servicios activos
        const serviciosUnicos = Array.from(new Set(input.servicios));
        const serviciosValidos = serviciosUnicos.map((sId) => {
          const srv = serviciosMock.find((s) => s.id === sId && s.activo);
          if (!srv) {
            throw new Error('Alguno de los servicios seleccionados no existe o no está disponible.');
          }
          return srv;
        });

        // Agrupar y validar stock de equipos
        const cantidadesPorEquipo = new Map<string, number>();
        for (const item of input.equipos) {
          if (!item.equipoId || !Number.isInteger(item.cantidad) || item.cantidad <= 0) {
            throw new Error('Cada equipo debe indicar una cantidad entera mayor a 0.');
          }
          cantidadesPorEquipo.set(
            item.equipoId,
            (cantidadesPorEquipo.get(item.equipoId) ?? 0) + item.cantidad,
          );
        }

        const equiposValidos = Array.from(cantidadesPorEquipo.entries()).map(
          ([eqId, cantidad]) => {
            const eq = equiposMock.find((e) => e.id === eqId && e.activo);
            if (!eq || cantidad > eq.cantidadTotal) {
              throw new Error(
                'Alguno de los equipos seleccionados no está disponible o supera el stock.',
              );
            }
            return { equipo: eq, cantidad };
          },
        );

        const horas =
          (new Date(finIso).getTime() - new Date(inicioIso).getTime()) / 3_600_000;
        const sumaServicios = serviciosValidos.reduce((acc, s) => acc + s.precioPorHora, 0);
        const sumaEquipos = equiposValidos.reduce(
          (acc, e) => acc + e.equipo.precioPorHora * e.cantidad,
          0,
        );
        const totalCalculado =
          Math.round((tarifaHora + sumaServicios + sumaEquipos) * horas * 100) / 100;

        const id = `reserva-${Date.now()}`;
        reservasMock.unshift({
          id,
          clienteId: 'cli-mock',
          creadoPor: null,
          nombre: input.nombre.trim(),
          correo: input.correo.trim(),
          telefono: input.telefono.trim(),
          fechaHoraInicio: inicioIso,
          fechaHoraFin: finIso,
          estado: 'pendiente',
          estadoPago: 'pendiente',
          totalCalculado,
          tarifaHoraAplicada: tarifaHora,
          urlComprobantePago: null,
          notasCliente: input.notas?.trim() || null,
          creadoEn: new Date().toISOString(),
        });

        for (const srv of serviciosValidos) {
          reservaServiciosMock.push({
            reservaId: id,
            servicioId: srv.id,
            precioCongelado: srv.precioPorHora,
            nombreServicio: srv.nombre,
          });
        }

        for (const { equipo, cantidad } of equiposValidos) {
          reservaEquiposMock.push({
            reservaId: id,
            equipoId: equipo.id,
            cantidadRentada: cantidad,
            precioCongelado: equipo.precioPorHora,
            nombreEquipo: equipo.nombre,
          });
        }

        return id;
      }

      const supabase = await createSupabaseServerClient();
      const equiposJsonb = input.equipos.map((e) => ({
        equipo_id: e.equipoId,
        cantidad: e.cantidad,
      }));

      const { data, error } = await supabase.rpc('solicitar_reserva', {
        p_nombre: input.nombre,
        p_correo: input.correo,
        p_telefono: input.telefono,
        p_fecha: input.fecha,
        p_hora_inicio: input.horaInicio,
        p_hora_fin: input.horaFin,
        p_notas: input.notas ?? null,
        p_servicios: input.servicios,
        p_equipos: equiposJsonb,
      });

      if (error) {
        throw normalizarErrorReserva(
          error,
          'No se pudo completar la solicitud de reserva.',
        );
      }

      return String(data);
    });
  } finally {
    liberarIdempotencia();
  }
}

export async function actualizarEstadoReserva(
  id: string,
  estado: EstadoReserva,
): Promise<void> {
  return ejecutarEnSeccionCriticaCalendario(async () => {
    if (!tieneConexionSupabase()) {
      const reserva = reservasMock.find((r) => r.id === id);
      if (!reserva) {
        throw new Error('No se encontró la reserva solicitada.');
      }

      if (estado === 'pendiente' || estado === 'confirmada') {
        const traslapeReserva = reservasMock.some(
          (r) =>
            r.id !== id &&
            r.estado !== 'cancelada' &&
            intervalosSeTraslapan(
              reserva.fechaHoraInicio,
              reserva.fechaHoraFin,
              r.fechaHoraInicio,
              r.fechaHoraFin,
            ),
        );
        if (traslapeReserva) {
          throw new Error('Ese horario ya está reservado por otra solicitud activa.');
        }

        const fechaDia = reserva.fechaHoraInicio.slice(0, 10);
        const bloqueosDia = expandirBloqueosEnRango(
          fechasBloqueadasMock,
          fechaDia,
          fechaDia,
        );
        const traslapeBloqueo = bloqueosDia.some((b) =>
          intervalosSeTraslapan(
            reserva.fechaHoraInicio,
            reserva.fechaHoraFin,
            b.inicio,
            b.fin,
          ),
        );
        if (traslapeBloqueo) {
          throw new Error('Ese horario no está disponible porque tiene una fecha bloqueada.');
        }
      }

      reserva.estado = estado;
      return;
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from('reservas')
      .update({ estado })
      .eq('id', id);

    if (error) {
      throw normalizarErrorReserva(
        error,
        'No se pudo actualizar el estado de la reserva.',
      );
    }
  });
}

export async function actualizarEstadoPagoReserva(
  id: string,
  estadoPago: EstadoPagoReserva,
): Promise<void> {
  if (!tieneConexionSupabase()) {
    const reserva = reservasMock.find((r) => r.id === id);
    if (reserva) reserva.estadoPago = estadoPago;
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('reservas')
    .update({ estado_pago: estadoPago })
    .eq('id', id);

  if (error) {
    throw normalizarErrorReserva(
      error,
      'No se pudo actualizar el estado de pago de la reserva.',
    );
  }
}

export async function cancelarReservaDeCliente(id: string): Promise<void> {
  if (!tieneConexionSupabase()) {
    const reserva = reservasMock.find((r) => r.id === id);
    if (reserva) reserva.estado = 'cancelada';
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('reservas')
    .update({ estado: 'cancelada' })
    .eq('id', id);

  if (error) {
    throw normalizarErrorReserva(error, 'No se pudo cancelar la reserva.');
  }
}

export async function subirComprobantePagoDeCliente(
  id: string,
  urlComprobantePago: string,
): Promise<void> {
  if (!tieneConexionSupabase()) {
    const reserva = reservasMock.find((r) => r.id === id);
    if (reserva) {
      reserva.urlComprobantePago = urlComprobantePago;
      reserva.estadoPago = 'comprobante_subido';
    }
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('reservas')
    .update({
      url_comprobante_pago: urlComprobantePago,
      estado_pago: 'comprobante_subido',
    })
    .eq('id', id);

  if (error) {
    throw normalizarErrorReserva(
      error,
      'No se pudo registrar el comprobante de pago.',
    );
  }
}

/** Clientes que el trigger limitar_pendientes_por_cliente cuenta como pendientes. */
export async function contarPendientesDeCliente(clienteId: string): Promise<number> {
  if (!tieneConexionSupabase()) {
    return reservasMock.filter(
      (r) =>
        r.clienteId === clienteId &&
        r.estado === 'pendiente' &&
        new Date(r.fechaHoraFin) > new Date(),
    ).length;
  }

  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from('reservas')
    .select('id', { count: 'exact', head: true })
    .eq('cliente_id', clienteId)
    .eq('estado', 'pendiente')
    .gt('fecha_hora_fin', new Date().toISOString());

  if (error) {
    throw normalizarErrorReserva(
      error,
      'No se pudo contar las reservas pendientes del cliente.',
    );
  }

  return count ?? 0;
}

/* ---------------------- fechas_bloqueadas (000017) ---------------------- */

export async function listarFechasBloqueadas(): Promise<FechaBloqueada[]> {
  if (!tieneConexionSupabase()) {
    return [...fechasBloqueadasMock];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('fechas_bloqueadas')
    .select('*')
    .order('desde', { ascending: true });

  if (error) {
    throw normalizarErrorReserva(
      error,
      'No se pudieron listar las fechas bloqueadas.',
    );
  }

  return ((data ?? []) as FechaBloqueadaRow[]).map(mapearFechaBloqueada);
}

export async function crearFechaBloqueada(
  datos: Omit<FechaBloqueada, 'id' | 'creadoEn' | 'creadoPor'> & { creadoPor?: string },
): Promise<FechaBloqueada> {
  return ejecutarEnSeccionCriticaCalendario(async () => {
    const intervalosPropuestos = expandirBloqueosEnRango(
      [
        {
          id: 'propuesto',
          desde: datos.desde,
          hasta: datos.hasta,
          horaDesde: datos.horaDesde ?? null,
          horaHasta: datos.horaHasta ?? null,
          motivo: datos.motivo ?? null,
          creadoPor: datos.creadoPor ?? 'admin-0001',
          creadoEn: new Date().toISOString(),
        },
      ],
      datos.desde,
      datos.hasta,
    );

    if (!tieneConexionSupabase()) {
      const reservasEnConflicto = reservasMock.filter(
        (r) =>
          (r.estado === 'pendiente' || r.estado === 'confirmada') &&
          intervalosPropuestos.some((b) =>
            intervalosSeTraslapan(r.fechaHoraInicio, r.fechaHoraFin, b.inicio, b.fin),
          ),
      );

      if (reservasEnConflicto.length > 0) {
        throw new Error(
          `No se puede bloquear ese horario porque choca con ${reservasEnConflicto.length} reserva(s) activa(s). Cancela o reprograma la reserva primero.`,
        );
      }

      const nueva: FechaBloqueada = {
        id: `bloqueo-${Date.now()}`,
        desde: datos.desde,
        hasta: datos.hasta,
        horaDesde: datos.horaDesde ?? null,
        horaHasta: datos.horaHasta ?? null,
        motivo: datos.motivo ?? null,
        creadoPor: datos.creadoPor ?? 'admin-0001',
        creadoEn: new Date().toISOString(),
      };
      fechasBloqueadasMock.push(nueva);
      return nueva;
    }

    const supabase = await createSupabaseServerClient();
    let creadoPor = datos.creadoPor;

    if (!creadoPor) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user?.id) {
        throw new Error('Debes iniciar sesión como administrador para bloquear fechas.');
      }
      creadoPor = authData.user.id;
    }

    const inicioBusqueda = construirIsoGuatemala(datos.desde, '00:00');
    const finBusqueda = `${datos.hasta}T23:59:59-06:00`;

    const { data: reservasActivas, error: errReservas } = await supabase
      .from('reservas')
      .select('id, fecha_hora_inicio, fecha_hora_fin, estado')
      .in('estado', ['pendiente', 'confirmada'])
      .lt('fecha_hora_inicio', finBusqueda)
      .gt('fecha_hora_fin', inicioBusqueda);

    if (errReservas) {
      throw normalizarErrorReserva(
        errReservas,
        'No se pudieron verificar las reservas activas antes de crear el bloqueo.',
      );
    }

    const conflictos = (reservasActivas ?? []).filter((r) =>
      intervalosPropuestos.some((b) =>
        intervalosSeTraslapan(
          String(r.fecha_hora_inicio),
          String(r.fecha_hora_fin),
          b.inicio,
          b.fin,
        ),
      ),
    );

    if (conflictos.length > 0) {
      throw new Error(
        `No se puede bloquear ese horario porque choca con ${conflictos.length} reserva(s) activa(s) (pendiente o confirmada). Cancela o reprograma la reserva primero.`,
      );
    }

    const { data, error } = await supabase
      .from('fechas_bloqueadas')
      .insert({
        desde: datos.desde,
        hasta: datos.hasta,
        hora_desde: datos.horaDesde || null,
        hora_hasta: datos.horaHasta || null,
        motivo: datos.motivo || null,
        creado_por: creadoPor,
      })
      .select('*')
      .single();

    if (error) {
      throw normalizarErrorReserva(error, 'No se pudo crear la fecha bloqueada.');
    }

    return mapearFechaBloqueada(data as FechaBloqueadaRow);
  });
}

export async function eliminarFechaBloqueada(id: string): Promise<void> {
  if (!tieneConexionSupabase()) {
    const idx = fechasBloqueadasMock.findIndex((f) => f.id === id);
    if (idx >= 0) fechasBloqueadasMock.splice(idx, 1);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('fechas_bloqueadas')
    .delete()
    .eq('id', id);

  if (error) {
    throw normalizarErrorReserva(error, 'No se pudo eliminar la fecha bloqueada.');
  }
}
