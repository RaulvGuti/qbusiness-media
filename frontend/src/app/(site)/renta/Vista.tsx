'use client';

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import RentalCalculator from '@/components/estudio/RentalCalculator';
import ReservaModal, { type ReservaModalData, type ReservaModalForm } from '@/components/estudio/ReservaModal';
import { enviarSolicitudReservaCliente } from '@/server/services/reservas/clients';
import type { EquipoEstudio, ServicioEstudio } from '@/types/estudio';

interface VistaProps {
  servicios: ServicioEstudio[];
  equipos: EquipoEstudio[];
  tarifaHora: number | null;
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

export function Vista({ servicios, equipos, tarifaHora }: VistaProps) {
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
          <div className="bg-qbChalk border border-qbBorder rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-qbInk">Descripción del estudio</h3>
            <p className="text-sm text-qbMuted leading-relaxed">
              Estudio profesional en Quetzaltenango ideal para grabación de video, podcast, fotografía comercial y contenido para redes. Ambiente controlado con iluminación, acústica y equipamiento disponible bajo demanda.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-qbMuted">
              <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Iluminación profesional</span></li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Acústica tratada</span></li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Ciclorama / Fondos</span></li>
              <li className="flex items-center gap-2"><Icon name="check" className="text-qbSage" /><span>Acceso flexible por horas</span></li>
            </ul>
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
