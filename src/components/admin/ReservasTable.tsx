import React from 'react';
import type { ReservaEstudio } from '@/types/estudio';

interface ReservasTableProps {
  reservas: ReservaEstudio[];
}

const estadoBadge = (estado: ReservaEstudio['estado']) => {
  const map = {
    pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmada: 'bg-qbSage/10 text-qbSage border-qbSage/20',
    completada: 'bg-blue-50 text-blue-700 border-blue-200',
    cancelada: 'bg-gray-100 text-gray-600 border-gray-200',
  } as const;
  return map[estado];
};

export default function ReservasTable({ reservas }: ReservasTableProps) {
  return (
    <div className="bg-white border border-qbBorder rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-qbBorder">
          <thead className="bg-qbChalk">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Cliente
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Fecha / Horario
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Horas
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Total
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-qbBorder">
            {reservas.map((r) => (
              <tr key={r.id} className="hover:bg-qbChalk/60 transition">
                <td className="px-4 sm:px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-qbInk">{r.nombreCliente}</p>
                    <p className="text-xs text-qbMuted">{r.email}</p>
                    <p className="text-xs text-qbMuted">{r.telefono}</p>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-qbInk">{r.fecha}</p>
                    <p className="text-xs text-qbMuted">
                      {r.horaInicio} – {r.horaFin}
                    </p>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm text-qbInk">
                  {r.horasTotales}h
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm font-bold text-qbInk">
                  Q{r.total.toFixed(2)}
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${estadoBadge(
                      r.estado
                    )}`}
                  >
                    {r.estado}
                  </span>
                </td>
              </tr>
            ))}
            {reservas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-qbMuted">
                  No hay reservas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}