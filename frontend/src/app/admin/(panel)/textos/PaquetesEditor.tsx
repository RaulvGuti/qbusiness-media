"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  cambiarActivoPaqueteAction,
  guardarPaqueteAction,
} from "@/server/services/paquetes/admin";
import {
  RESERVAS_PARA_DESCUENTO,
  PORCENTAJE_DESCUENTO_LEALTAD,
  etiquetaHoras,
} from "@/lib/estudio-paquetes";
import { CAMPO } from "@/lib/estilos-formulario";
import type { PaqueteEstudio, PaqueteEstudioInput } from "@/types/estudio";
import shared from "../panel.module.css";
import styles from "./page.module.css";

interface Props {
  paquetesIniciales: PaqueteEstudio[];
}

/**
 * Editor de paquetes dentro de "Textos y configuración → Renta de Estudio".
 *
 * No es un <form> propio: vive dentro del formulario de textos. Por eso todos
 * los botones son `type="button"` y las filas evitan que Enter dispare el
 * guardado global de la configuración.
 */
export function PaquetesEditor({ paquetesIniciales }: Props) {
  const toast = useToast();
  const [paquetes, setPaquetes] = useState(paquetesIniciales);
  const [error, setError] = useState<string | null>(null);

  const reemplazar = (paquete: PaqueteEstudio) => {
    setPaquetes((lista) =>
      lista.some((p) => p.id === paquete.id)
        ? lista.map((p) => (p.id === paquete.id ? paquete : p))
        : [...lista, paquete].sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre)),
    );
  };

  return (
    <section className={styles.grp}>
      <h3>Paquetes de renta</h3>
      <p className={styles.help}>
        La tarifa por hora ya no se usa. Cada reserva debe elegir uno de estos
        paquetes; si no hay paquetes activos, el sitio público bloquea el
        formulario. Las horas del paquete también fijan la hora de fin.
      </p>
      <p className={styles.help}>
        Lealtad: con {RESERVAS_PARA_DESCUENTO} o más reservas completadas, el
        cliente recibe {Math.round(PORCENTAJE_DESCUENTO_LEALTAD * 100)}% de
        descuento sobre el precio del paquete. Los servicios y equipos se cobran
        aparte, por hora.
      </p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {paquetes.length === 0 && (
          <p className={styles.help}>Todavía no hay paquetes. Crea el primero abajo.</p>
        )}

        {paquetes.map((paquete) => (
          <PaqueteFila
            key={paquete.id}
            paquete={paquete}
            onSaved={(actualizado) => {
              reemplazar(actualizado);
              toast("Paquete guardado");
            }}
            onActivoCambiado={(activo) => {
              setPaquetes((lista) =>
                lista.map((p) => (p.id === paquete.id ? { ...p, activo } : p)),
              );
              toast(activo ? "Paquete activado" : "Paquete desactivado");
            }}
            onError={setError}
          />
        ))}

        <NuevoPaquete
          onCreado={(nuevo) => {
            reemplazar(nuevo);
            toast("Paquete creado");
          }}
          onError={setError}
        />
      </div>
    </section>
  );
}

function PaqueteFila({
  paquete,
  onSaved,
  onActivoCambiado,
  onError,
}: {
  paquete: PaqueteEstudio;
  onSaved: (paquete: PaqueteEstudio) => void;
  onActivoCambiado: (activo: boolean) => void;
  onError: (error: string | null) => void;
}) {
  const [form, setForm] = useState({
    nombre: paquete.nombre,
    horas: String(paquete.horas),
    precio: String(paquete.precio),
    orden: String(paquete.orden),
  });
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo: keyof typeof form, valor: string) => {
    onError(null);
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardar = async () => {
    setEnviando(true);
    onError(null);
    try {
      const actualizado = await guardarPaqueteAction(paquete.id, {
        nombre: form.nombre,
        horas: Number(form.horas),
        precio: Number(form.precio),
        orden: Number(form.orden),
        activo: paquete.activo,
      });
      onSaved(actualizado);
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo guardar el paquete.");
    } finally {
      setEnviando(false);
    }
  };

  const cambiarActivo = async () => {
    setEnviando(true);
    onError(null);
    try {
      await cambiarActivoPaqueteAction(paquete.id, !paquete.activo);
      onActivoCambiado(!paquete.activo);
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo cambiar el estado.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-[#262626] bg-[#111] p-4 sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] sm:items-end">
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Nombre
        <input
          className={CAMPO}
          value={form.nombre}
          onChange={(e) => cambiar("nombre", e.target.value)}
          onKeyDown={evitarEnter}
          maxLength={80}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Horas
        <input
          className={CAMPO}
          type="number"
          min="0.5"
          max="24"
          step="0.5"
          value={form.horas}
          onChange={(e) => cambiar("horas", e.target.value)}
          onKeyDown={evitarEnter}
        />
        <small className={styles.help}>{etiquetaHoras(Number(form.horas) || 0)}</small>
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Precio (Q)
        <input
          className={CAMPO}
          type="number"
          min="0"
          step="0.01"
          value={form.precio}
          onChange={(e) => cambiar("precio", e.target.value)}
          onKeyDown={evitarEnter}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Orden
        <input
          className={CAMPO}
          type="number"
          step="1"
          value={form.orden}
          onChange={(e) => cambiar("orden", e.target.value)}
          onKeyDown={evitarEnter}
        />
      </label>
      <div className="flex flex-wrap gap-2 sm:flex-col">
        <button
          type="button"
          className={`${shared.btn} ${shared.btnPrimary}`}
          onClick={guardar}
          disabled={enviando}
        >
          Guardar
        </button>
        <button
          type="button"
          className={shared.btn}
          onClick={cambiarActivo}
          disabled={enviando}
        >
          {paquete.activo ? "Desactivar" : "Activar"}
        </button>
        <span className="text-center text-[11px] text-zinc-400">
          {paquete.activo ? "Activo" : "Inactivo"}
        </span>
      </div>
    </div>
  );
}

function NuevoPaquete({
  onCreado,
  onError,
}: {
  onCreado: (paquete: PaqueteEstudio) => void;
  onError: (error: string | null) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState<PaqueteEstudioInput>({
    nombre: "",
    horas: 2,
    precio: 0,
    orden: 0,
    activo: true,
  });

  if (!abierto) {
    return (
      <button
        type="button"
        className={shared.btn}
        onClick={() => {
          setAbierto(true);
          onError(null);
        }}
      >
        + Agregar paquete
      </button>
    );
  }

  const crear = async () => {
    setEnviando(true);
    onError(null);
    try {
      const nuevo = await guardarPaqueteAction(null, form);
      onCreado(nuevo);
      setAbierto(false);
      setForm({ nombre: "", horas: 2, precio: 0, orden: 0, activo: true });
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo crear el paquete.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-dashed border-[#3a3a3a] p-4 sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] sm:items-end">
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Nombre
        <input
          className={CAMPO}
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          onKeyDown={evitarEnter}
          maxLength={80}
          placeholder="Paquete 2 horas"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Horas
        <input
          className={CAMPO}
          type="number"
          min="0.5"
          max="24"
          step="0.5"
          value={form.horas}
          onChange={(e) => setForm((p) => ({ ...p, horas: Number(e.target.value) }))}
          onKeyDown={evitarEnter}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Precio (Q)
        <input
          className={CAMPO}
          type="number"
          min="0"
          step="0.01"
          value={form.precio}
          onChange={(e) => setForm((p) => ({ ...p, precio: Number(e.target.value) }))}
          onKeyDown={evitarEnter}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Orden
        <input
          className={CAMPO}
          type="number"
          step="1"
          value={form.orden}
          onChange={(e) => setForm((p) => ({ ...p, orden: Number(e.target.value) }))}
          onKeyDown={evitarEnter}
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          className={`${shared.btn} ${shared.btnPrimary}`}
          onClick={crear}
          disabled={enviando}
        >
          {enviando ? "Creando…" : "Crear"}
        </button>
        <button
          type="button"
          className={shared.btn}
          onClick={() => setAbierto(false)}
          disabled={enviando}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function evitarEnter(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") event.preventDefault();
}
