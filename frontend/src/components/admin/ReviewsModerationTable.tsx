'use client';

import React from 'react';
import type { ResenaCliente, EstadoResena } from '@/types/leads';

interface ReviewsModerationTableProps {
  resenas: ResenaCliente[];
  onGuardarBorrador?: (id: string) => void;
  onPublicar?: (id: string) => void;
  onEliminar?: (id: string) => void;
}

const estadoBadge = (estado: EstadoResena) => {
  const map = {
    borrador: 'bg-amber-50 text-amber-700 border-amber-200',
    publicada: 'bg-qbSage/10 text-qbSage border-qbSage/20',
    eliminada: 'bg-gray-100 text-gray-600 border-gray-200',
  } as const;
  return map[estado];
};

function StarRating({ calificacion }: { calificacion: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-0.5 text-qbTerracotta">
      {stars.map((s) => (
        <i
          key={s}
          className={`fas fa-star text-xs ${s <= calificacion ? 'text-qbTerracotta' : 'text-qbBorder'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export default function ReviewsModerationTable({
  resenas,
  onGuardarBorrador,
  onPublicar,
  onEliminar,
}: ReviewsModerationTableProps) {
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
                Testimonio
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Calificación
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Estado
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-qbMuted">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-qbBorder align-top">
            {resenas.map((r) => (
              <tr key={r.id} className="hover:bg-qbChalk/60 transition">
                <td className="px-4 sm:px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-qbInk">{r.nombreCliente}</p>
                    {(r.cargo || r.empresa) && (
                      <p className="text-xs text-qbMuted">
                        {[r.cargo, r.empresa].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    {r.proyectoRelacionado && (
                      <p className="text-xs text-qbMuted">
                        Proyecto: {r.proyectoRelacionado}
                      </p>
                    )}
                    <p className="text-xs text-qbMuted">{r.fechaCreacion}</p>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 max-w-md">
                  <p className="text-sm text-qbInk leading-relaxed line-clamp-4">
                    {r.testimonio}
                  </p>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <StarRating calificacion={r.calificacion} />
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
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {/* Guardar borrador */}
                    <button
                      type="button"
                      onClick={() => onGuardarBorrador?.(r.id)}
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        r.estado === 'borrador'
                          ? 'bg-amber-100 border-amber-200 text-amber-800 cursor-default opacity-70'
                          : 'bg-white border-qbBorder text-qbInk hover:bg-amber-50 hover:border-amber-200'
                      }`}
                      disabled={r.estado === 'borrador'}
                      title="Guardar borrador"
                    >
                      <i className="fas fa-file-alt mr-1.5" aria-hidden />
                      Guardar borrador
                    </button>

                    {/* Publicar */}
                    <button
                      type="button"
                      onClick={() => onPublicar?.(r.id)}
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        r.estado === 'publicada'
                          ? 'bg-qbSage/15 border-qbSage/30 text-qbSage cursor-default opacity-70'
                          : 'bg-white border-qbBorder text-qbInk hover:bg-qbSage/10 hover:border-qbSage/30'
                      }`}
                      disabled={r.estado === 'publicada' || r.estado === 'eliminada'}
                      title="Publicar"
                    >
                      <i className="fas fa-check-circle mr-1.5" aria-hidden />
                      Publicar
                    </button>

                    {/* Eliminar */}
                    <button
                      type="button"
                      onClick={() => onEliminar?.(r.id)}
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        r.estado === 'eliminada'
                          ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-default opacity-70'
                          : 'bg-white border-qbBorder text-qbInk hover:bg-red-50 hover:border-red-200 hover:text-red-700'
                      }`}
                      disabled={r.estado === 'eliminada'}
                      title="Eliminar"
                    >
                      <i className="fas fa-trash-alt mr-1.5" aria-hidden />
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {resenas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-qbMuted">
                  No hay reseñas para moderar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}