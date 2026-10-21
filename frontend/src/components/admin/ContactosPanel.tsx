
"use client";

import { useCallback, useEffect, useState } from "react";

type Contacto = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  mensaje: string | null;
  estado: "nuevo" | "contactado" | "cerrado";
  creado_en: string;
};

export default function ContactosPanel() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarContactos = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const respuesta = await fetch("/api/api/contactos");

      if (!respuesta.ok) {
        throw new Error(
          respuesta.status === 401 || respuesta.status === 403
            ? "Necesitas iniciar sesión como administrador."
            : "No se pudieron cargar los contactos."
        );
      }

      const datos = await respuesta.json();
      setContactos(datos.contactos ?? []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al cargar los contactos."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
  const controller = new AbortController();

  async function cargarInicial() {
    setError("");

    try {
      const respuesta = await fetch("/api/api/contactos", {
        signal: controller.signal,
      });

      if (!respuesta.ok) {
        throw new Error(
          respuesta.status === 401 || respuesta.status === 403
            ? "Necesitas iniciar sesión como administrador."
            : "No se pudieron cargar los contactos."
        );
      }

      const datos = await respuesta.json();

      if (!controller.signal.aborted) {
        setContactos(datos.contactos ?? []);
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(
          e instanceof Error
            ? e.message
            : "Error al cargar los contactos."
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setCargando(false);
      }
    }
  }

  void cargarInicial();

  return () => controller.abort();
}, []);

  async function cambiarEstado(id: string, estado: Contacto["estado"]) {
    setError("");

    try {
      const respuesta = await fetch(`/api/api/contactos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo actualizar el estado.");
      }

      await cargarContactos();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al actualizar el contacto."
      );
    }
  }

  if (cargando) return <p className="p-6">Cargando contactos...</p>;

  return (
    <section className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contactos</h1>
          <p className="text-sm text-gray-500">
            Contactos recibidos desde el sitio web.
          </p>
        </div>

        <button
          onClick={() => void cargarContactos()}
          className="rounded-lg border px-4 py-2"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}

      {contactos.length === 0 ? (
        <p>No hay contactos registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Mensaje</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>

            <tbody>
              {contactos.map((contacto) => (
                <tr key={contacto.id} className="border-t align-top">
                  <td className="p-3">{contacto.nombre}</td>
                  <td className="p-3">{contacto.correo}</td>
                  <td className="p-3">{contacto.telefono || "—"}</td>
                  <td className="max-w-xs whitespace-pre-wrap p-3">
                    {contacto.mensaje || "—"}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {new Date(contacto.creado_en).toLocaleDateString("es-GT")}
                  </td>
                  <td className="p-3">
                    <select
                      aria-label={`Estado de ${contacto.nombre}`}
                      value={contacto.estado}
                      onChange={(e) =>
                        void cambiarEstado(
                          contacto.id,
                          e.target.value as Contacto["estado"]
                        )
                      }
                      className="rounded-lg border p-2"
                    >
                      <option value="nuevo">Nuevo</option>
                      <option value="contactado">Contactado</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
