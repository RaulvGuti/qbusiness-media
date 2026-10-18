"use client";

import { useId, useState } from "react";
import shared from "../panel.module.css";
import { PESTANAS } from "./datos";
import styles from "./page.module.css";

export function TextosForm() {
  const base = useId();
  const [activa, setActiva] = useState<string>(PESTANAS[0].id);
  const [parqueo, setParqueo] = useState(true);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
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
                  const id = `${base}-${p.id}-${c.etiqueta}`;
                  const ancho = "largo" in c && c.largo ? styles.full : "";
                  return (
                    <div key={c.etiqueta} className={`${styles.field} ${ancho}`}>
                      <label htmlFor={id}>{c.etiqueta}</label>
                      {"largo" in c && c.largo ? (
                        <textarea
                          id={id}
                          className={styles.input}
                          defaultValue={c.valor}
                          style={"alto" in c ? { minHeight: c.alto } : undefined}
                        />
                      ) : (
                        <input id={id} className={styles.input} defaultValue={c.valor} />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {p.id === "estudio" && (
            <section className={styles.grp}>
              <h3>Parqueo</h3>
              <div className={styles.fields}>
                <div className={`${styles.field} ${styles.full}`}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={parqueo}
                    className={styles.sw}
                    onClick={() => setParqueo(!parqueo)}
                  >
                    <span>Parqueo disponible</span>
                    <i className={`${styles.tg} ${parqueo ? styles.tgOn : ""}`} />
                  </button>
                </div>
                <div className={`${styles.field} ${styles.full}`}>
                  <label htmlFor={`${base}-parqueo`}>Detalle del parqueo</label>
                  <input
                    id={`${base}-parqueo`}
                    className={styles.input}
                    defaultValue="Espacio para 3 vehículos dentro de las instalaciones"
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      ))}

      <div className={styles.bar}>
        <button type="reset" className={shared.btn}>
          Descartar cambios
        </button>
        <button type="submit" className={`${shared.btn} ${shared.btnPrimary}`}>
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
