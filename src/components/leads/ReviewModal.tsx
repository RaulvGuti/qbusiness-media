'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

const initialForm = {
  nombreCliente: '',
  empresa: '',
  cargo: '',
  calificacion: 5,
  testimonio: '',
  proyectoRelacionado: '',
};

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (form: typeof initialForm) => void;
}

export default function ReviewModal({ isOpen, onClose, onSubmit }: ReviewModalProps) {
  const [form, setForm] = useState(initialForm);
  const [enviando, setEnviando] = useState(false);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'calificacion' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      onSubmit?.(form);
      setForm(initialForm);
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    setForm(initialForm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <div className="relative w-full max-w-xl bg-qbChalk rounded-3xl shadow-xl border border-qbBorder overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-qbBorder">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-qbInk">
              Publicar testimonio
            </h2>
            <p className="text-sm text-qbMuted">
              Comparte tu experiencia con QBusiness Media.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 text-qbMuted hover:text-qbInk transition"
            aria-label="Cerrar modal"
          >
            <Icon name="xmark" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-qbInk">Nombre *</label>
              <input
                name="nombreCliente"
                required
                value={form.nombreCliente}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-qbInk">Empresa</label>
                <input
                  name="empresa"
                  value={form.empresa}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-qbInk">Cargo</label>
                <input
                  name="cargo"
                  value={form.cargo}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-qbInk">Calificación *</label>
                <select
                  name="calificacion"
                  required
                  value={form.calificacion}
                  onChange={handleChange}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} estrella{n !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-qbInk">Proyecto relacionado</label>
                <input
                  name="proyectoRelacionado"
                  value={form.proyectoRelacionado}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-qbInk">Testimonio *</label>
              <textarea
                name="testimonio"
                required
                rows={4}
                value={form.testimonio}
                onChange={handleChange}
                placeholder="Cuéntanos tu experiencia..."
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-qbBorder bg-qbChalk text-qbInk font-semibold hover:bg-qbChalkHover transition"
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-qbChalk border border-qbBorder text-qbInk font-semibold hover:bg-qbChalkHover transition flex items-center disabled:opacity-60"
              disabled={enviando}
            >
              {enviando ? (
                <>Enviando...</>
              ) : (
                <>
                  <Icon name="check-circle" className="mr-2" />
                  Enviar testimonio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}