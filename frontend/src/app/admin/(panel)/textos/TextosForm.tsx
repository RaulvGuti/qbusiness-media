"use client";

import { useId, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { guardarConfiguracion } from "@/server/repositories/configuracion";
import shared from "../panel.module.css";
import { PESTANAS } from "./datos";
import styles from "./page.module.css";

interface TextosFormProps {
  /** Valores iniciales: clave `${grupo}:${clave}` → valor. */
  valoresIniciales: Record<string, string>;
}

export function TextosForm({ valoresIniciales }: TextosFormProps) {
  const base = useId();
  const toast = useToast();
  const [activa, setActiva] = useState<string>(PESTANAS[0].id);
  const [valores, setValores] = useState<Record<string, string>>(valoresIniciales);
  const [guardando, setGuardando] = useState(false);

  const onChange = (grupo: string, clave: string, valor: string) => {
    setValores((v) => ({ ...v, [`${grupo}:${clave}`]: valor }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      // SUPABASE (admin): upsert por cada campo cambiado.
      //   INSERT INTO configuracion_sitio (grupo, clave, valor) VALUES (...)
      //   ON CONFLICT (grupo, clave) DO UPDATE SET valor = EXCLUDED.valor;
      const cambiados = Object.entries(valores).filter(
        ([k, v]) => v !== (valoresIniciales[k] ?? ""),
      );
      await Promise.all(
        cambiados.map(([k, v]) => {
          const [grupo, clave] = k.split(":");
          return guardarConfiguracion(
            grupo as Parameters<typeof guardarConfiguracion>[0],
            clave,
            v,
          );
        }),
      );
      toast(
        cambiados.length === 0
          ? "Sin cambios para guardar"
          : `${cambiados.length} valor${cambiados.length === 1 ? "" : "es"} guardado${cambiados.length === 1 ? "" : "s"}`,
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className={styles.tabs} role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={activa === p.id}
            className={`${styles.tab} ${activa === p.id ? styles.tabOn : ""}`}
            onClick={() => setActiva(p.id)}
          >
            {p.titulo}
          </button>
        ))}
      </div>

      {PESTANAS.map((p) => (
        <div key={p.id} role="tabpanel" hidden={activa !== p.id}>
          {p.grupos.map((g) => (
            <section key={g.titulo} className={styles.grp}>
              <h3>{g.titulo}</h3>
              <div className={styles.fields}>
                {g.campos.map((c) => {
                  const id = `${base}-${p.id}-${c.grupo}-${c.clave}`;
                  const key = `${c.grupo}:${c.clave}`;
                  const esLargo = c.tipo === "area";
                  return (
                    <div key={key} className={`${styles.field} ${esLargo ? styles.full : ""}`}>
                      <label htmlFor={id}>{c.etiqueta}</label>
                      {esLargo ? (
                        <textarea
                          id={id}
                          className={styles.input}
                          value={valores[key] ?? ""}
                          style={{ minHeight: c.alto ?? 80 }}
                          onChange={(e) => onChange(c.grupo, c.clave, e.target.value)}
                        />
                      ) : (
                        <input
                          id={id}
                          className={styles.input}
                          type={c.tipo === "numero" ? "number" : c.tipo === "hora" ? "time" : "text"}
                          value={valores[key] ?? ""}
                          onChange={(e) => onChange(c.grupo, c.clave, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ))}

      <div className={styles.bar}>
        <button
          type="button"
          className={shared.btn}
          onClick={() => setValores(valoresIniciales)}
        >
          Descartar cambios
        </button>
        <button type="submit" className={`${shared.btn} ${shared.btnPrimary}`} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
