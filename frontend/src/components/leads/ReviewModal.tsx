'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { ProporcionVideo, ResenaClienteInput } from '@/types/resenas';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Motivo por el que no se puede dejar reseña (sesión / reserva completada). */
  bloqueo?: string | null;
  onSubmit?: (form: ResenaClienteInput) => Promise<void> | void;
}

const initialForm = {
  autor: '',
  empresaAutor: '',
  comentario: '',
  calificacion: 5,
  videoUrl: '',
  videoProporcion: '16/9' as ProporcionVideo,
  reservaId: '',
};

export default function ReviewModal({ isOpen, onClose, bloqueo, onSubmit }: ReviewModalProps) {
  const [form, setForm] = useState(initialForm);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingSelect = (val: number) => {
    setForm((prev) => ({ ...prev, calificacion: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bloqueo) return;
    setEnviando(true);
    try {
      const input: ResenaClienteInput = {
        // SUPABASE (al conectar): reserva_id debe ser una reserva propia
        // en estado 'completada' (RLS de resenas_clientes).
        reservaId: form.reservaId,
        autor: form.autor,
        empresaAutor: form.empresaAutor || undefined,
        comentario: form.comentario,
        calificacion: form.calificacion,
        videoUrl: form.videoUrl || undefined,
        videoProporcion: form.videoUrl ? form.videoProporcion : undefined,
      };
      await onSubmit?.(input);
      setForm(initialForm);
      onClose();
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    setForm(initialForm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/80 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-qbChalk rounded-3xl shadow-2xl border border-qbBorder overflow-hidden max-h-[85vh] flex flex-col z-10">
        <div className="flex items-start justify-between p-6 border-b border-qbBorder bg-qbChalk shrink-0">
          <div className="space-y-1">
            <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">
              Tu Opinión Importa
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-qbInk">
              Publicar Testimonio
            </h2>
            <p className="text-xs sm:text-sm text-qbMuted">
              Solo clientes con una reserva completada pueden dejar una reseña.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-qbLinen hover:bg-qbChalkHover text-qbMuted hover:text-qbInk border border-qbBorder transition"
            aria-label="Cerrar modal"
          >
            <Icon name="xmark" />
          </button>
        </div>

        {bloqueo ? (
          <div className="p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-qbLinen border border-qbBorder">
              <Icon name="lock" className="text-qbMuted text-xl" />
            </div>
            <p className="text-sm text-qbMuted max-w-sm mx-auto">{bloqueo}</p>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl bg-qbTerracotta text-white text-xs font-bold hover:bg-qbTerracotta/90 transition"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
            <div className="bg-qbLinen/50 border border-qbBorder p-4 rounded-2xl flex flex-col items-center justify-center space-y-3 text-center">
              <label className="text-xs font-bold text-qbInk uppercase tracking-wider">
                Calificación general *
              </label>
              <div className="flex flex-wrap justify-center gap-2">
                {[5, 4, 3, 2, 1].map((val) => {
                  const isSelected = form.calificacion === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleRatingSelect(val)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-qbTerracotta text-white border-qbTerracotta shadow-sm'
                          : 'bg-qbChalk text-qbInk border-qbBorder hover:bg-qbChalkHover'
                      }`}
                    >
                      <span>{val}</span>
                      <Icon name="star" className={isSelected ? 'text-white' : 'text-amber-400'} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-qbInk uppercase tracking-wider flex items-center gap-1">
                  Tu Nombre / Representante <span className="text-qbTerracotta">*</span>
                </label>
                <input
                  type="text"
                  name="autor"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={form.autor}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-qbChalk border border-qbBorder focus:border-qbTerracotta rounded-xl text-sm text-qbInk outline-none transition placeholder:text-qbMuted/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-qbInk uppercase tracking-wider">
                  Empresa u Organización <span className="text-qbMuted font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  name="empresaAutor"
                  placeholder="Ej. Corporación Xela"
                  value={form.empresaAutor}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-qbChalk border border-qbBorder focus:border-qbTerracotta rounded-xl text-sm text-qbInk outline-none transition placeholder:text-qbMuted/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-qbInk uppercase tracking-wider flex items-center gap-1">
                  Tu Reseña / Comentario <span className="text-qbTerracotta">*</span>
                </label>
                <textarea
                  name="comentario"
                  required
                  rows={4}
                  placeholder="Escribe aquí los detalles de tu experiencia..."
                  value={form.comentario}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-qbChalk border border-qbBorder focus:border-qbTerracotta rounded-xl text-sm text-qbInk outline-none transition placeholder:text-qbMuted/50 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-qbInk uppercase tracking-wider">
                  ID de tu reserva completada <span className="text-qbTerracotta">*</span>
                </label>
                <input
                  type="text"
                  name="reservaId"
                  required
                  placeholder="uuid de la reserva"
                  value={form.reservaId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-qbChalk border border-qbBorder focus:border-qbTerracotta rounded-xl text-sm text-qbInk outline-none transition placeholder:text-qbMuted/50"
                />
              </div>

              <div className="pt-2 border-t border-qbBorder/60 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-qbInk uppercase tracking-wider">
                    Enlace de Video Reseña <span className="text-qbMuted font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="url"
                    name="videoUrl"
                    placeholder="Ej. https://youtube.com/watch?v=... o Vimeo"
                    value={form.videoUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-qbChalk border border-qbBorder focus:border-qbTerracotta rounded-xl text-sm text-qbInk outline-none transition placeholder:text-qbMuted/50"
                  />
                </div>

                {form.videoUrl && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-qbInk uppercase tracking-wider">
                      Formato de Video
                    </label>
                    <select
                      name="videoProporcion"
                      value={form.videoProporcion}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-qbChalk border border-qbBorder focus:border-qbTerracotta rounded-xl text-sm text-qbInk outline-none transition"
                    >
                      <option value="16/9">Horizontal (16:9 - YouTube/Vimeo)</option>
                      <option value="9/16">Vertical (9:16 - Reels/TikTok/Shorts)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-qbBorder">
              <button
                type="button"
                onClick={handleClose}
                disabled={enviando}
                className="px-5 py-2.5 rounded-xl border border-qbBorder bg-qbChalk text-qbInk text-xs font-bold hover:bg-qbChalkHover transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="px-6 py-2.5 rounded-xl bg-qbTerracotta text-white text-xs font-bold hover:bg-qbTerracotta/90 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {enviando ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Icon name="paper-plane" />
                    Enviar Testimonio
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
