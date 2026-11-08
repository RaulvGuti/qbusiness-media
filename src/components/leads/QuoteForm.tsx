'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { CAMPO, CAMPO_AREA } from '@/lib/estilos-formulario';

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
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const respuesta = await fetch("/api/api/contactos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const resultado = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          resultado.error || "No se pudo enviar la solicitud de cotización.",
        );
      }

      setEnviado(true);
      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al enviar la solicitud.",
      );
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
        <button
          type="button"
          onClick={() => setEnviado(false)}
          className="px-4 py-2 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-qbChalk border border-qbBorder rounded-3xl p-6 space-y-4 shadow-sm">
      <h3 className="text-sm font-bold text-qbInk uppercase tracking-wider">Solicitar cotización directa</h3>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-800/50 bg-red-950/40 px-3 py-2 text-xs text-red-400"
        >
          {error}
        </p>
      )}
      <div className="space-y-3">
        <input
          name="nombre"
          required
          placeholder="Nombre completo *"
          value={form.nombre}
          onChange={handleChange}
          className={CAMPO}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="correo"
            type="email"
            required
            placeholder="Correo *"
            value={form.correo}
            onChange={handleChange}
            className={CAMPO}
          />
          <input
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono ?? ''}
            onChange={handleChange}
            className={CAMPO}
          />
        </div>
        <textarea
          name="mensaje"
          rows={3}
          required
          placeholder="Detalles del proyecto *"
          value={form.mensaje ?? ''}
          onChange={handleChange}
          className={CAMPO_AREA}
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
