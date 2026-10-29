'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { PerfilUsuario } from '@/types/config';

export interface ReservaModalData {
  horas: number;
  tarifaBase: number;
  subtotalServicios: number;
  subtotalEquipos: number;
  total: number;
  serviciosIds: string[];
  equipos: { equipoId: string; cantidad: number }[];
}

/** Forma exacta de la RPC solicitar_reserva (000019). */
export interface ReservaModalForm {
  nombre: string;
  correo: string;
  telefono: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  notas: string;
}

interface ReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumen: ReservaModalData;
  /** Perfil del cliente autenticado; si es `null`, se bloquea el envío y se envía a registro. */
  cliente?: PerfilUsuario | null;
  onSubmit?: (form: ReservaModalForm) => void | Promise<void>;
}

const initialForm: ReservaModalForm = {
  nombre: '',
  correo: '',
  telefono: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  notas: '',
};

export default function ReservaModal({
  isOpen,
  onClose,
  resumen,
  cliente = null,
  onSubmit,
}: ReservaModalProps) {
  const [form, setForm] = useState<ReservaModalForm>(() => ({
    ...initialForm,
    nombre: cliente?.nombreCompleto ?? '',
    correo: cliente?.correo ?? '',
    telefono: cliente?.telefono ?? '',
  }));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const usuarioRegistrado = Boolean(cliente?.id);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioRegistrado) {
      setError('Debes registrarte e iniciar sesión para poder solicitar una reserva.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      // Validación local alineada al trigger validar_horario_atencion (000029):
      // la reserva debe empezar y terminar el mismo día.
      if (form.horaFin <= form.horaInicio) {
        setError('La hora de fin debe ser posterior a la hora de inicio.');
        return;
      }
      await onSubmit?.(form);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo registrar la solicitud de reserva.',
      );
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    setForm({
      ...initialForm,
      nombre: cliente?.nombreCompleto ?? '',
      correo: cliente?.correo ?? '',
      telefono: cliente?.telefono ?? '',
    });
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <div className="relative w-full max-w-2xl bg-qbChalk rounded-3xl shadow-xl border border-qbBorder overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-qbBorder">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-qbInk">
              Solicitar reserva de estudio
            </h2>
            <p className="text-sm text-qbMuted">
              Completa tus datos para revisar disponibilidad.
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="reserva-nombre" className="text-sm font-semibold text-qbInk">
                Nombre completo *
              </label>
              <input
                id="reserva-nombre"
                name="nombre"
                required
                value={form.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="reserva-correo" className="text-sm font-semibold text-qbInk">
                  Correo electrónico *
                </label>
                <input
                  id="reserva-correo"
                  name="correo"
                  type="email"
                  required
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reserva-telefono" className="text-sm font-semibold text-qbInk">
                  Teléfono / WhatsApp *
                </label>
                <input
                  id="reserva-telefono"
                  name="telefono"
                  required
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="+502 0000 0000"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="reserva-fecha" className="text-sm font-semibold text-qbInk">
                  Fecha *
                </label>
                <input
                  id="reserva-fecha"
                  name="fecha"
                  type="date"
                  required
                  value={form.fecha}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reserva-inicio" className="text-sm font-semibold text-qbInk">
                  Hora inicio *
                </label>
                <input
                  id="reserva-inicio"
                  name="horaInicio"
                  type="time"
                  required
                  value={form.horaInicio}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reserva-fin" className="text-sm font-semibold text-qbInk">
                  Hora fin *
                </label>
                <input
                  id="reserva-fin"
                  name="horaFin"
                  type="time"
                  required
                  value={form.horaFin}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="reserva-notas" className="text-sm font-semibold text-qbInk">
                Notas / detalles
              </label>
              <textarea
                id="reserva-notas"
                name="notas"
                rows={3}
                value={form.notas}
                onChange={handleChange}
                placeholder="Proyecto, necesidades específicas, etc."
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </p>
          )}

          <div className="border border-qbBorder rounded-2xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-qbInk">Resumen de la reserva</h3>
            <dl className="text-sm space-y-1">
              <div className="flex justify-between">
                <dt className="text-qbMuted">Horas estimadas</dt>
                <dd className="font-medium text-qbInk">{resumen.horas}h</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-qbMuted">Tarifa base del salón</dt>
                <dd className="font-medium text-qbInk">Q{resumen.tarifaBase.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-qbMuted">Servicios extra</dt>
                <dd className="font-medium text-qbInk">Q{resumen.subtotalServicios.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-qbMuted">Equipo rentable</dt>
                <dd className="font-medium text-qbInk">Q{resumen.subtotalEquipos.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between border-t border-qbBorder pt-1 mt-1">
                <dt className="font-bold text-qbInk">Total estimado</dt>
                <dd className="font-extrabold text-qbInk">Q{resumen.total.toFixed(2)}</dd>
              </div>
            </dl>
            <p className="text-[11px] text-qbMuted">
              El precio final lo calcula el servidor. La reserva queda en estado
              pendiente hasta que el equipo la confirme.
            </p>
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
                  <Icon name="calendar" className="mr-2" />
                  Solicitar reserva
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
