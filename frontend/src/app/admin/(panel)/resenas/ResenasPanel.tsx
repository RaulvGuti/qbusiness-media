"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { EstadoResena, ResenaCliente } from "@/types/resenas";
import shared from "../panel.module.css";
import styles from "./page.module.css";

type Filtro = "todas" | EstadoResena;

interface ResenasPanelProps {
  resenasIniciales: ResenaCliente[];
}

const FILTROS: { clave: Filtro; texto: string }[] = [
  { clave: "todas", texto: "Todas" },
  { clave: "pendiente", texto: "Pendientes" },
  { clave: "aprobada", texto: "Aprobadas" },
  { clave: "rechazada", texto: "Rechazadas" },
];

export function ResenasPanel({ resenasIniciales }: ResenasPanelProps) {
  const toast = useToast();
  const [resenas, setResenas] = useState<ResenaCliente[]>(resenasIniciales);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cargarResenas = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const respuesta = await fetch("/api/api/resenas", {
        cache: "no-store",
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error ?? "No se pudieron cargar las reseñas.");
      }

      setResenas(datos.resenas ?? []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al cargar las reseñas."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const controlador = new AbortController();

    async function cargarInicial() {
      setError("");

      try {
        const respuesta = await fetch("/api/api/resenas", {
          cache: "no-store",
          signal: controlador.signal,
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.error ?? "No se pudieron cargar las reseñas.");
        }

        if (!controlador.signal.aborted) {
          setResenas(datos.resenas ?? []);
        }
      } catch (e) {
        if (!controlador.signal.aborted) {
          setError(
            e instanceof Error ? e.message : "Error al cargar las reseñas."
          );
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    void cargarInicial();

    return () => controlador.abort();
  }, []);

  async function cambiarEstado(resena: ResenaCliente, estado: EstadoResena) {
    setActualizando(resena.id);
    setError("");

    try {
      const respuesta = await fetch(`/api/api/resenas/${resena.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error ?? "No se pudo actualizar la reseña.");
      }

      setResenas((actuales) =>
        actuales.map((r) => (r.id === resena.id ? datos.resena : r))
      );

      toast(
        estado === "aprobada"
          ? "Reseña aprobada correctamente"
          : estado === "rechazada"
            ? "Reseña rechazada correctamente"
            : "Reseña marcada como pendiente"
      );
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : "Error al actualizar la reseña.";

      setError(mensaje);
      toast(mensaje);
    } finally {
      setActualizando(null);
    }
  }

  const conteo: Record<EstadoResena, number> = {
    pendiente: resenas.filter((r) => r.estado === "pendiente").length,
    aprobada: resenas.filter((r) => r.estado === "aprobada").length,
    rechazada: resenas.filter((r) => r.estado === "rechazada").length,
  };

  const visibles = resenas.filter((r) =>
    filtro === "todas" ? true : r.estado === filtro
  );

  return (
    <>
      <div className={styles.stats}>
        <div className={`${styles.stat} ${styles.hl}`}>
          <span>Pendientes</span>
          <b>{conteo.pendiente}</b>
          <small>Sin moderar</small>
        </div>

        <div className={styles.stat}>
          <span>Aprobadas</span>
          <b>{conteo.aprobada}</b>
          <small>Visibles en el sitio</small>
        </div>

        <div className={styles.stat}>
          <span>Rechazadas</span>
          <b>{conteo.rechazada}</b>
          <small>No visibles al público</small>
        </div>
      </div>

      <div className={shared.toolbar}>
        <div className={shared.chips}>
          {FILTROS.map((item) => (
            <button
              key={item.clave}
              type="button"
              className={`${shared.chip} ${
                filtro === item.clave ? shared.on : ""
              }`}
              onClick={() => setFiltro(item.clave)}
            >
              {item.texto}
              <small>
                {item.clave === "todas" ? resenas.length : conteo[item.clave]}
              </small>
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`${shared.btn} ${shared.ghost} ${shared.sm}`}
          onClick={() => void cargarResenas()}
          disabled={cargando}
        >
          Actualizar
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: "#dc2626", marginBottom: 16 }}>
          {error}
        </p>
      )}

      {cargando ? (
        <div className={`${shared.card} ${shared.empty}`}>
          Cargando reseñas...
        </div>
      ) : visibles.length === 0 ? (
        <div className={`${shared.card} ${shared.empty}`}>
          No hay reseñas con este filtro.
        </div>
      ) : (
        <div className={styles.rvList}>
          {visibles.map((resena) => (
            <article key={resena.id} className={styles.rv}>
              <div className={styles.rvMain}>
                <div className={styles.rvHead}>
                  <div className={styles.avatar}>R</div>

                  <div className={styles.author}>
                    <b>{resena.autor}</b>
                    <span>
                      {new Date(resena.creadoEn).toLocaleDateString("es-GT", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {resena.calificacion !== null && (
                    <span
                      className={styles.stars}
                      aria-label={`${resena.calificacion} de 5 estrellas`}
                    >
                      {"★".repeat(resena.calificacion)}
                      <i>{"★".repeat(5 - resena.calificacion)}</i>
                    </span>
                  )}

                  <span
                    className={`${styles.st} ${
                      resena.estado === "aprobada"
                        ? styles.aprobada
                        : styles.pendiente
                    }`}
                  >
                    {resena.estado === "aprobada"
                      ? "Aprobada"
                      : resena.estado === "rechazada"
                        ? "Rechazada"
                        : "Pendiente"}
                  </span>
                </div>

                <p>{resena.comentario}</p>

                <div className={styles.meta}>
                  <span className={styles.tag}>
                    {resena.origen === "admin" ? "Reseña del equipo" : "Reseña de cliente"}
                  </span>
                  {resena.empresaAutor && (
                    <span className={styles.tag}>{resena.empresaAutor}</span>
                  )}
                </div>
              </div>

              <div className={styles.acts}>
                {resena.estado !== "aprobada" && (
                  <button
                    type="button"
                    className={`${shared.btn} ${shared.btnPrimary} ${shared.sm}`}
                    onClick={() => void cambiarEstado(resena, "aprobada")}
                    disabled={actualizando === resena.id}
                  >
                    {actualizando === resena.id ? "Guardando..." : "Aprobar"}
                  </button>
                )}

                {resena.estado !== "rechazada" && (
                  <button
                    type="button"
                    className={`${shared.btn} ${shared.ghost} ${shared.sm}`}
                    onClick={() => void cambiarEstado(resena, "rechazada")}
                    disabled={actualizando === resena.id}
                  >
                    Rechazar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
