"use client";

import { useId, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { guardarConfiguracionSitio } from "@/server/actions/configuracion";
import type { CambioConfigSitio, GrupoConfig } from "@/types/config";
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
  const [valores, setValores] = useState<Record<string, string>>(
    valoresIniciales,
  );
  const [guardados, setGuardados] =
    useState<Record<string, string>>(valoresIniciales);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (grupo: string, clave: string, valor: string) => {
    setError(null);
    setValores((v) => ({ ...v, [`${grupo}:${clave}`]: valor }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cambiados = Object.entries(valores).filter(
      ([k, v]) => v !== (guardados[k] ?? ""),
    );

    if (cambiados.length === 0) {
      toast("Sin cambios para guardar");
      return;
    }

    const cambios: CambioConfigSitio[] = cambiados.map(([k, valor]) => {
      const [grupo, clave] = k.split(":") as [GrupoConfig, string];
      return { grupo, clave, valor };
    });

    setGuardando(true);
    try {
      const resultado = await guardarConfiguracionSitio(cambios);

      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }

      setGuardados(valores);
      toast(
        `${resultado.guardados} valor${resultado.guardados === 1 ? "" : "es"} guardado${resultado.guardados === 1 ? "" : "s"}`,
      );
    } catch {
      setError("No se pudo guardar la configuración. Intenta de nuevo.");
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
                  const esLargo = c.tipo === "area" || c.tipo === "lineas";
                  const ayudaId = c.ayuda ? `${id}-ayuda` : undefined;
                  return (
                    <div
                      key={key}
                      className={`${styles.field} ${c.full || esLargo ? styles.full : ""}`}
                    >
                      <label htmlFor={id}>{c.etiqueta}</label>
                      {esLargo ? (
                        <textarea
                          id={id}
                          className={styles.input}
                          value={valores[key] ?? ""}
                          style={{ minHeight: c.alto ?? 80 }}
                          aria-describedby={ayudaId}
                          spellCheck={false}
                          onChange={(e) =>
                            onChange(c.grupo, c.clave, e.target.value)
                          }
                        />
                      ) : (
                        <input
                          id={id}
                          className={styles.input}
                          type={tipoInput(c.tipo)}
                          value={valores[key] ?? ""}
                          aria-describedby={ayudaId}
                          onChange={(e) =>
                            onChange(c.grupo, c.clave, e.target.value)
                          }
                        />
                      )}
                      {c.ayuda && (
                        <small id={ayudaId} className={styles.help}>
                          {c.ayuda}
                        </small>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ))}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.bar}>
        <button
          type="button"
          className={shared.btn}
          onClick={() => {
            setValores(guardados);
            setError(null);
          }}
        >
          Descartar cambios
        </button>
        <button
          type="submit"
          className={`${shared.btn} ${shared.btnPrimary}`}
          disabled={guardando}
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function tipoInput(tipo: string | undefined): string {
  switch (tipo) {
    case "numero":
      return "number";
    case "hora":
      return "time";
    case "url":
      return "url";
    case "email":
      return "email";
    case "tel":
      return "tel";
    default:
      return "text";
  }
}
