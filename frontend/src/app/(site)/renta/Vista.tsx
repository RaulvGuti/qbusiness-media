'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import RentalCalculator from '@/components/estudio/RentalCalculator';
import ReservaModal, { type ReservaModalData, type ReservaModalForm } from '@/components/estudio/ReservaModal';
import { obtenerSupabase } from '@/lib/supabase/client';
import { enviarSolicitudReservaCliente } from '@/server/services/reservas/clients';
import {
  etiquetaEstadoResena,
  etiquetaEstadoReserva,
} from '@/server/services/resenas';
import type { PerfilUsuario } from '@/types/config';
import type {
  EquipoEstudio,
  PaqueteEstudio,
  ReservaEstudio,
  ServicioEstudio,
} from '@/types/estudio';
import type { ResenaClienteResumen } from '@/types/resenas';

/** Elemento multimedia que vendrá del Gestor de galería (módulo "Renta de estudio"). */
export interface MedioEstudio {
  id: string;
  tipo: 'foto' | 'video' | 'enlace';
  url: string; // foto/video: ruta del archivo · enlace: URL de embed (YouTube/Vimeo)
  titulo?: string;
}

interface VistaProps {
  servicios: ServicioEstudio[];
  equipos: EquipoEstudio[];
  paquetes: PaqueteEstudio[];
  /** Reservas completadas del cliente: desde 5 se aplica el descuento de lealtad. */
  reservasCompletadas: number;
  /** Opcional: si no se pasa, solo se muestran los espacios vacíos. */
  medios?: MedioEstudio[];
  /** Perfil del cliente autenticado; `null` si no ha iniciado sesión o no está registrado. */
  cliente?: PerfilUsuario | null;
  /** Reservas propias del cliente, de la más reciente a la más antigua. */
  reservas?: ReservaEstudio[];
  /** Reseñas propias para indicar qué reservas ya fueron reseñadas. */
  resenasPropias?: ResenaClienteResumen[];
}

const defaultResumen: ReservaModalData = {
  paqueteId: null,
  paqueteNombre: null,
  horas: 0,
  paquetePrecioBase: 0,
  descuento: 0,
  paquetePrecioFinal: 0,
  subtotalServicios: 0,
  subtotalEquipos: 0,
  total: 0,
  serviciosIds: [],
  equipos: [],
};

const MIN_ESPACIOS = 4;

/* ------------------------------------------------------------------ */
/* Espacio para fotos y videos (solo estructura visual)                */
/* ------------------------------------------------------------------ */

function IconoMedia({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m21 16-5-5-9 9" />
    </svg>
  );
}

function GaleriaEstudio({ medios }: { medios: MedioEstudio[] }) {
  const [activo, setActivo] = useState(0);
  const actual = medios[activo];
  const espacios = Math.max(MIN_ESPACIOS, medios.length);

  return (
    <div className="space-y-3">
      {/* Visor principal */}
      <div className="relative w-full aspect-[4/3] rounded-2xl border border-qbBorder bg-qbChalkHover overflow-hidden flex items-center justify-center">
        {!actual && (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-qbMuted">
            <IconoMedia />
            <p className="text-xs font-semibold text-qbInk">Fotos y videos del estudio</p>
            <p className="text-[11px]">Aquí se mostrará lo que se suba en el Gestor de galería.</p>
          </div>
        )}
        {actual?.tipo === 'foto' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={actual.url} alt={actual.titulo ?? 'Estudio'} className="w-full h-full object-contain" />
        )}
        {actual?.tipo === 'video' && (
          <video src={actual.url} controls className="w-full h-full object-contain bg-black" />
        )}
        {actual?.tipo === 'enlace' && (
          <iframe
            src={actual.url}
            title={actual.titulo ?? 'Video del estudio'}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      {/* Miniaturas */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: espacios }).map((_, i) => {
          const m = medios[i];
          return m ? (
            <button
              key={m.id}
              type="button"
              onClick={() => setActivo(i)}
              aria-label={m.titulo ?? `Ver elemento ${i + 1}`}
              className={`aspect-square rounded-xl border overflow-hidden bg-qbChalkHover transition ${
                i === activo ? 'border-qbInk ring-1 ring-qbInk' : 'border-qbBorder hover:border-qbInk/50'
              }`}
            >
              {m.tipo === 'foto' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-qbInk">
                  ▶ Video
                </span>
              )}
            </button>
          ) : (
            <div
              key={`vacio-${i}`}
              className="aspect-square rounded-xl border border-dashed border-qbBorder bg-qbChalkHover/60 flex items-center justify-center text-qbMuted"
            >
              <IconoMedia className="w-5 h-5 opacity-60" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mis reservas                                                        */
/* ------------------------------------------------------------------ */

function MisReservas({
  reservas,
  resenasPropias,
}: {
  reservas: ReservaEstudio[];
  resenasPropias: ResenaClienteResumen[];
}) {
  const resenasPorReserva = new Map(
    resenasPropias
      .filter((resena) => resena.reservaId)
      .map((resena) => [resena.reservaId, resena]),
  );

  if (reservas.length === 0) {
    return (
      <div className="rounded-2xl border border-qbBorder bg-qbChalk p-5 text-sm text-qbMuted">
        Aún no tienes reservas. Usa el resumen de la derecha para solicitar la
        primera.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-qbBorder bg-qbChalk p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-qbInk">Mis reservas</h3>
        <Link
          href="/resenas"
          className="text-xs font-semibold text-qbTerracotta underline-offset-2 hover:underline"
        >
          Ir a reseñas
        </Link>
      </div>

      <ul className="space-y-2">
        {reservas.slice(0, 3).map((reserva) => {
          const resena = resenasPorReserva.get(reserva.id);
          const fecha = new Date(reserva.fechaHoraInicio).toLocaleString(
            "es-GT",
            {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "America/Guatemala",
            },
          );

          return (
            <li
              key={reserva.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-qbBorder/70 px-3 py-2 text-xs"
            >
              <div className="space-y-0.5">
                <p className="font-semibold text-qbInk">{fecha}</p>
                <p className="text-qbMuted">
                  Estado: {etiquetaEstadoReserva(reserva.estado)}
                </p>
              </div>

              {reserva.estado === "completada" ? (
                resena ? (
                  <span className="text-qbMuted">
                    Reseña {etiquetaEstadoResena(resena.estado)}
                  </span>
                ) : (
                  <Link
                    href="/resenas"
                    className="rounded-lg bg-qbTerracotta px-3 py-1.5 font-semibold text-white transition hover:bg-qbTerracotta/90"
                  >
                    Dejar reseña
                  </Link>
                )
              ) : (
                <span className="text-qbMuted">
                  La reseña se habilita al completar
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {reservas.length > 3 && (
        <p className="text-[11px] text-qbMuted">
          Hay {reservas.length - 3} reserva{reservas.length - 3 === 1 ? "" : "s"}{" "}
          más.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vista                                                               */
/* ------------------------------------------------------------------ */

function perfilDesdeSesionUsuario(user: {
  id?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
} | null | undefined): PerfilUsuario | null {
  if (!user?.id) return null;
  const meta = user.user_metadata ?? {};
  const nombre =
    (typeof meta.nombre_completo === 'string' && meta.nombre_completo.trim()) ||
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (user.email ? user.email.split('@')[0] : 'Cliente');
  const telefono =
    typeof meta.telefono === 'string' && meta.telefono.trim()
      ? meta.telefono.trim()
      : user.phone ?? null;

  return {
    id: user.id,
    nombreCompleto: nombre,
    correo: user.email ?? '',
    telefono,
    creadoEn: user.created_at ?? new Date().toISOString(),
  };
}

export function Vista({
  servicios,
  equipos,
  paquetes,
  reservasCompletadas,
  medios = [],
  cliente = null,
  reservas = [],
  resenasPropias = [],
}: VistaProps) {
  const router = useRouter();
  const sinPaquetes = paquetes.length === 0;

  const [pestana, setPestana] = useState<'estudio' | 'equipo'>('estudio');
  const [modalOpen, setModalOpen] = useState(false);
  const [resumen, setResumen] = useState<ReservaModalData>(defaultResumen);
  const [exito, setExito] = useState(false);
  const [clienteSesion, setClienteSesion] = useState<PerfilUsuario | null>(cliente);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;
    try {
      const supabase = obtenerSupabase();
      supabase.auth
        .getSession()
        .then(
          (res: {
            data: {
              session: {
                user?: {
                  id?: string;
                  email?: string;
                  phone?: string;
                  created_at?: string;
                  user_metadata?: Record<string, unknown>;
                };
              } | null;
            };
          }) => {
            const u = res.data.session?.user;
            if (u) {
              setClienteSesion((prev) => prev ?? perfilDesdeSesionUsuario(u));
            } else {
              setClienteSesion(null);
            }
          },
        )
        .catch(() => undefined);

      const { data: listener } = supabase.auth.onAuthStateChange(
        (
          _event: string,
          session: {
            user?: {
              id?: string;
              email?: string;
              phone?: string;
              created_at?: string;
              user_metadata?: Record<string, unknown>;
            };
          } | null,
        ) => {
          if (session?.user) {
            setClienteSesion((prev) => prev ?? perfilDesdeSesionUsuario(session.user));
          } else {
            setClienteSesion(null);
          }
        },
      );
      sub = listener.subscription;
    } catch {
      // Sin variables de entorno de Supabase en build o modo offline
    }
    return () => {
      sub?.unsubscribe();
    };
  }, []);

  const clienteActivo = cliente ?? clienteSesion;
  const usuarioRegistrado = Boolean(clienteActivo?.id);

  const handleClickReservar = () => {
    if (!usuarioRegistrado) {
      router.push('/login?registro=1&next=/renta');
      return;
    }
    if (sinPaquetes || !resumen.paqueteId) {
      return;
    }
    setModalOpen(true);
  };

  const handleReserva = async (form: ReservaModalForm) => {
    if (!usuarioRegistrado) {
      router.push('/login?registro=1&next=/renta');
      return;
    }
    if (!resumen.paqueteId) {
      throw new Error('Selecciona un paquete de renta antes de enviar la solicitud.');
    }
    await enviarSolicitudReservaCliente({
      nombre: form.nombre,
      correo: form.correo,
      telefono: form.telefono,
      fecha: form.fecha,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      paqueteId: resumen.paqueteId,
      notas: form.notas || undefined,
      servicios: resumen.serviciosIds,
      equipos: resumen.equipos,
    });
    setModalOpen(false);
    setExito(true);
    router.refresh();
  };

  return (
    <section className="page-stack">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-qbBorder pb-6">
        <div>
          <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">Espacio Profesional</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">Renta de Estudio y Equipo</h2>
          <p className="text-sm text-qbMuted">Elige un paquete, suma servicios o equipo y solicita tu reserva.</p>
        </div>
      </div>

      <div role="tablist" aria-label="Tipo de renta" className="flex gap-2 border-b border-qbBorder">
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'estudio'}
          onClick={() => setPestana('estudio')}
          className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold transition ${
            pestana === 'estudio'
              ? 'border-qbTerracotta text-qbInk'
              : 'border-transparent text-qbMuted hover:text-qbInk'
          }`}
        >
          Renta de estudio
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'equipo'}
          onClick={() => setPestana('equipo')}
          className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold transition ${
            pestana === 'equipo'
              ? 'border-qbTerracotta text-qbInk'
              : 'border-transparent text-qbMuted hover:text-qbInk'
          }`}
        >
          Renta de equipo
        </button>
      </div>

      {exito && (
        <div className="bg-qbChalk border border-qbSage/40 rounded-3xl p-6 space-y-2 shadow-sm">
          <h3 className="font-bold text-qbInk">Solicitud recibida</h3>
          <p className="text-sm text-qbMuted">
            Hemos registrado tu solicitud de reserva. El equipo te contactará para
            confirmar la disponibilidad. Tu reserva está en estado <strong>pendiente</strong>.
          </p>
        </div>
      )}

      {usuarioRegistrado ? (
        <MisReservas reservas={reservas} resenasPropias={resenasPropias} />
      ) : (
        <div className="rounded-2xl border border-qbBorder bg-qbChalk p-5 text-sm text-qbMuted">
          ¿Ya rentaste el estudio?{" "}
          <Link
            href="/login?next=/renta"
            className="font-semibold text-qbTerracotta underline-offset-2 hover:underline"
          >
            Inicia sesión
          </Link>{" "}
          para ver tus reservas y dejar una reseña.
        </div>
      )}

      {sinPaquetes && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
          La renta aún no tiene paquetes activos. El administrador debe crear al
          menos uno en Textos y configuración → Renta de Estudio. Mientras tanto
          no se pueden recibir reservas.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {pestana === 'estudio' ? (
            <div className="bg-qbChalk border border-qbBorder rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
              <GaleriaEstudio medios={medios} />

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-qbInk">Descripción del estudio</h3>
                <p className="text-sm text-qbMuted leading-relaxed">
                  Estudio profesional en Quetzaltenango ideal para grabación de video, podcast, fotografía comercial y contenido para redes. Ambiente controlado con iluminación, acústica y equipamiento disponible bajo demanda.
                </p>
                <ul className="grid grid-cols-1 gap-2 text-sm text-qbMuted">
                  <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Iluminación profesional</span></li>
                  <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Acústica tratada</span></li>
                  <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Ciclorama / Fondos</span></li>
                  <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Paquetes con horas fijas</span></li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-qbChalk border border-qbBorder rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-qbInk">Equipo para tu producción</h3>
              <p className="text-sm text-qbMuted leading-relaxed">
                Suma cámaras, luces, audio y accesorios a tu paquete de renta. El
                precio de cada equipo se cobra por hora, durante las horas del
                paquete que elijas.
              </p>
              <ul className="grid grid-cols-1 gap-2 text-sm text-qbMuted">
                <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Solo se muestran equipos activos y disponibles</span></li>
                <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Cantidad limitada por el stock real</span></li>
                <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Se confirma junto con la reserva del salón</span></li>
              </ul>
            </div>
          )}

          <RentalCalculator
            key={pestana}
            paquetes={paquetes}
            servicios={servicios}
            equipos={equipos}
            reservasCompletadas={reservasCompletadas}
            modo={pestana}
            onResumenChange={setResumen}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-qbChalk border border-qbBorder rounded-3xl p-6 space-y-4 shadow-sm lg:sticky lg:top-6">
            <h3 className="text-lg font-bold text-qbInk">Resumen</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-qbMuted">Paquete</dt><dd className="font-medium text-qbInk">{resumen.paqueteNombre ?? 'Selecciona uno'}</dd></div>
              <div className="flex justify-between"><dt className="text-qbMuted">Horas</dt><dd className="font-medium text-qbInk">{resumen.horas}h</dd></div>
              <div className="flex justify-between"><dt className="text-qbMuted">Precio del paquete</dt><dd className="font-medium text-qbInk">Q{resumen.paquetePrecioFinal.toFixed(2)}</dd></div>
              {resumen.descuento > 0 && (
                <div className="flex justify-between text-qbSage"><dt>Descuento de lealtad (25%)</dt><dd className="font-semibold">-Q{resumen.descuento.toFixed(2)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-qbMuted">Servicios extra</dt><dd className="font-medium text-qbInk">Q{resumen.subtotalServicios.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-qbMuted">Equipo rentable</dt><dd className="font-medium text-qbInk">Q{resumen.subtotalEquipos.toFixed(2)}</dd></div>
              <div className="flex justify-between border-t border-qbBorder pt-2 mt-1"><dt className="font-bold text-qbInk">Total estimado</dt><dd className="text-lg font-extrabold text-qbInk">Q{resumen.total.toFixed(2)}</dd></div>
            </dl>
            <button
              type="button"
              onClick={handleClickReservar}
              disabled={sinPaquetes || !resumen.paqueteId}
              className="w-full mt-2 px-4 py-2 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Icon name={usuarioRegistrado ? "calendar" : "lock"} className="mr-2" />
              {usuarioRegistrado ? "Solicitar reserva" : "Regístrate para reservar"}
            </button>
            {!usuarioRegistrado && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
                Debes tener una cuenta registrada e iniciar sesión para solicitar una reserva del estudio.
              </p>
            )}
            <p className="text-[11px] text-qbMuted text-center">* Estimado sujeto a validación de disponibilidad.</p>
          </div>
        </div>
      </div>

      <ReservaModal
        key={clienteActivo?.id ?? 'anon'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        resumen={resumen}
        cliente={clienteActivo}
        onSubmit={handleReserva}
      />
    </section>
  );
}
