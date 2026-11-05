"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  cambiarActivoEquipoAction,
  guardarEquipoAction,
} from "@/server/services/equipos/admin";
import type { EquipoEstudio, EquipoEstudioInput } from "@/types/estudio";
import shared from "../panel.module.css";
import styles from "./page.module.css";

interface Props {
  equiposIniciales: EquipoEstudio[];
}

/**
 * CRUD del inventario de equipos (000005 + 000042).
 *
 * El precio es por hora y se suma encima del paquete de renta del salón. La
 * cantidad total es el stock máximo que se puede pedir en una reserva.
 */
export function EquipoPanel({ equiposIniciales }: Props) {
  const toast = useToast();
  const [equipos, setEquipos] = useState(equiposIniciales);
  const [error, setError] = useState<string | null>(null);

  const reemplazar = (equipo: EquipoEstudio) => {
    setEquipos((lista) =>
      lista.some((e) => e.id === equipo.id)
        ? lista.map((e) => (e.id === equipo.id ? equipo : e))
        : [...lista, equipo].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );
  };

  return (
    <section className={`${styles.grp} space-y-4`}>
      <h3>Renta de equipo</h3>
      <p className={styles.help}>
        Equipos que se pueden sumar a una reserva. Un equipo inactivo no aparece
        en el sitio público, pero conserva su historial y puede reactivarse.
      </p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {equipos.length === 0 && (
          <p className={styles.help}>Todavía no hay equipos. Crea el primero abajo.</p>
        )}

        {equipos.map((equipo) => (
          <EquipoFila
            key={equipo.id}
            equipo={equipo}
            onSaved={(actualizado) => {
              reemplazar(actualizado);
              toast("Equipo guardado");
            }}
            onActivoCambiado={(activo) => {
              setEquipos((lista) =>
                lista.map((e) => (e.id === equipo.id ? { ...e, activo } : e)),
              );
              toast(activo ? "Equipo activado" : "Equipo desactivado");
            }}
            onError={setError}
          />
        ))}

        <NuevoEquipo
          onCreado={(nuevo) => {
            reemplazar(nuevo);
            toast("Equipo creado");
          }}
          onError={setError}
        />
      </div>
    </section>
  );
}

function EquipoFila({
  equipo,
  onSaved,
  onActivoCambiado,
  onError,
}: {
  equipo: EquipoEstudio;
  onSaved: (equipo: EquipoEstudio) => void;
  onActivoCambiado: (activo: boolean) => void;
  onError: (error: string | null) => void;
}) {
  const [form, setForm] = useState({
    nombre: equipo.nombre,
    descripcion: equipo.descripcion ?? "",
    cantidadTotal: String(equipo.cantidadTotal),
    precioPorHora: String(equipo.precioPorHora),
  });
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    setEnviando(true);
    onError(null);
    try {
      const actualizado = await guardarEquipoAction(equipo.id, {
        nombre: form.nombre,
        descripcion: form.descripcion,
        cantidadTotal: Number(form.cantidadTotal),
        precioPorHora: Number(form.precioPorHora),
        activo: equipo.activo,
      });
      onSaved(actualizado);
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo guardar el equipo.");
    } finally {
      setEnviando(false);
    }
  };

  const cambiarActivo = async () => {
    setEnviando(true);
    onError(null);
    try {
      await cambiarActivoEquipoAction(equipo.id, !equipo.activo);
      onActivoCambiado(!equipo.activo);
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo cambiar el estado.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-[#262626] bg-[#111] p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_repeat(2,minmax(0,0.7fr))_auto] sm:items-end">
      <label className="flex flex-col gap-1 text-xs text-[#8a8a8a]">
        Nombre
        <input
          className={styles.input}
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          onKeyDown={evitarEnter}
          maxLength={120}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[#8a8a8a]">
        Descripción
        <input
          className={styles.input}
          value={form.descripcion}
          onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
          onKeyDown={evitarEnter}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[#8a8a8a]">
        Stock
        <input
          className={styles.input}
          type="number"
          min="0"
          step="1"
          value={form.cantidadTotal}
          onChange={(e) => setForm((p) => ({ ...p, cantidadTotal: e.target.value }))}
          onKeyDown={evitarEnter}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[#8a8a8a]">
        Precio/hora (Q)
        <input
          className={styles.input}
          type="number"
          min="0"
          step="0.01"
          value={form.precioPorHora}
          onChange={(e) => setForm((p) => ({ ...p, precioPorHora: e.target.value }))}
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
          {equipo.activo ? "Desactivar" : "Activar"}
        </button>
        <span className="text-center text-[11px] text-[#8a8a8a]">
          {equipo.activo ? "Activo" : "Inactivo"}
        </span>
      </div>
    </div>
  );
}

function NuevoEquipo({
  onCreado,
  onError,
}: {
  onCreado: (equipo: EquipoEstudio) => void;
  onError: (error: string | null) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState<EquipoEstudioInput>({
    nombre: "",
    descripcion: "",
    cantidadTotal: 1,
    precioPorHora: 0,
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
        + Agregar equipo
      </button>
    );
  }

  const crear = async () => {
    setEnviando(true);
    onError(null);
    try {
      const nuevo = await guardarEquipoAction(null, form);
      onCreado(nuevo);
      setAbierto(false);
      setForm({
        nombre: "",
        descripcion: "",
        cantidadTotal: 1,
        precioPorHora: 0,
        activo: true,
      });
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo crear el equipo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-dashed border-[#3a3a3a] p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_repeat(2,minmax(0,0.7fr))_auto] sm:items-end">
      <label className="flex flex-col gap-1 text-xs text-[#8a8a8a]">
        Nombre
        <input
          className={styles.input}
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          onKeyDown={evitarEnter}
          maxLength={120}
          placeholder="Cámara Sony FX3"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[#8a8a8a]">
        Descripción
        <input
          className={styles.input}
          value={form.descripcion ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
          onKeyDown={evitarEnter}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[#8a8a8a]">
        Stock
        <input
          className={styles.input}
          type="number"
          min="0"
          step="1"
          value={form.cantidadTotal}
          onChange={(e) =>
            setForm((p) => ({ ...p, cantidadTotal: Number(e.target.value) }))
          }
          onKeyDown={evitarEnter}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[#8a8a8a]">
        Precio/hora (Q)
        <input
          className={styles.input}
          type="number"
          min="0"
          step="0.01"
          value={form.precioPorHora}
          onChange={(e) =>
            setForm((p) => ({ ...p, precioPorHora: Number(e.target.value) }))
          }
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
