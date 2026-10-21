'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

const initialForm = {
  nombreEntidad: '',
  personaContacto: '',
  correo: '',
  telefono: '',
  tipoEntidad: 'fundacion',
  fechaEvento: '',
  descripcionProyecto: '',
};

export default function SolicitudApoyoForm() {
  const [form, setForm] = useState(initialForm);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setEnviando(true);

  try {
    const respuesta = await fetch("/api/api/solicitudes-apoyo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo enviar la solicitud.");
    }

    setEnviado(true);
    setForm(initialForm);
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Ocurrió un error al enviar la solicitud.",
    );
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
        <h3 className="text-xl font-bold text-qbInk">Solicitud enviada</h3>
        <p className="text-sm text-qbMuted max-w-xl mx-auto">
          Gracias por tu solicitud de apoyo social. Revisaremos tu información y
          te contactaremos a la brevedad.
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
    <form
      onSubmit={handleSubmit}
      className="bg-qbChalk border border-qbBorder rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm"
    >
      <div className="border border-qbBorderDark rounded-2xl p-5 sm:p-6 bg-black/40 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-qbInk uppercase tracking-wider">
          Datos de la organización
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-qbInk">
              Nombre de la organización / fundación *
            </label>
            <input
              name="nombreEntidad"
              required
              value={form.nombreEntidad}
              onChange={handleChange}
              placeholder="Ej. Bomberos Voluntarios 5.ª Cía."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">Tipo de organización</label>
            <select
              name="tipoEntidad"
              value={form.tipoEntidad}
              onChange={handleChange}
            >
              <option value="fundacion">Fundación</option>
              <option value="institucion">Institución</option>
              <option value="ong">ONG</option>
              <option value="bomberos">Cuerpo de Bomberos Voluntarios</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">
              Nombre de la persona de contacto *
            </label>
            <input
              name="personaContacto"
              required
              value={form.personaContacto}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">Correo *</label>
            <input
              name="correo"
              type="email"
              required
              value={form.correo}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">Teléfono</label>
            <input
              name="telefono"
              value={form.telefono ?? ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="border border-qbBorderDark rounded-2xl p-5 sm:p-6 bg-black/40 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-qbInk uppercase tracking-wider">
          Información del proyecto
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-qbInk">
              Descripción del proyecto y apoyo requerido *
            </label>
            <textarea
              name="descripcionProyecto"
              required
              rows={4}
              value={form.descripcionProyecto ?? ''}
              onChange={handleChange}
              placeholder="Actividad, población objetivo, tipo de material audiovisual solicitado..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">
              Fecha tentativa del evento
            </label>
            <input
              name="fechaEvento"
              type="date"
              value={form.fechaEvento ?? ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={enviando}
          className="px-6 py-2.5 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition flex items-center disabled:opacity-60"
        >
          {enviando ? (
            <>Enviando solicitud...</>
          ) : (
            <>
              <Icon name="paper-plane" className="mr-2" />
              Enviar solicitud de apoyo
            </>
          )}
        </button>
      </div>
    </form>
  );
}
