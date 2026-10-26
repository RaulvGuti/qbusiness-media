"use client";

import { useState, useTransition } from "react";
import {
  cambiarEstado,
  cambiarEstadoResena,
  guardarNota,
} from "@/server/services/admin-seguimiento";
import type { EstadoResena } from "@/types/resenas";

type Seccion = "contacto" | "apoyo_social" | "resena";

/** Registro genérico de seguimiento: cada sección trae columnas distintas. */
type Registro = {
  id: string;
  estado?: string;
  publicado?: boolean;
  correo?: string | null;
  telefono?: string | null;
  creado_en?: string | null;
  nombre?: string | null;
  nombre_entidad?: string | null;
  persona_contacto?: string | null;
  empresa?: string | null;
  tipo_servicio?: string | null;
  presupuesto?: string | null;
  mensaje?: string | null;
  tipo_organizacion?: string | null;
  tipo_entidad?: string | null;
  descripcion_proyecto?: string | null;
  ubicacion?: string | null;
  objetivo_apoyo?: string | null;
  publico_beneficiario?: string | null;
  fecha_evento?: string | null;
  fecha_tentativa?: string | null;
  calificacion?: number | null;
  comentario?: string | null;
  reserva_id?: string | null;
  notas_admin?: string | null;
  origen?: "contacto" | "apoyo_social" | string | null;
};

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
  resena: ["pendiente", "aprobada", "rechazada"],
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
  pendiente: "Pendiente",
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
        <p
          role="status"
          className="rounded-xl border border-[#3a3a3a] bg-[#161616] p-3 text-sm text-[#e8e8e8]"
        >
          {mensaje}
        </p>
      )}

      {registros.length === 0 && (
        <p className="rounded-xl border border-[#262626] bg-[#0d0d0d] p-6 text-[#8a8a8a]">
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
            ? (registro.estado ?? "pendiente")
            : (registro.estado ?? "");

        const notaInicial = registro.notas_admin ?? "";

        return (
          <article
            key={id}
            className="space-y-4 rounded-2xl border border-[#262626] bg-[#0d0d0d] p-5 shadow-sm"
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
              <div className="space-y-2 text-sm text-[#e8e8e8]">
                {registro.empresa && (
                  <p>
                    <span className="font-semibold text-white">Empresa:</span>{" "}
                    {registro.empresa}
                  </p>
                )}
                {registro.tipo_servicio && (
                  <p>
                    <span className="font-semibold text-white">Servicio:</span>{" "}
                    {registro.tipo_servicio}
                  </p>
                )}
                {registro.presupuesto && (
                  <p>
                    <span className="font-semibold text-white">
                      Presupuesto:
                    </span>{" "}
                    {registro.presupuesto}
                  </p>
                )}
                <p className="whitespace-pre-wrap">
                  <span className="font-semibold text-white">Mensaje:</span>{" "}
                  {registro.mensaje || "Sin mensaje"}
                </p>
              </div>
            )}

            {seccion === "apoyo_social" && (
              <div className="space-y-2 text-sm text-[#e8e8e8]">
                {registro.nombre_entidad && (
                  <p>
                    <span className="font-semibold text-white">Entidad:</span>{" "}
                    {registro.nombre_entidad}
                  </p>
                )}
                {registro.persona_contacto && (
                  <p>
                    <span className="font-semibold text-white">Contacto:</span>{" "}
                    {registro.persona_contacto}
                  </p>
                )}
                {(registro.tipo_entidad || registro.tipo_organizacion) && (
                  <p>
                    <span className="font-semibold text-white">Tipo:</span>{" "}
                    {registro.tipo_entidad ?? registro.tipo_organizacion}
                  </p>
                )}
                {(registro.fecha_evento || registro.fecha_tentativa) && (
                  <p>
                    <span className="font-semibold text-white">
                      Fecha del evento:
                    </span>{" "}
                    {registro.fecha_evento ?? registro.fecha_tentativa}
                  </p>
                )}
                {registro.ubicacion && (
                  <p>
                    <span className="font-semibold text-white">Ubicación:</span>{" "}
                    {registro.ubicacion}
                  </p>
                )}
                <p className="whitespace-pre-wrap">
                  <span className="font-semibold text-white">Descripción:</span>{" "}
                  {registro.descripcion_proyecto || "Sin descripción"}
                </p>
                {registro.objetivo_apoyo && (
                  <p className="whitespace-pre-wrap">
                    <span className="font-semibold text-white">
                      Objetivo de apoyo:
                    </span>{" "}
                    {registro.objetivo_apoyo}
                  </p>
                )}
                {registro.publico_beneficiario && (
                  <p>
                    <span className="font-semibold text-white">
                      Público beneficiario:
                    </span>{" "}
                    {registro.publico_beneficiario}
                  </p>
                )}
              </div>
            )}

            {seccion === "resena" && (
              <div className="space-y-2 text-sm">
                <p>
                  Calificación: {"★".repeat(registro.calificacion ?? 0)}
                  {"☆".repeat(5 - (registro.calificacion ?? 0))}
                </p>
                <p className="whitespace-pre-wrap">{registro.comentario}</p>
                {registro.reserva_id && (
                  <p className="text-xs text-qbMuted">
                    Reserva relacionada: {registro.reserva_id}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-[#e8e8e8]">
                Estado
                <select
                  className="w-full rounded-xl border border-[#262626] bg-[#171717] p-3 text-[#f2f2f2]"
                  value={estadoActual}
                  disabled={pendiente}
                  onChange={(e) => {
                    const estado = e.target.value;

                    ejecutar(async () => {
                      if (seccion === "resena") {
                        await cambiarEstadoResena(id, estado as EstadoResena);
                      } else {
                        await cambiarEstado(seccion, id, estado);
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
    <div className="space-y-2 text-sm font-semibold text-[#e8e8e8]">
      <label>Nota privada del administrador</label>
      <textarea
        className="min-h-24 w-full rounded-xl border border-[#262626] bg-[#171717] p-3 font-normal text-[#f2f2f2] placeholder:text-[#8a8a8a]"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Escribe observaciones internas..."
      />
      <button
        type="button"
        disabled={pendiente || !nota.trim()}
        onClick={() => guardar(nota)}
        className="rounded-xl border border-white bg-white px-4 py-2 font-semibold text-black transition hover:bg-[#d9d9d9] disabled:opacity-50"
      >
        Guardar nota
      </button>
    </div>
  );
}
