'use client';

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import RentalCalculator from '@/components/estudio/RentalCalculator';
import ReservaModal, { type ReservaModalData, type ReservaModalForm } from '@/components/estudio/ReservaModal';
import { enviarSolicitudReservaCliente } from '@/server/services/reservas/clients';
import type { EquipoEstudio, ServicioEstudio } from '@/types/estudio';

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
  tarifaHora: number | null;
  /** Opcional: si no se pasa, solo se muestran los espacios vacíos. */
  medios?: MedioEstudio[];
}

const defaultResumen: ReservaModalData = {
  horas: 2,
  tarifaBase: 0,
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
/* Vista                                                               */
/* ------------------------------------------------------------------ */

export function Vista({ servicios, equipos, tarifaHora, medios = [] }: VistaProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [resumen, setResumen] = useState<ReservaModalData>(defaultResumen);
  const [exito, setExito] = useState(false);

  const tarifa = tarifaHora ?? 0;
  const sinTarifa = tarifaHora === null || tarifaHora <= 0;

  const handleReserva = async (form: ReservaModalForm) => {
    await enviarSolicitudReservaCliente({
      nombre: form.nombre,
      correo: form.correo,
      telefono: form.telefono,
      fecha: form.fecha,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      notas: form.notas || undefined,
      servicios: resumen.serviciosIds,
      equipos: resumen.equipos,
    });
    setModalOpen(false);
    setExito(true);
  };

  return (
    <section className="page-stack">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-qbBorder pb-6">
        <div>
          <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">Espacio Profesional</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">Renta de Estudio</h2>
          <p className="text-sm text-qbMuted">Espacio equipado, flexible por horas. Calcula tu renta y solicita reserva.</p>
        </div>
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

      {sinTarifa && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
          La tarifa base del salón aún no está configurada
          (configuracion_sitio · estudio · tarifa_hora). Las reservas no podrán
          completarse hasta que se defina.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Galería (izquierda) + descripción (derecha) */}
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
                <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Acceso flexible por horas</span></li>
              </ul>
            </div>
          </div>

          <RentalCalculator
            servicios={servicios}
            equipos={equipos}
            tarifaHoraBase={tarifa}
            onResumenChange={setResumen}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-qbChalk border border-qbBorder rounded-3xl p-6 space-y-4 shadow-sm lg:sticky lg:top-6">
            <h3 className="text-lg font-bold text-qbInk">Resumen</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-qbMuted">Horas</dt><dd className="font-medium text-qbInk">{resumen.horas}h</dd></div>
              <div className="flex justify-between"><dt className="text-qbMuted">Tarifa base</dt><dd className="font-medium text-qbInk">Q{resumen.tarifaBase.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-qbMuted">Servicios extra</dt><dd className="font-medium text-qbInk">Q{resumen.subtotalServicios.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-qbMuted">Equipo rentable</dt><dd className="font-medium text-qbInk">Q{resumen.subtotalEquipos.toFixed(2)}</dd></div>
              <div className="flex justify-between border-t border-qbBorder pt-2 mt-1"><dt className="font-bold text-qbInk">Total estimado</dt><dd className="text-lg font-extrabold text-qbInk">Q{resumen.total.toFixed(2)}</dd></div>
            </dl>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={sinTarifa}
              className="w-full mt-2 px-4 py-2 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition flex items-center justify-center disabled:opacity-50"
            >
              <Icon name="calendar" className="mr-2" />Solicitar reserva
            </button>
            <p className="text-[11px] text-qbMuted text-center">* Estimado sujeto a validación de disponibilidad.</p>
          </div>
        </div>
      </div>

      <ReservaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        resumen={resumen}
        onSubmit={handleReserva}
      />
    </section>
  );
}
