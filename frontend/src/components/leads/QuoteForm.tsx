'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

const initialForm = {
  nombre: '',
  correo: '',
  telefono: '',
  mensaje: '',
};

export default function QuoteForm() {
  const [form, setForm] = useState(initialForm);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      // SUPABASE (al conectar): Server Action con service role:
      //   INSERT INTO leads_contacto (nombre, correo, telefono, mensaje)
      //   VALUES (...);  estado nace en 'nuevo'.
      await new Promise((r) => setTimeout(r, 500));
      setEnviado(true);
      setForm(initialForm);
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="bg-qbChalk border border-qbBorder rounded-3xl p-6 text-center space-y-3 shadow-sm">
        <h4 className="text-sm font-bold text-qbInk uppercase tracking-wider">Cotización solicitada</h4>
        <p className="text-sm text-qbMuted">
          Te enviaremos una propuesta a tu correo en breve.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-qbChalk border border-qbBorder rounded-3xl p-6 space-y-4 shadow-sm">
      <h3 className="text-sm font-bold text-qbInk uppercase tracking-wider">Solicitar cotización directa</h3>
      <div className="space-y-3">
        <input
          name="nombre"
          required
          placeholder="Nombre completo *"
          value={form.nombre}
          onChange={handleChange}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="correo"
            type="email"
            required
            placeholder="Correo *"
            value={form.correo}
            onChange={handleChange}
          />
          <input
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono ?? ''}
            onChange={handleChange}
          />
        </div>
        <textarea
          name="mensaje"
          rows={3}
          required
          placeholder="Detalles del proyecto *"
          value={form.mensaje ?? ''}
          onChange={handleChange}
        />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="w-full px-4 py-2 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition disabled:opacity-60 flex items-center justify-center"
      >
        {enviando ? (
          <>Enviando...</>
        ) : (
          <>
            <Icon name="calendar" className="mr-2" />
            Solicitar cotización
          </>
        )}
      </button>
    </form>
  );
}
