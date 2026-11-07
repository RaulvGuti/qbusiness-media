"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { guardarDestacados } from "@/server/repositories/galeria";
import shared from "../panel.module.css";
import { MODULOS, MODULO_EMPRESAS, iniciales, type ElementoCatalogo } from "./datos";
import styles from "./page.module.css";

interface DestacadosPanelProps {
  catalogo: ElementoCatalogo[];
  destacadosIniciales: string[];
}

export function DestacadosPanel({ catalogo, destacadosIniciales }: DestacadosPanelProps) {
  const toast = useToast();
  const [destacados, setDestacados] = useState<string[]>(destacadosIniciales);
  const [modulo, setModulo] = useState<string>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const lista = catalogo.filter(
    (c) => (modulo === "Todos" || c.modulo === modulo) && (!q || c.nombre.toLowerCase().includes(q)),
  );

  const alternar = (id: string) =>
    setDestacados((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  const mover = (i: number, j: number) =>
    setDestacados((d) => {
      const copia = [...d];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });

  const guardar = async () => {
    // La posición es el lugar en la lista (1..n); la BD reemplaza todos los destacados
    // en una sola transacción (guardar_destacados, migración 000037).
    const items = destacados.flatMap((id) => {
      const c = catalogo.find((x) => x.id === id);
      return c ? [{ tipo: c.tipo, id }] : [];
    });

    setGuardando(true);
    try {
      await guardarDestacados(items);
      toast("Destacados guardados");
    } catch (e) {
      toast(e instanceof Error && e.message ? e.message : "No se pudieron guardar los destacados");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.dest}>
      <section className={shared.card}>
        <h2 className={shared.cardTitle}>Catálogo</h2>
        <div className={shared.toolbar} style={{ marginBottom: 0 }}>
          <div className={shared.chips}>
            {["Todos", ...MODULOS.map((m) => m.texto), MODULO_EMPRESAS].map((m) => (
              <button
                key={m}
                type="button"
                className={`${shared.chip} ${m === modulo ? shared.on : ""}`}
                onClick={() => setModulo(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <input
            type="search"
            className={shared.search}
            placeholder="Buscar carpeta o empresa…"
            aria-label="Buscar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className={styles.cat}>
          {lista.length === 0 && (
            <p className={shared.empty} style={{ gridColumn: "1 / -1" }}>
              No hay resultados.
            </p>
          )}
          {lista.map((c) => {
            const activo = destacados.includes(c.id);
            return (
              <div key={c.id} className={`${styles.item} ${activo ? styles.on : ""}`}>
                <div className={styles.thumb}>
                  <span className={styles.kind}>{c.tipo === "empresa" ? "Empresa" : "Carpeta"}</span>
                  {iniciales(c.nombre)}
                </div>
                <div className={styles.itemB}>
                  <b>{c.nombre}</b>
                  <span>{c.modulo}</span>
                  <button
                    type="button"
                    className={`${shared.btn} ${shared.sm} ${activo ? shared.btnPrimary : ""}`}
                    onClick={() => alternar(c.id)}
                  >
                    {activo ? "★ Destacado" : "☆ Destacar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={shared.card}>
        <h2 className={shared.cardTitle}>
          Destacados actuales <span className={styles.badgeN}>{destacados.length}</span>
        </h2>
        <ol className={styles.flist}>
          {destacados.length === 0 && <li className={shared.empty}>Aún no hay destacados seleccionados.</li>}
          {destacados.map((id, i) => {
            const c = catalogo.find((x) => x.id === id);
            if (!c) return null;
            return (
              <li key={id} className={styles.fl}>
                <span className={styles.n}>{i + 1}</span>
                <div className={styles.t}>
                  <b>{c.nombre}</b>
                  <span>{c.modulo}</span>
                </div>
                <button
                  type="button"
                  className={styles.ib}
                  disabled={i === 0}
                  aria-label="Subir"
                  onClick={() => mover(i, i - 1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.ib}
                  disabled={i === destacados.length - 1}
                  aria-label="Bajar"
                  onClick={() => mover(i, i + 1)}
                >
                  ↓
                </button>
                <button type="button" className={styles.ib} aria-label="Quitar" onClick={() => alternar(id)}>
                  ✕
                </button>
              </li>
            );
          })}
        </ol>
        <div className={styles.savebar}>
          <button
            type="button"
            className={`${shared.btn} ${shared.btnPrimary}`}
            onClick={() => void guardar()}
            disabled={guardando}
          >
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </section>
    </div>
  );
}
