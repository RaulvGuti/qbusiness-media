'use client';

import { Icon } from '@/components/ui/Icon';
import type { TipoServicioLead } from '@/types/leads';
import { useState } from 'react';

const initialForm = {
  nombre: '',
  email: '',
  telefono: '',
  empresa: '',
  tipoServicio: 'video-corporativo' as TipoServicioLead,
  presupuesto: '',
  mensaje: '',
};

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value as (typeof initialForm)[keyof typeof initialForm],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setEnviado(true);
      setForm(initialForm);
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="bg-qbChalk border border-qbBorder rounded-3xl p-8 text-center space-y-4 shadow-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-qbSage/10">
          <Icon name="check-circle" className="text-qbSage text-2xl" />
        </div>
        <h3 className="text-xl font-bold text-qbInk">
          ¡Gracias por contactarnos!
        </h3>
        <p className="text-sm text-qbMuted max-w-xl mx-auto">
          Hemos recibido tu mensaje. Te responderemos en menos de 24 horas.
        </p>
        <button
          onClick={() => setEnviado(false)}
          className="px-4 py-2 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-qbChalk border border-qbBorder rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm"
    >
      <h3 className="text-sm font-bold text-qbInk uppercase tracking-wider">Formulario de contacto</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-qbInk">Nombre completo *</label>
          <input
            name="nombre"
            required
            value={form.nombre}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">Correo *</label>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">Teléfono *</label>
            <input
              name="telefono"
              required
              value={form.telefono}
              onChange={handleChange}
            />
          </div>
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
            <label className="text-sm font-semibold text-qbInk">Tipo de servicio *</label>
            <select
              name="tipoServicio"
              required
              value={form.tipoServicio}
              onChange={handleChange}
            >
              <option value="video-corporativo">Video corporativo</option>
              <option value="foto-comercial">Fotografía comercial</option>
              <option value="podcast">Podcast</option>
              <option value="reels">Reels</option>
              <option value="estudio">Renta de estudio</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-qbInk">Presupuesto aproximado</label>
          <input
            name="presupuesto"
            value={form.presupuesto}
            onChange={handleChange}
            placeholder="Q5,000 - Q10,000"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-qbInk">Mensaje *</label>
          <textarea
            name="mensaje"
            required
            rows={4}
            value={form.mensaje}
            onChange={handleChange}
            placeholder="Cuéntanos sobre tu proyecto..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={enviando}
          className="px-6 py-2.5 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition flex items-center disabled:opacity-60"
        >
          {enviando ? (
            <>Enviando...</>
          ) : (
            <>
              <Icon name="paper-plane" className="mr-2" />
              Enviar mensaje
            </>
          )}
        </button>
      </div>
    </form>
  );
}