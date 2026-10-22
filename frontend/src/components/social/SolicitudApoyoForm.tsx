'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

/*
  Campos del formulario → columnas de solicitudes_apoyo_social:
    nombreEntidad        → nombre_entidad
    personaContacto      → persona_contacto
    correo               → correo
    telefono             → telefono
    descripcionProyecto  → descripcion_proyecto
    tipoEntidad          → tipo_entidad
    fechaEvento          → fecha_evento
  estado, gestionado_por_id, notificado_en y creado_en los maneja el sistema.
*/
const initialForm = {
  nombreEntidad: '',
  personaContacto: '',
  correo: '',
  telefono: '',
  tipoEntidad: 'fundacion',
  fechaEvento: '',
  descripcionProyecto: '',
  aceptaTerminos: false, // solo validación en pantalla, no se guarda
};

/** Campo con borde tenue para distinguir lo que se puede editar. */
const campo =
  'w-full rounded-xl border border-qbBorder bg-black/30 px-3.5 py-2.5 text-sm text-qbInk ' +
  'placeholder:text-qbMuted transition-colors hover:border-qbMuted focus:border-qbMuted focus:outline-none';

const etiqueta = 'block text-[11px] font-bold uppercase tracking-wide text-qbInk';

const incluye = [
  'Producción de video y foto solidaria',
  'Equipo y horas de producción',
  'Difusión gratuita en nuestros canales',
];

const pasos = [
  { n: '1', titulo: 'Envías tu solicitud', texto: 'Con los datos de tu organización y del proyecto.' },
  { n: '2', titulo: 'La revisamos', texto: 'Evaluamos la colaboración técnica posible.' },
  { n: '3', titulo: 'Te contactamos', texto: 'Te respondemos con la decisión y los siguientes pasos.' },
];

function Seccion({ n, titulo }: { n: string; titulo: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-qbBorder text-[11px] font-bold text-qbInk">
        {n}
      </span>
      <h4 className="text-xs font-bold uppercase tracking-wider text-qbInk">{titulo}</h4>
      <span className="h-px flex-1 bg-qbBorder" aria-hidden />
    </div>
  );
}

export default function SolicitudApoyoForm() {
  const [form, setForm] = useState(initialForm);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      // SUPABASE (al conectar): Server Action con service role:
      //   INSERT INTO solicitudes_apoyo_social
      //     (nombre_entidad, persona_contacto, correo, telefono, descripcion_proyecto,
      //      tipo_entidad, fecha_evento)
      //   VALUES (...);  estado nace en 'nueva'.
      await new Promise((r) => setTimeout(r, 600));
      setEnviado(true);
      setForm(initialForm);
    } finally {
      setEnviando(false);
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
      <div className="bg-qbChalk border border-qbBorder rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
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
    <div className="w-full bg-qbChalk border border-qbBorder rounded-3xl overflow-hidden shadow-sm grid lg:grid-cols-5">
      {/* Panel informativo */}
      <aside className="lg:col-span-2 bg-black/30 border-b lg:border-b-0 lg:border-r border-qbBorder p-6 sm:p-8 space-y-8">
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-qbMuted">
            Formulario oficial
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-qbInk leading-tight">
            Solicitud de Apoyo para Fundaciones
          </h3>
          <p className="text-sm text-qbMuted">
            Completa este formulario para evaluar la colaboración técnica de tu institución.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-qbInk">
            ¿Qué incluye el apoyo?
          </h4>
          <ul className="space-y-2">
            {incluye.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-qbMuted">
                <Icon name="check" className="mt-0.5 text-qbSage" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-qbInk">¿Cómo funciona?</h4>
          <ol className="space-y-4">
            {pasos.map((p) => (
              <li key={p.n} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-qbInk text-[11px] font-bold text-qbChalk">
                  {p.n}
                </span>
                <div>
                  <p className="text-sm font-semibold text-qbInk">{p.titulo}</p>
                  <p className="text-xs text-qbMuted">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="lg:col-span-3 p-6 sm:p-8 space-y-8">
        {/* 1 · Organización y contacto */}
        <div className="space-y-4">
          <Seccion n="1" titulo="Organización y contacto" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="nombreEntidad" className={etiqueta}>
                Nombre de la organización / fundación *
              </label>
              <input
                id="nombreEntidad"
                name="nombreEntidad"
                className={campo}
                required
                value={form.nombreEntidad}
                onChange={handleChange}
                placeholder="Ej. Bomberos Voluntarios 5.ª Cía."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="tipoEntidad" className={etiqueta}>
                Tipo de organización
              </label>
              <select
                id="tipoEntidad"
                name="tipoEntidad"
                className={`${campo} [&>option]:bg-qbChalk [&>option]:text-qbInk`}
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
              <label htmlFor="personaContacto" className={etiqueta}>
                Nombre de la persona de contacto *
              </label>
              <input
                id="personaContacto"
                name="personaContacto"
                className={campo}
                required
                value={form.personaContacto}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="telefono" className={etiqueta}>
                Teléfono / WhatsApp
              </label>
              <input
                id="telefono"
                name="telefono"
                className={campo}
                value={form.telefono ?? ''}
                onChange={handleChange}
                placeholder="+502 5123-4567"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="correo" className={etiqueta}>
                Correo electrónico *
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                className={campo}
                required
                value={form.correo}
                onChange={handleChange}
                placeholder="contacto@fundacion.org"
              />
            </div>
          </div>
        </div>

        {/* 2 · Proyecto */}
        <div className="space-y-4">
          <Seccion n="2" titulo="Proyecto" />
          <div className="space-y-2 sm:max-w-xs">
            <label htmlFor="fechaEvento" className={etiqueta}>
              Fecha tentativa del evento
            </label>
            <input
              id="fechaEvento"
              name="fechaEvento"
              type="date"
              className={campo}
              value={form.fechaEvento ?? ''}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="descripcionProyecto" className={etiqueta}>
              Descripción del proyecto y apoyo requerido *
            </label>
            <textarea
              id="descripcionProyecto"
              name="descripcionProyecto"
              className={`${campo} resize-y`}
              required
              rows={5}
              value={form.descripcionProyecto ?? ''}
              onChange={handleChange}
              placeholder="Actividad, población objetivo, tipo de material audiovisual solicitado..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-2 text-xs text-qbMuted cursor-pointer">
            <input
              type="checkbox"
              name="aceptaTerminos"
              required
              checked={form.aceptaTerminos}
              onChange={handleChange}
              className="mt-0.5"
            />
            <span>Acepto los términos y condiciones para proyectos pro-bono de QBusiness Media.</span>
          </label>

          <button
            type="submit"
            disabled={enviando}
            className="w-full px-6 py-3 bg-qbInk text-qbChalk hover:opacity-90 rounded-xl text-xs font-bold uppercase tracking-wide transition flex items-center justify-center disabled:opacity-60"
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
    </div>
  );
}
