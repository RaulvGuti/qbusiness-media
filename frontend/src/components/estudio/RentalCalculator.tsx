'use client';

import { useState } from 'react';
import type { EquipoEstudio, ServicioEstudio } from '@/types/estudio';

interface RentalCalculatorProps {
  servicios: ServicioEstudio[];
  equipos: EquipoEstudio[];
  tarifaHoraBase: number;
  onResumenChange?: (resumen: {
    horas: number;
    tarifaBase: number;
    subtotalServicios: number;
    subtotalEquipos: number;
    total: number;
    serviciosIds: string[];
    equipos: { equipoId: string; cantidad: number }[];
  }) => void;
}

export default function RentalCalculator({
  servicios,
  equipos,
  tarifaHoraBase,
  onResumenChange,
}: RentalCalculatorProps) {
  const [horas, setHoras] = useState<number>(2);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<Record<string, number>>({});
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<Record<string, number>>({});

  const subtotalServicios = servicios.reduce((acc, s) => {
    const h = serviciosSeleccionados[s.id] || 0;
    return acc + s.precioPorHora * h;
  }, 0);

  const subtotalEquipos = equipos.reduce((acc, e) => {
    const c = equiposSeleccionados[e.id] || 0;
    return acc + e.precioPorHora * c * horas;
  }, 0);

  const total = Math.round((tarifaHoraBase * horas + subtotalServicios + subtotalEquipos) * 100) / 100;

  const notify = (
    h: number,
    tb: number,
    ss: number,
    se: number,
    t: number,
    serviciosIds: string[],
    eqs: { equipoId: string; cantidad: number }[],
  ) => {
    onResumenChange?.({
      horas: h,
      tarifaBase: tb,
      subtotalServicios: ss,
      subtotalEquipos: se,
      total: t,
      serviciosIds,
      equipos: eqs,
    });
  };

  const snapshot = (h: number, ss: number, se: number, sSel: Record<string, number>, eSel: Record<string, number>) => {
    notify(
      h,
      tarifaHoraBase * h,
      ss,
      se,
      Math.round((tarifaHoraBase * h + ss + se) * 100) / 100,
      Object.keys(sSel),
      Object.entries(eSel)
        .filter(([, c]) => c > 0)
        .map(([equipoId, cantidad]) => ({ equipoId, cantidad })),
    );
  };

  const setHorasAndNotify = (h: number) => {
    setHoras(h);
    snapshot(h, subtotalServicios, subtotalEquipos, serviciosSeleccionados, equiposSeleccionados);
  };

  const toggleServicio = (id: string) => {
    setServiciosSeleccionados((prev) => {
      const next = { ...prev };
      if (next[id] && next[id] > 0) {
        delete next[id];
      } else {
        next[id] = horas > 0 ? horas : 1;
      }
      snapshot(horas, subtotalServicios, subtotalEquipos, next, equiposSeleccionados);
      return next;
    });
  };

  const updateServicioHoras = (id: string, h: number) => {
    setServiciosSeleccionados((prev) => {
      const next = { ...prev, [id]: Math.max(0, h) };
      const ss = servicios.reduce((acc, s) => acc + s.precioPorHora * (next[s.id] || 0), 0);
      snapshot(horas, ss, subtotalEquipos, next, equiposSeleccionados);
      return next;
    });
  };

  const updateEquipoCantidad = (id: string, c: number) => {
    setEquiposSeleccionados((prev) => {
      const next = { ...prev, [id]: Math.max(0, c) };
      const se = equipos.reduce((acc, e) => acc + e.precioPorHora * (next[e.id] || 0) * horas, 0);
      snapshot(horas, subtotalServicios, se, serviciosSeleccionados, next);
      return next;
    });
  };

  return (
    <div className="bg-qbChalk border border-qbBorder rounded-3xl p-6 space-y-8 shadow-sm">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-qbInk">Calculadora de renta</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <label htmlFor="horas" className="text-sm font-semibold text-qbInk">
              Horas de renta
            </label>
            <input
              id="horas"
              type="number"
              min={1}
              step={0.5}
              value={horas}
              onChange={(e) => setHorasAndNotify(Math.max(0.5, parseFloat(e.target.value) || 0))}
              className="w-32"
            />
          </div>
          <p className="text-sm text-qbMuted">
            El tiempo aplica a la tarifa base del salón, servicios y equipo.
          </p>
        </div>
        <div className="border border-qbBorder rounded-2xl p-4 flex justify-between items-center text-sm">
          <span className="text-qbMuted">Tarifa base del salón</span>
          <span className="font-bold text-qbInk">Q{tarifaHoraBase.toFixed(2)} / h</span>
        </div>
      </div>

      {/* Servicios */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-qbInk uppercase tracking-wider">Servicios extra</h4>
        <div className="space-y-3">
          {servicios.map((s) => {
            const seleccionado = (serviciosSeleccionados[s.id] || 0) > 0;
            const hSel = serviciosSeleccionados[s.id] || horas;
            return (
              <div
                key={s.id}
                className={`border rounded-2xl p-4 transition ${
                  seleccionado ? 'border-qbTerracotta/40' : 'border-qbBorder'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() => toggleServicio(s.id)}
                      />
                      <span className="text-sm font-bold text-qbInk">{s.nombre}</span>
                      <span className="text-xs font-semibold text-qbMuted">
                        Q{Number(s.precioPorHora).toFixed(2)}/h
                      </span>
                    </label>
                    {s.descripcion && (
                      <p className="text-xs text-qbMuted pl-6">{s.descripcion}</p>
                    )}
                  </div>

                  {seleccionado && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-qbMuted">Horas</label>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={hSel}
                        onChange={(e) => updateServicioHoras(s.id, parseFloat(e.target.value) || 0)}
                        className="w-20 text-sm"
                      />
                      <span className="text-sm font-semibold text-qbInk">
                        Q{(s.precioPorHora * hSel).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equipos */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-qbInk uppercase tracking-wider">Equipo rentable</h4>
        <div className="space-y-3">
          {equipos.map((e) => {
            const cSel = equiposSeleccionados[e.id] || 0;
            return (
              <div
                key={e.id}
                className={`border rounded-2xl p-4 transition ${
                  cSel > 0 ? 'border-qbSage/40' : 'border-qbBorder'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm font-bold text-qbInk">{e.nombre}</span>
                      <span className="text-xs font-semibold text-qbMuted">
                        Q{Number(e.precioPorHora).toFixed(2)}/h
                      </span>
                      <span className="text-[11px] text-qbMuted">Disp.: {e.cantidadTotal}</span>
                    </div>
                    {e.descripcion && (
                      <p className="text-xs text-qbMuted">{e.descripcion}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-qbMuted">Cantidad</label>
                    <input
                      type="number"
                      min={0}
                      max={e.cantidadTotal}
                      step={1}
                      value={cSel}
                      onChange={(ev) => updateEquipoCantidad(e.id, parseInt(ev.target.value) || 0)}
                      className="w-20 text-sm"
                    />
                    <span className="text-sm font-semibold text-qbInk min-w-[70px] text-right">
                      Q{(e.precioPorHora * cSel * horas).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen */}
      <div className="border-t border-qbBorder pt-6 space-y-3">
        <h4 className="text-sm font-bold text-qbInk uppercase tracking-wider">Desglose de costos</h4>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-qbMuted">Tarifa base ({horas}h)</dt>
            <dd className="font-semibold text-qbInk">Q{(tarifaHoraBase * horas).toFixed(2)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-qbMuted">Servicios extra</dt>
            <dd className="font-semibold text-qbInk">Q{subtotalServicios.toFixed(2)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-qbMuted">Equipo rentable</dt>
            <dd className="font-semibold text-qbInk">Q{subtotalEquipos.toFixed(2)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-qbBorder pt-2">
            <dt className="text-base font-bold text-qbInk">Total estimado</dt>
            <dd className="text-lg font-extrabold text-qbInk">Q{total.toFixed(2)}</dd>
          </div>
        </dl>
        <p className="text-[11px] text-qbMuted">
          * Estimado. El precio final lo calcula el servidor al confirmar la reserva.
        </p>
      </div>
    </div>
  );
}
