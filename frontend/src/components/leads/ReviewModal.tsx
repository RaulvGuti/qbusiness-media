'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';

export interface FormularioResena {
  autor: string;
  empresa_autor: string;
  texto: string;
  calificacion: number;
  carpeta_id?: string;
  video_url: string;
  video_proporcion: '16/9' | '9/16';
  origen: 'VISITANTE' | 'ADMIN';
}

const initialForm: FormularioResena = {
  autor: '',
  empresa_autor: '',
  texto: '',
  calificacion: 5,
  carpeta_id: '',
  video_url: '',
  video_proporcion: '16/9',
  origen: 'VISITANTE',
};

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (form: FormularioResena) => Promise<void> | void;
}

export default function ReviewModal({ isOpen, onClose, onSubmit }: ReviewModalProps) {
  const [form, setForm] = useState<FormularioResena>(initialForm);
  const [enviando, setEnviando] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Bloquea el scroll del fondo cuando el modal está abierto para evitar lag y saltos
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
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (stars: number) => {
    setForm((prev) => ({ ...prev, calificacion: stars }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await onSubmit?.(form);
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
      {/* Fondo oscuro con Blur y eventos táctiles/scroll bloqueados */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity touch-none"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Contenedor del Modal con scroll y animaciones independientes */}
      <div className="relative w-full max-w-xl bg-qbChalk rounded-3xl shadow-2xl border border-qbBorder overflow-hidden max-h-[85vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera Fija */}
        <div className="flex items-start justify-between p-6 border-b border-qbBorder bg-qbChalk shrink-0">
          <div className="space-y-1">
            <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">
              Tu Opinión Importa
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-qbInk">
              Publicar Testimonio
            </h2>
            <p className="text-xs sm:text-sm text-qbMuted">
              Cuéntanos tu experiencia trabajando con QBusiness Media.
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

        {/* Cuerpo del Formulario con scroll contenido */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 overscroll-contain">
          {/* Selector interactivo de estrellas */}
          <div className="bg-qbLinen/50 border border-qbBorder p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 text-center">
            <label className="text-xs font-bold text-qbInk uppercase tracking-wider">
              ¿Cómo calificarías nuestro servicio? *
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const activeStar = (hoverRating ?? form.calificacion) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className={`p-1.5 text-2xl transition-transform hover:scale-110 focus:outline-none ${
                      activeStar ? 'text-amber-400' : 'text-qbMuted/30'
                    }`}
                  >
                    <Icon name="star" />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-semibold text-qbMuted">
              {form.calificacion} de 5 Estrellas
            </span>
          </div>

          <div className="space-y-4">
            {/* Campo Autor */}
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

            {/* Campo Empresa (Opcional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-qbInk uppercase tracking-wider">
                Empresa u Organización <span className="text-qbMuted font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                name="empresa_autor"
                placeholder="Ej. Corporación Xela"
                value={form.empresa_autor}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-qbChalk border border-qbBorder focus:border-qbTerracotta rounded-xl text-sm text-qbInk outline-none transition placeholder:text-qbMuted/50"
              />
            </div>

            {/* Campo Testimonio / Texto */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-qbInk uppercase tracking-wider flex items-center gap-1">
                Tu Reseña / Comentario <span className="text-qbTerracotta">*</span>
              </label>
              <textarea
                name="texto"
                required
                rows={4}
                placeholder="Escribe aquí los detalles de tu experiencia con la calidad del trabajo, atención y entregables..."
                value={form.texto}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-qbChalk border border-qbBorder focus:border-qbTerracotta rounded-xl text-sm text-qbInk outline-none transition placeholder:text-qbMuted/50 resize-none"
              />
            </div>

            {/* Video adjunto (Opcional) */}
            <div className="pt-2 border-t border-qbBorder/60 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-qbInk uppercase tracking-wider">
                  Enlace de Video Reseña <span className="text-qbMuted font-normal">(Opcional)</span>
                </label>
                <input
                  type="url"
                  name="video_url"
                  placeholder="Ej. https://youtube.com/watch?v=... o Vimeo"
                  value={form.video_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-qbChalk border border-qbBorder focus:border-qbTerracotta rounded-xl text-sm text-qbInk outline-none transition placeholder:text-qbMuted/50"
                />
              </div>

              {/* Proporción de video */}
              {form.video_url && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-qbInk uppercase tracking-wider">
                    Formato de Video
                  </label>
                  <select
                    name="video_proporcion"
                    value={form.video_proporcion}
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

          {/* Botones de Acción */}
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
      </div>
    </div>
  );
}