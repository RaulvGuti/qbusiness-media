
"use client";

import { useState, useTransition } from "react";
import {
  cambiarEstado,
  cambiarEstadoResena,
  guardarNota,
} from "@/server/services/admin-seguimiento";

type Registro = Record<string, string | number | boolean | null | undefined>;
type Seccion = "contacto" | "apoyo_social" | "resena";

const opcionesEstado: Record<Seccion, string[]> = {
  contacto: [
    "nuevo",
    "contactado",
    "cotizado",
    "en_proceso",
    "cerrado",
    "descartado",
  ],
  apoyo_social: [
    "nueva",
    "en_revision",
    "aprobada",
    "rechazada",
    "completada",
  ],
  resena: ["borrador", "publicada", "eliminada"],
};

const nombresEstado: Record<string, string> = {
  nuevo: "Nuevo",
  nueva: "Nueva",
  contactado: "Contactado",
  cotizado: "Cotizado",
  en_proceso: "En proceso",
  cerrado: "Cerrado",
  descartado: "Descartado",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  completada: "Completada",
  borrador: "Borrador",
  publicada: "Publicada",
  eliminada: "Oculta",
};

export default function SeguimientoAdminTable({
  seccion,
  registros,
}: {
  seccion: Seccion;
  registros: Registro[];
}) {
  const [mensaje, setMensaje] = useState("");
  const [pendiente, iniciarTransicion] = useTransition();

  function ejecutar(operacion: () => Promise<void>) {
    setMensaje("");

    iniciarTransicion(async () => {
      try {
        await operacion();
        setMensaje("Cambios guardados correctamente.");
      } catch (error) {
        setMensaje(
          error instanceof Error
            ? error.message
            : "No se pudieron guardar los cambios."
        );
      }
    });
  }

  return (
    <section className="space-y-5">
      {mensaje && (
        <p role="status" className="rounded-xl border p-3 text-sm">
          {mensaje}
        </p>
      )}

      {registros.length === 0 && (
        <p className="rounded-xl border border-qbBorder bg-white p-6 text-qbMuted">
          No hay registros disponibles.
        </p>
      )}

      {registros.map((registro) => {
        const id = String(registro.id);
        const nombre =
          registro.nombre ??
          registro.nombre_entidad ??
          registro.persona_contacto ??
          "Reseña de cliente";

        const correo = registro.correo ?? "";
        const telefono = registro.telefono ?? "";
        const fecha = registro.creado_en
          ? new Date(registro.creado_en).toLocaleString("es-GT")
          : "Sin fecha";

        const estadoActual =
          seccion === "resena"
            ? registro.publicado
              ? "publicada"
              : "borrador"
            : registro.estado;

        const notaInicial = registro.notas_admin ?? "";

        return (
          <article
            key={id}
            className="space-y-4 rounded-2xl border border-qbBorder bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="font-bold text-qbInk">{nombre}</h2>
                {correo && <p className="text-sm">{correo}</p>}
                {telefono && <p className="text-sm">{telefono}</p>}
                <p className="text-xs text-qbMuted">{fecha}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {registro.origen && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      registro.origen === "apoyo_social"
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {registro.origen === "apoyo_social"
                      ? "Apoyo Social"
                      : "Contacto General"}
                  </span>
                )}
                <span className="rounded-full border px-3 py-1 text-xs font-semibold">
                  {nombresEstado[estadoActual] ?? estadoActual}
                </span>
              </div>
            </div>

            {seccion === "contacto" && (
              <div className="space-y-2 text-sm">
                {registro.empresa && <p>Empresa: {registro.empresa}</p>}
                {registro.tipo_servicio && (
                  <p>Servicio: {registro.tipo_servicio}</p>
                )}
                {registro.presupuesto && (
                  <p>Presupuesto: {registro.presupuesto}</p>
                )}
                <p className="whitespace-pre-wrap">
                  {registro.mensaje || "Sin mensaje"}
                </p>
              </div>
            )}

            {seccion === "apoyo_social" && (
              <div className="space-y-2 text-sm">
                <p>Entidad: {registro.nombre_entidad}</p>
                <p>Contacto: {registro.persona_contacto}</p>
                {registro.tipo_organizacion && (
                  <p>Tipo: {registro.tipo_organizacion}</p>
                )}
                <p className="whitespace-pre-wrap">
                  {registro.descripcion_proyecto || "Sin descripción"}
                </p>
                {registro.ubicacion && <p>Ubicación: {registro.ubicacion}</p>}
              </div>
            )}

            {seccion === "resena" && (
              <div className="space-y-2 text-sm">
                <p>
                  Calificación: {"★".repeat(registro.calificacion ?? 0)}
                  {"☆".repeat(5 - (registro.calificacion ?? 0))}
                </p>
                <p className="whitespace-pre-wrap">
                  {registro.comentario}
                </p>
                <p className="text-xs text-qbMuted">
                  Reserva relacionada: {registro.reserva_id}
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">
                Estado
                <select
                  className="w-full rounded-xl border border-qbBorder p-3"
                  value={estadoActual}
                  disabled={pendiente}
                  onChange={(e) => {
                    const estado = e.target.value;

                    ejecutar(async () => {
                      if (seccion === "resena") {
                        await cambiarEstadoResena(
                          id,
                          estado as "borrador" | "publicada" | "eliminada"
                        );
                      } else {
                        await cambiarEstado(
                          seccion,
                          id,
                          estado
                        );
                      }
                    });
                  }}
                >
                  {opcionesEstado[seccion].map((estado) => (
                    <option key={estado} value={estado}>
                      {nombresEstado[estado] ?? estado}
                    </option>
                  ))}
                </select>
              </label>

              <NotaAdmin
                key={`${id}-${notaInicial}`}
                id={id}
                seccion={seccion}
                notaInicial={notaInicial}
                pendiente={pendiente}
                guardar={(nota) =>
                  ejecutar(() => guardarNota(seccion, id, nota))
                }
              />
            </div>
          </article>
        );
      })}
    </section>
  );
}

function NotaAdmin({
  notaInicial,
  pendiente,
  guardar,
}: {
  id: string;
  seccion: Seccion;
  notaInicial: string;
  pendiente: boolean;
  guardar: (nota: string) => void;
}) {
  const [nota, setNota] = useState(notaInicial);

  return (
    <div className="space-y-2 text-sm font-semibold">
      <label>Nota privada del administrador</label>
      <textarea
        className="min-h-24 w-full rounded-xl border border-qbBorder p-3 font-normal"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Escribe observaciones internas..."
      />
      <button
        type="button"
        disabled={pendiente || !nota.trim()}
        onClick={() => guardar(nota)}
        className="rounded-xl bg-qbInk px-4 py-2 text-white disabled:opacity-50"
      >
        Guardar nota
      </button>
    </div>
  );
}
