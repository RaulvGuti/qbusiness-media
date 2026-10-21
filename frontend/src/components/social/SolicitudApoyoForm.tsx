'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { TipoOrganizacion } from '@/types/social';

const initialForm = {
  nombreOrganizacion: '',
  tipoOrganizacion: 'fundacion' as TipoOrganizacion,
  nombreContacto: '',
  cargoContacto: '',
  email: '',
  telefono: '',
  ubicacion: '',
  descripcionProyecto: '',
  objetivoApoyo: '',
  fechaTentativa: '',
  publicoBeneficiario: '',
  alcanceSolicitado: 'foto-video' as 'foto' | 'video' | 'foto-video' | 'reel' | 'otro',
  presupuestoPropio: '',
  comentarios: '',
};

export default function SolicitudApoyoForm() {
  const [form, setForm] = useState(initialForm);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
      {/* Datos organización */}
      <div className="border border-qbBorderDark rounded-2xl p-5 sm:p-6 bg-black/40 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-qbInk uppercase tracking-wider">
          Datos de la organización
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-qbInk">
              Nombre de la organización *
            </label>
            <input
              name="nombreOrganizacion"
              required
              value={form.nombreOrganizacion}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">
              Tipo de organización *
            </label>
            <select
              name="tipoOrganizacion"
              required
              value={form.tipoOrganizacion}
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
            <label className="text-sm font-semibold text-qbInk">Ubicación *</label>
            <input
              name="ubicacion"
              required
              value={form.ubicacion}
              onChange={handleChange}
              placeholder="Municipio, Departamento"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">
              Nombre del contacto *
            </label>
            <input
              name="nombreContacto"
              required
              value={form.nombreContacto}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">Cargo *</label>
            <input
              name="cargoContacto"
              required
              value={form.cargoContacto}
              onChange={handleChange}
            />
          </div>
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
      </div>

      {/* Proyecto */}
      <div className="border border-qbBorderDark rounded-2xl p-5 sm:p-6 bg-black/40 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-qbInk uppercase tracking-wider">
          Información del proyecto
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-qbInk">
              Descripción del proyecto *
            </label>
            <textarea
              name="descripcionProyecto"
              required
              rows={4}
              value={form.descripcionProyecto}
              onChange={handleChange}
              placeholder="Actividad, población objetivo, justificación..."
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-qbInk">
              Objetivo del apoyo solicitado *
            </label>
            <textarea
              name="objetivoApoyo"
              required
              rows={3}
              value={form.objetivoApoyo}
              onChange={handleChange}
              placeholder="Qué se busca lograr con este apoyo audiovisual"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">
              Alcance solicitado *
            </label>
            <select
              name="alcanceSolicitado"
              required
              value={form.alcanceSolicitado}
              onChange={handleChange}
            >
              <option value="foto-video">Fotografía + Video</option>
              <option value="video">Video</option>
              <option value="foto">Fotografía</option>
              <option value="reel">Reels</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-qbInk">
              Fecha tentativa de la actividad
            </label>
            <input
              name="fechaTentativa"
              type="date"
              value={form.fechaTentativa}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-qbInk">
              Público beneficiario *
            </label>
            <input
              name="publicoBeneficiario"
              required
              value={form.publicoBeneficiario}
              onChange={handleChange}
              placeholder="Niños, adultos mayores, comunidad, etc."
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-qbInk">
              Presupuesto propio / recursos con los que cuentan
            </label>
            <textarea
              name="presupuestoPropio"
              rows={2}
              value={form.presupuestoPropio}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-qbInk">Comentarios</label>
            <textarea
              name="comentarios"
              rows={2}
              value={form.comentarios}
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