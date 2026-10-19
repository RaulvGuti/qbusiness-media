'use client';

import { useState } from 'react';
import type { EquipoEstudio, ServicioEstudio } from '@/types/estudio';

interface RentalCalculatorProps {
  servicios: ServicioEstudio[];
  equipos: EquipoEstudio[];
  onResumenChange?: (resumen: {
    horas: number;
    subtotalServicios: number;
    subtotalEquipos: number;
    total: number;
  }) => void;
}

export default function RentalCalculator({
  servicios,
  equipos,
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
    return acc + e.tarifaPorHora * c * horas;
  }, 0);

  const total = subtotalServicios + subtotalEquipos;

  const notify = (h: number, ss: number, se: number, t: number) => {
    onResumenChange?.({ horas: h, subtotalServicios: ss, subtotalEquipos: se, total: t });
  };

  const setHorasAndNotify = (h: number) => {
    setHoras(h);
    notify(h, subtotalServicios, subtotalEquipos, subtotalServicios + subtotalEquipos);
  };

  const toggleServicio = (id: string) => {
    setServiciosSeleccionados((prev) => {
      const next = { ...prev };
      if (next[id] && next[id] > 0) {
        delete next[id];
      } else {
        next[id] = horas > 0 ? horas : 1;
      }
      return next;
    });
  };

  const updateServicioHoras = (id: string, h: number) => {
    setServiciosSeleccionados((prev) => ({ ...prev, [id]: Math.max(0, h) }));
  };

  const updateEquipoCantidad = (id: string, c: number) => {
    setEquiposSeleccionados((prev) => ({ ...prev, [id]: Math.max(0, c) }));
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
            El tiempo aplica a servicios por hora y al cálculo de equipo.
          </p>
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
                  seleccionado
                    ? 'border-qbTerracotta/40'
                    : 'border-qbBorder'
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
                        onChange={(e) =>
                          updateServicioHoras(s.id, parseFloat(e.target.value) || 0)
                        }
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
                        Q{Number(e.tarifaPorHora).toFixed(2)}/h
                      </span>
                      <span className="text-[11px] text-qbMuted">Disp.: {e.cantidadDisponible}</span>
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
                      max={e.cantidadDisponible}
                      step={1}
                      value={cSel}
                      onChange={(ev) =>
                        updateEquipoCantidad(e.id, parseInt(ev.target.value) || 0)
                      }
                      className="w-20 text-sm"
                    />
                    <span className="text-sm font-semibold text-qbInk min-w-[70px] text-right">
                      Q{(e.tarifaPorHora * cSel * horas).toFixed(2)}
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
          * Estimado. Los precios se confirman al validar disponibilidad.
        </p>
      </div>
    </div>
  );
}