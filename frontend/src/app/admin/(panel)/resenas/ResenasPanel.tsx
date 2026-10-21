
"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import shared from "../panel.module.css";
import styles from "./page.module.css";

type ResenaBD = {
  id: string;
  reserva_id: string;
  comentario: string;
  calificacion: number;
  publicado: boolean;
  creado_en: string;
};

type Filtro = "todas" | "pendiente" | "aprobada";

interface ResenasPanelProps {
  resenasIniciales: Resena[];
}

export function ResenasPanel({ resenasIniciales }: ResenasPanelProps) {
  const toast = useToast();
  const [resenas, setResenas] = useState<ResenaBD[]>([]);
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
        throw new Error(
          datos.error ?? "No se pudieron cargar las reseñas."
        );
      }

      setResenas(datos.resenas ?? []);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Error al cargar las reseñas."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
  const controlador = new AbortController();

  async function cargarInicial() {
    try {
      const respuesta = await fetch("/api/api/resenas", {
        cache: "no-store",
        signal: controlador.signal,
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ?? "No se pudieron cargar las reseñas."
        );
      }

      if (!controlador.signal.aborted) {
        setResenas(datos.resenas ?? []);
      }
    } catch (error) {
      if (!controlador.signal.aborted) {
        setError(
          error instanceof Error
            ? error.message
            : "Error al cargar las reseñas."
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

  async function cambiarPublicacion(resena: ResenaBD) {
    const nuevoEstado = !resena.publicado;
    setActualizando(resena.id);
    setError("");

    try {
      const respuesta = await fetch(
        `/api/api/resenas/${resena.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicado: nuevoEstado }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ?? "No se pudo actualizar la reseña."
        );
      }

      setResenas((actuales) =>
        actuales.map((r) =>
          r.id === resena.id ? datos.resena : r
        )
      );

      toast(
        nuevoEstado
          ? "Reseña publicada correctamente"
          : "Reseña ocultada correctamente"
      );
    } catch (e) {
      const mensaje =
        e instanceof Error
          ? e.message
          : "Error al actualizar la reseña.";

      setError(mensaje);
      toast(mensaje);
    } finally {
      setActualizando(null);
    }
  }

  const pendientes = resenas.filter((r) => !r.publicado).length;
  const publicadas = resenas.filter((r) => r.publicado).length;

  const visibles = resenas.filter((r) => {
    if (filtro === "pendiente") return !r.publicado;
    if (filtro === "aprobada") return r.publicado;
    return true;
  });

  const filtros: { clave: Filtro; texto: string; total: number }[] = [
    { clave: "todas", texto: "Todas", total: resenas.length },
    { clave: "pendiente", texto: "Ocultas", total: pendientes },
    { clave: "aprobada", texto: "Publicadas", total: publicadas },
  ];

  return (
    <>
      <div className={styles.stats}>
        <div className={`${styles.stat} ${styles.hl}`}>
          <span>Ocultas</span>
          <b>{pendientes}</b>
          <small>No visibles al público</small>
        </div>

        <div className={styles.stat}>
          <span>Publicadas</span>
          <b>{publicadas}</b>
          <small>Visibles en el sitio</small>
        </div>

        <div className={styles.stat}>
          <span>Total</span>
          <b>{resenas.length}</b>
          <small>Reseñas registradas</small>
        </div>
      </div>

      <div className={shared.toolbar}>
        <div className={shared.chips}>
          {filtros.map((item) => (
            <button
              key={item.clave}
              type="button"
              className={`${shared.chip} ${
                filtro === item.clave ? shared.on : ""
              }`}
              onClick={() => setFiltro(item.clave)}
            >
              {item.texto}
              <small>{item.total}</small>
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
                    <b>Reseña de cliente</b>
                    <span>
                      {new Date(resena.creado_en).toLocaleDateString(
                        "es-GT",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>

                  <span
                    className={styles.stars}
                    aria-label={`${resena.calificacion} de 5 estrellas`}
                  >
                    {"★".repeat(resena.calificacion)}
                    <i>
                      {"★".repeat(5 - resena.calificacion)}
                    </i>
                  </span>

                  <span
                    className={`${styles.st} ${
                      resena.publicado
                        ? styles.aprobada
                        : styles.pendiente
                    }`}
                  >
                    {resena.publicado ? "Publicada" : "Oculta"}
                  </span>
                </div>

                <p>{resena.comentario}</p>

                <div className={styles.meta}>
                  <span className={styles.tag}>
                    Reserva: {resena.reserva_id.slice(0, 8)}
                  </span>
                </div>
              </div>

              <div className={styles.acts}>
                <button
                  type="button"
                  className={`${shared.btn} ${
                    resena.publicado
                      ? shared.ghost
                      : shared.btnPrimary
                  } ${shared.sm}`}
                  onClick={() => void cambiarPublicacion(resena)}
                  disabled={actualizando === resena.id}
                >
                  {actualizando === resena.id
                    ? "Guardando..."
                    : resena.publicado
                      ? "Ocultar"
                      : "Publicar"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
