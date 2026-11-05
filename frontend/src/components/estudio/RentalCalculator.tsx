'use client';

import { useEffect, useMemo, useState } from 'react';
import { descuentoLealtad, etiquetaHoras } from '@/lib/estudio-paquetes';
import type {
  EquipoEstudio,
  PaqueteEstudio,
  ServicioEstudio,
} from '@/types/estudio';

export type ResumenRenta = {
  paqueteId: string | null;
  paqueteNombre: string | null;
  horas: number;
  paquetePrecioBase: number;
  descuento: number;
  paquetePrecioFinal: number;
  subtotalServicios: number;
  subtotalEquipos: number;
  total: number;
  serviciosIds: string[];
  equipos: { equipoId: string; cantidad: number }[];
};

interface RentalCalculatorProps {
  paquetes: PaqueteEstudio[];
  servicios: ServicioEstudio[];
  equipos: EquipoEstudio[];
  /** Reservas completadas del cliente: desde 5 se aplica 25% al paquete. */
  reservasCompletadas: number;
  /** "estudio" muestra servicios y equipo; "equipo" prioriza el inventario. */
  modo?: 'estudio' | 'equipo';
  onResumenChange?: (resumen: ResumenRenta) => void;
}

/**
 * Calculadora pública de renta.
 *
 * El paquete es obligatorio y fija las horas de la reserva. Servicios y
 * equipos se cobran por hora encima del paquete. El total definitivo lo vuelve
 * a calcular la RPC `solicitar_reserva` (000042); esto es solo el estimado.
 */
export default function RentalCalculator({
  paquetes,
  servicios,
  equipos,
  reservasCompletadas,
  modo = 'estudio',
  onResumenChange,
}: RentalCalculatorProps) {
  const [paqueteId, setPaqueteId] = useState<string>(paquetes[0]?.id ?? '');
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    Record<string, boolean>
  >({});
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<
    Record<string, number>
  >({});

  const paquete =
    paquetes.find((p) => p.id === paqueteId) ?? paquetes[0] ?? null;
  const horas = paquete?.horas ?? 0;
  const descuento = descuentoLealtad(paquete?.precio ?? 0, reservasCompletadas);

  const subtotalServicios = servicios.reduce((acc, s) => {
    return serviciosSeleccionados[s.id] ? acc + s.precioPorHora * horas : acc;
  }, 0);

  const subtotalEquipos = equipos.reduce((acc, e) => {
    const cantidad = equiposSeleccionados[e.id] || 0;
    return acc + e.precioPorHora * cantidad * horas;
  }, 0);

  const total = useMemo(
    () =>
      Math.round(
        (descuento.precioFinal + subtotalServicios + subtotalEquipos) * 100,
      ) / 100,
    [descuento.precioFinal, subtotalServicios, subtotalEquipos],
  );

  useEffect(() => {
    onResumenChange?.({
      paqueteId: paquete?.id ?? null,
      paqueteNombre: paquete?.nombre ?? null,
      horas,
      paquetePrecioBase: paquete?.precio ?? 0,
      descuento: descuento.monto,
      paquetePrecioFinal: descuento.precioFinal,
      subtotalServicios,
      subtotalEquipos,
      total,
      serviciosIds: Object.entries(serviciosSeleccionados)
        .filter(([, activo]) => activo)
        .map(([id]) => id),
      equipos: Object.entries(equiposSeleccionados)
        .filter(([, cantidad]) => cantidad > 0)
        .map(([equipoId, cantidad]) => ({ equipoId, cantidad })),
    });
  }, [
    descuento.monto,
    descuento.precioFinal,
    equiposSeleccionados,
    horas,
    onResumenChange,
    paquete?.id,
    paquete?.nombre,
    paquete?.precio,
    serviciosSeleccionados,
    subtotalEquipos,
    subtotalServicios,
    total,
  ]);

  const toggleServicio = (id: string) => {
    setServiciosSeleccionados((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const actualizarEquipo = (id: string, cantidad: number, stock: number) => {
    setEquiposSeleccionados((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(stock, Number.isFinite(cantidad) ? cantidad : 0)),
    }));
  };

  if (paquetes.length === 0) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="font-bold">Renta temporalmente no disponible</p>
        <p className="mt-1">
          Todavía no hay paquetes de renta configurados. El administrador debe
          crear al menos un paquete activo antes de recibir reservas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 rounded-3xl border border-qbBorder bg-qbChalk p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-qbInk">
            {modo === 'equipo' ? 'Reserva tu equipo' : 'Calculadora de renta'}
          </h3>
          <p className="text-sm text-qbMuted">
            Elige un paquete. Sus horas fijan el inicio y el fin de la reserva.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {paquetes.map((p) => {
            const activo = p.id === paquete?.id;
            const d = descuentoLealtad(p.precio, reservasCompletadas);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaqueteId(p.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  activo
                    ? 'border-qbTerracotta ring-1 ring-qbTerracotta/40 bg-white'
                    : 'border-qbBorder hover:border-qbInk/40'
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold text-qbInk">{p.nombre}</span>
                  <span className="text-xs font-semibold text-qbMuted">
                    {etiquetaHoras(p.horas)}
                  </span>
                </div>
                <div className="mt-2 text-lg font-extrabold text-qbInk">
                  Q{d.precioFinal.toFixed(2)}
                  {d.aplica && (
                    <span className="ml-2 text-xs font-semibold text-qbSage line-through decoration-1">
                      Q{p.precio.toFixed(2)}
                    </span>
                  )}
                </div>
                {d.aplica && (
                  <p className="text-[11px] font-semibold text-qbSage">
                    Incluye 25% de descuento por lealtad
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {descuento.aplica && (
          <p className="rounded-xl border border-qbSage/40 bg-qbSage/10 px-3 py-2 text-xs font-semibold text-qbInk">
            Llevas {reservasCompletadas} reservas completadas: el 25% de
            descuento ya está aplicado al paquete.
          </p>
        )}
      </div>

      {modo === 'estudio' && (
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-qbInk">
            Servicios extra
          </h4>
          <div className="space-y-3">
            {servicios.length === 0 && (
              <p className="text-sm text-qbMuted">No hay servicios extra disponibles.</p>
            )}
            {servicios.map((s) => {
              const seleccionado = Boolean(serviciosSeleccionados[s.id]);
              return (
                <div
                  key={s.id}
                  className={`rounded-2xl border p-4 transition ${
                    seleccionado ? 'border-qbTerracotta/40' : 'border-qbBorder'
                  }`}
                >
                  <label className="flex cursor-pointer flex-wrap items-start justify-between gap-3">
                    <span className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() => toggleServicio(s.id)}
                        className="mt-1"
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-bold text-qbInk">
                          {s.nombre}
                        </span>
                        <span className="block text-xs font-semibold text-qbMuted">
                          Q{Number(s.precioPorHora).toFixed(2)}/h
                        </span>
                        {s.descripcion && (
                          <span className="block text-xs text-qbMuted">
                            {s.descripcion}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-qbInk">
                      Q{(s.precioPorHora * (seleccionado ? horas : 0)).toFixed(2)}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-qbInk">
          Equipo rentable
        </h4>
        <div className="space-y-3">
          {equipos.length === 0 && (
            <p className="text-sm text-qbMuted">
              No hay equipos disponibles para agregar.
            </p>
          )}
          {equipos.map((e) => {
            const cantidad = equiposSeleccionados[e.id] || 0;
            return (
              <div
                key={e.id}
                className={`rounded-2xl border p-4 transition ${
                  cantidad > 0 ? 'border-qbSage/40' : 'border-qbBorder'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-qbInk">{e.nombre}</span>
                      <span className="text-xs font-semibold text-qbMuted">
                        Q{Number(e.precioPorHora).toFixed(2)}/h
                      </span>
                      <span className="text-[11px] text-qbMuted">
                        Disponibles: {e.cantidadTotal}
                      </span>
                    </div>
                    {e.descripcion && (
                      <p className="text-xs text-qbMuted">{e.descripcion}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-qbMuted">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={e.cantidadTotal}
                      step={1}
                      value={cantidad}
                      onChange={(ev) =>
                        actualizarEquipo(
                          e.id,
                          parseInt(ev.target.value, 10) || 0,
                          e.cantidadTotal,
                        )
                      }
                      className="w-20 text-sm"
                    />
                    <span className="min-w-[70px] text-right text-sm font-semibold text-qbInk">
                      Q{(e.precioPorHora * cantidad * horas).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 border-t border-qbBorder pt-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-qbInk">
          Desglose de costos
        </h4>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-qbMuted">
              {paquete?.nombre ?? 'Paquete'} ({etiquetaHoras(horas)})
            </dt>
            <dd className="font-semibold text-qbInk">
              Q{descuento.precioFinal.toFixed(2)}
            </dd>
          </div>
          {descuento.aplica && (
            <div className="flex items-center justify-between text-qbSage">
              <dt>Descuento de lealtad (25%)</dt>
              <dd className="font-semibold">-Q{descuento.monto.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between">
            <dt className="text-qbMuted">Servicios extra</dt>
            <dd className="font-semibold text-qbInk">
              Q{subtotalServicios.toFixed(2)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-qbMuted">Equipo rentable</dt>
            <dd className="font-semibold text-qbInk">
              Q{subtotalEquipos.toFixed(2)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-qbBorder pt-2">
            <dt className="text-base font-bold text-qbInk">Total estimado</dt>
            <dd className="text-lg font-extrabold text-qbInk">
              Q{total.toFixed(2)}
            </dd>
          </div>
        </dl>
        <p className="text-[11px] text-qbMuted">
          * Estimado. El precio final lo calcula el servidor al confirmar la
          reserva.
        </p>
      </div>
    </div>
  );
}
