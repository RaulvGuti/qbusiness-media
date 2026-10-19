import React from 'react';
import type { LeadContacto } from '@/types/leads';

interface LeadsTableProps {
  leads: LeadContacto[];
}

const estadoBadge = (estado: LeadContacto['estado']) => {
  const map = {
    nuevo: 'bg-qbTerracotta/10 text-qbTerracotta border-qbTerracotta/20',
    contactado: 'bg-blue-50 text-blue-700 border-blue-200',
    cotizado: 'bg-amber-50 text-amber-700 border-amber-200',
    en_proceso: 'bg-purple-50 text-purple-700 border-purple-200',
    cerrado: 'bg-qbSage/10 text-qbSage border-qbSage/20',
    descartado: 'bg-gray-100 text-gray-600 border-gray-200',
  } as const;
  return map[estado];
};

export default function LeadsTable({ leads }: LeadsTableProps) {
  return (
    <div className="bg-white border border-qbBorder rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-qbBorder">
          <thead className="bg-qbChalk">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Lead
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Contacto
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Servicio
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Presupuesto
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Estado
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-qbBorder">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-qbChalk/60 transition">
                <td className="px-4 sm:px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-qbInk">{l.nombre}</p>
                    {l.empresa && (
                      <p className="text-xs text-qbMuted">{l.empresa}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-sm text-qbInk">{l.email}</p>
                    <p className="text-xs text-qbMuted">{l.telefono}</p>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-qbChalk text-qbInk border border-qbBorder capitalize">
                    {l.tipoServicio.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm text-qbInk">
                  {l.presupuesto || '—'}
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${estadoBadge(
                      l.estado
                    )}`}
                  >
                    {l.estado.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 text-xs text-qbMuted">
                  {l.fechaCreacion}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-qbMuted">
                  No hay leads registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}