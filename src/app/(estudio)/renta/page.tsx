'use client';

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import RentalCalculator from '@/components/estudio/RentalCalculator';
import ReservaModal, { type ReservaModalData } from '@/components/estudio/ReservaModal';
import type { EquipoEstudio, ServicioEstudio } from '@/types/estudio';
import styles from "./page.module.css";

const serviciosMock: ServicioEstudio[] = [
  { id: 's1', nombre: 'Iluminación adicional', descripcion: 'Set de luces complementarias para escena.', precioPorHora: 150, activo: true },
  { id: 's2', nombre: 'Operador de cámara', descripcion: 'Operador profesional para grabación.', precioPorHora: 250, activo: true },
  { id: 's3', nombre: 'Audio / Micrófono boom', descripcion: 'Grabación de audio limpia y dirigida.', precioPorHora: 175, activo: true },
];

const equiposMock: EquipoEstudio[] = [
  { id: 'e1', nombre: 'Cámara Cinema 4K', descripcion: 'Cuerpo + lente estándar.', tarifaPorHora: 350, cantidadDisponible: 1, activo: true },
  { id: 'e2', nombre: 'Slider/Trípode profesional', descripcion: 'Movimiento suave para tomas dinámicas.', tarifaPorHora: 50, cantidadDisponible: 2, activo: true },
  { id: 'e3', nombre: 'Softbox/Kit iluminación', descripcion: 'Kit completo para estudio.', tarifaPorHora: 100, cantidadDisponible: 1, activo: true },
];

const defaultResumen: ReservaModalData = { horas: 2, subtotalServicios: 0, subtotalEquipos: 0, total: 0 };

export default function RentaPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [resumen, setResumen] = useState<ReservaModalData>(defaultResumen);

  return (
    <section className={styles.page}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-qbBorder pb-6">
        <div>
          <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">Espacio Profesional</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">Renta de Estudio</h2>
          <p className="text-sm text-qbMuted">Espacio equipado, flexible por horas. Calcula tu renta y solicita reserva.</p>
        </div>
      </div>

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

          <RentalCalculator servicios={serviciosMock} equipos={equiposMock} onResumenChange={setResumen} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-qbChalk border border-qbBorder rounded-3xl p-6 space-y-4 shadow-sm lg:sticky lg:top-6">
            <h3 className="text-lg font-bold text-qbInk">Resumen</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-qbMuted">Horas</dt><dd className="font-medium text-qbInk">{resumen.horas}h</dd></div>
              <div className="flex justify-between"><dt className="text-qbMuted">Servicios extra</dt><dd className="font-medium text-qbInk">Q{resumen.subtotalServicios.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-qbMuted">Equipo rentable</dt><dd className="font-medium text-qbInk">Q{resumen.subtotalEquipos.toFixed(2)}</dd></div>
              <div className="flex justify-between border-t border-qbBorder pt-2 mt-1"><dt className="font-bold text-qbInk">Total estimado</dt><dd className="text-lg font-extrabold text-qbInk">Q{resumen.total.toFixed(2)}</dd></div>
            </dl>
            <button type="button" onClick={() => setModalOpen(true)} className="w-full mt-2 px-4 py-2 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition flex items-center justify-center">
              <Icon name="calendar" className="mr-2" />Solicitar reserva
            </button>
            <p className="text-[11px] text-qbMuted text-center">* Estimado sujeto a validación de disponibilidad.</p>
          </div>
        </div>
      </div>

      <ReservaModal isOpen={modalOpen} onClose={() => setModalOpen(false)} resumen={resumen} onSubmit={() => setModalOpen(false)} />
    </section>
  );
}