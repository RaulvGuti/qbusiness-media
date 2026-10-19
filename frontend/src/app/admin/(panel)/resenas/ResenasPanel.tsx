"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { CATALOGO, iniciales } from "../destacados/datos";
import shared from "../panel.module.css";
import {
  FILTROS_ESTADO,
  FILTROS_TIPO,
  RESENAS_INICIALES,
  type Estado,
  type Resena,
  type Video,
} from "./datos";
import styles from "./page.module.css";

function Estrellas({ n }: { n: number }) {
  return (
    <span className={styles.stars} aria-label={`${n} de 5 estrellas`}>
      {"★".repeat(n)}
      <i>{"★".repeat(5 - n)}</i>
    </span>
  );
}

function Miniatura({ video, onPlay }: { video: Video; onPlay: () => void }) {
  return (
    <div
      className={styles.vid}
      style={{ aspectRatio: video.ratio }}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onPlay()}
    >
      {video.url ? (
        <video src={video.url} muted preload="metadata" />
      ) : (
        <div className={styles.ph}>
          <span className={styles.play}>▶</span>Video
        </div>
      )}
      <span className={styles.ratio}>{video.label}</span>
    </div>
  );
}

function mcd(a: number, b: number): number {
  return b ? mcd(b, a % b) : a;
}

export function ResenasPanel() {
  const toast = useToast();
  const [resenas, setResenas] = useState<Resena[]>(RESENAS_INICIALES);
  const [estado, setEstado] = useState<"todas" | Estado>("todas");
  const [tipo, setTipo] = useState<(typeof FILTROS_TIPO)[number]["clave"]>("todos");
  const [aEliminar, setAEliminar] = useState<number | null>(null);
  const [verVideo, setVerVideo] = useState<Resena | null>(null);

  const [nuevaAbierta, setNuevaAbierta] = useState(false);
  const [autor, setAutor] = useState("");
  const [texto, setTexto] = useState("");
  const [estrellas, setEstrellas] = useState(5);
  const [proyecto, setProyecto] = useState("");
  const [video, setVideo] = useState<Video | null>(null);

  const proyectos = CATALOGO.filter((c) => c.modulo !== "Empresas");
  const cuenta = (e: "todas" | Estado) =>
    e === "todas" ? resenas.length : resenas.filter((r) => r.estado === e).length;
  const visibles = resenas.filter(
    (r) =>
      (estado === "todas" || r.estado === estado) &&
      (tipo === "todos" || (tipo === "video" ? r.video : !r.video)),
  );

  const cambiar = (id: number, nuevo: Estado) => {
    setResenas((rs) => rs.map((r) => (r.id === id ? { ...r, estado: nuevo } : r)));
    toast(nuevo === "aprobada" ? "Reseña aprobada" : "Reseña rechazada");
  };

  const abrirNueva = () => {
    setAutor("");
    setTexto("");
    setEstrellas(5);
    setProyecto(proyectos[0]?.nombre ?? "");
    setVideo(null);
    setNuevaAbierta(true);
  };

  const elegirVideo = (archivo: File | undefined) => {
    if (!archivo) return setVideo(null);
    const url = URL.createObjectURL(archivo);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const g = mcd(el.videoWidth, el.videoHeight);
      const label = `${el.videoWidth / g}:${el.videoHeight / g}`;
      setVideo({
        url,
        ratio: `${el.videoWidth}/${el.videoHeight}`,
        label: label.length <= 7 ? label : `${(el.videoWidth / el.videoHeight).toFixed(2)}:1`,
      });
    };
    el.src = url;
  };

  const publicar = () => {
    if (!autor.trim() || !texto.trim()) return toast("Completa autor y texto");
    setResenas((rs) => [
      {
        id: Date.now(),
        autor: autor.trim(),
        fecha: "Ahora",
        estrellas,
        texto: texto.trim(),
        estado: "aprobada",
        proyecto,
        video,
      },
      ...rs,
    ]);
    setEstado("todas");
    setTipo("todos");
    setNuevaAbierta(false);
    toast("Reseña publicada");
  };

  const eliminar = () => {
    setResenas((rs) => rs.filter((r) => r.id !== aEliminar));
    setAEliminar(null);
    toast("Reseña eliminada");
  };

  return (
    <>
      <div className={styles.stats}>
        <div className={`${styles.stat} ${styles.hl}`}>
          <span>Pendientes</span>
          <b>{cuenta("pendiente")}</b>
          <small>Por revisar</small>
        </div>
        <div className={styles.stat}>
          <span>Aprobadas</span>
          <b>{cuenta("aprobada")}</b>
          <small>Publicadas</small>
        </div>
        <div className={styles.stat}>
          <span>Rechazadas</span>
          <b>{cuenta("rechazada")}</b>
          <small>Ocultas</small>
        </div>
        <div className={styles.stat}>
          <span>Con video</span>
          <b>{resenas.filter((r) => r.video).length}</b>
          <small>Reseñas en video</small>
        </div>
      </div>

      <div className={shared.toolbar}>
        <div className={shared.chips}>
          {FILTROS_ESTADO.map(({ clave, texto: t }) => (
            <button
              key={clave}
              type="button"
              className={`${shared.chip} ${clave === estado ? shared.on : ""}`}
              onClick={() => setEstado(clave)}
            >
              {t}
              <small>{cuenta(clave)}</small>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div className={shared.chips}>
            {FILTROS_TIPO.map(({ clave, texto: t }) => (
              <button
                key={clave}
                type="button"
                className={`${shared.chip} ${clave === tipo ? shared.on : ""}`}
                onClick={() => setTipo(clave)}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`${shared.btn} ${shared.btnPrimary} ${shared.sm}`}
            onClick={abrirNueva}
          >
            + Nueva reseña
          </button>
        </div>
      </div>

      <div className={styles.rvList}>
        {visibles.length === 0 && (
          <div className={`${shared.card} ${shared.empty}`}>No hay reseñas con estos filtros.</div>
        )}
        {visibles.map((r) => (
          <article key={r.id} className={`${styles.rv} ${r.video ? styles.hasVideo : ""}`}>
            {r.video && <Miniatura video={r.video} onPlay={() => setVerVideo(r)} />}
            <div className={styles.rvMain}>
              <div className={styles.rvHead}>
                <div className={styles.avatar}>{iniciales(r.autor)}</div>
                <div className={styles.author}>
                  <b>{r.autor}</b>
                  <span>{r.fecha}</span>
                </div>
                <Estrellas n={r.estrellas} />
                <span className={`${styles.st} ${styles[r.estado]}`}>{r.estado}</span>
              </div>
              <p>{r.texto}</p>
              <div className={styles.meta}>
                <span className={styles.tag}>{r.video ? "Video" : "Texto"}</span>
                {r.proyecto ? (
                  <span className={`${styles.tag} ${styles.proj}`}>Proyecto: {r.proyecto}</span>
                ) : (
                  <span className={styles.tag}>Enviada por visitante</span>
                )}
              </div>
            </div>
            <div className={styles.acts}>
              {r.estado !== "aprobada" && (
                <button
                  type="button"
                  className={`${shared.btn} ${shared.btnPrimary} ${shared.sm}`}
                  onClick={() => cambiar(r.id, "aprobada")}
                >
                  Aprobar
                </button>
              )}
              {r.estado !== "rechazada" && (
                <button
                  type="button"
                  className={`${shared.btn} ${shared.ghost} ${shared.sm}`}
                  onClick={() => cambiar(r.id, "rechazada")}
                >
                  Rechazar
                </button>
              )}
              <button
                type="button"
                className={`${shared.btn} ${shared.ghost} ${shared.danger} ${shared.sm}`}
                onClick={() => setAEliminar(r.id)}
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>

      {nuevaAbierta && (
        <div
          className={`${shared.modal} ${shared.on}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="nueva-titulo"
        >
          <div className={shared.dlg}>
            <h3 id="nueva-titulo">Nueva reseña (administrador)</h3>
            <div className={shared.f}>
              <label htmlFor="n-autor">Autor</label>
              <input
                id="n-autor"
                placeholder="Nombre del cliente o empresa"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
              />
            </div>
            <div className={shared.f}>
              <label>Calificación</label>
              <div className={styles.starpick}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    className={i <= estrellas ? styles.on : ""}
                    aria-label={`${i} estrellas`}
                    onClick={() => setEstrellas(i)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className={shared.f}>
              <label htmlFor="n-proyecto">Proyecto asociado</label>
              <select id="n-proyecto" value={proyecto} onChange={(e) => setProyecto(e.target.value)}>
                {proyectos.map((p) => (
                  <option key={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className={shared.f}>
              <label htmlFor="n-texto">Texto de la reseña</label>
              <textarea
                id="n-texto"
                placeholder="Escribe la reseña…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
            </div>
            <div className={shared.f}>
              <label htmlFor="n-video">Video (opcional)</label>
              <input
                id="n-video"
                type="file"
                accept="video/*"
                onChange={(e) => elegirVideo(e.target.files?.[0])}
              />
              {video?.url && (
                <div
                  className={styles.prev}
                  style={{
                    aspectRatio: video.ratio,
                    width:
                      video.ratio.split("/").map(Number)[1] > video.ratio.split("/").map(Number)[0]
                        ? "min(100%,220px)"
                        : "100%",
                    maxHeight: 320,
                    display: "block",
                  }}
                >
                  <video src={video.url} controls />
                </div>
              )}
            </div>
            <div className={shared.dlgAct}>
              <button
                type="button"
                className={`${shared.btn} ${shared.ghost}`}
                onClick={() => setNuevaAbierta(false)}
              >
                Cancelar
              </button>
              <button type="button" className={`${shared.btn} ${shared.btnPrimary}`} onClick={publicar}>
                Publicar reseña
              </button>
            </div>
          </div>
        </div>
      )}

      {aEliminar !== null && (
        <div
          className={`${shared.modal} ${shared.on}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="del-titulo"
        >
          <div className={shared.dlg} style={{ maxWidth: 420 }}>
            <h3 id="del-titulo">¿Eliminar reseña?</h3>
            <p style={{ color: "#8a8a8a", marginBottom: 18 }}>
              Esta acción no se puede deshacer. La reseña dejará de mostrarse en el sitio.
            </p>
            <div className={shared.dlgAct}>
              <button
                type="button"
                className={`${shared.btn} ${shared.ghost}`}
                onClick={() => setAEliminar(null)}
              >
                Cancelar
              </button>
              <button type="button" className={`${shared.btn} ${shared.btnPrimary}`} onClick={eliminar}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {verVideo?.video && (
        <div
          className={`${shared.modal} ${shared.on}`}
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa del video"
        >
          <div className={shared.dlg} style={{ maxWidth: 720, padding: 16 }}>
            <div
              style={{
                background: "#000",
                borderRadius: 12,
                overflow: "hidden",
                margin: "0 auto",
                width:
                  Number(verVideo.video.ratio.split("/")[1]) > Number(verVideo.video.ratio.split("/")[0])
                    ? "min(100%,360px)"
                    : "100%",
                aspectRatio: verVideo.video.ratio,
                maxHeight: "75vh",
              }}
            >
              {verVideo.video.url ? (
                <video
                  src={verVideo.video.url}
                  controls
                  autoPlay
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              ) : (
                <div className={styles.vid} style={{ width: "100%", height: "100%", border: 0 }}>
                  <div className={styles.ph}>
                    <span className={styles.play}>▶</span>Vista previa de ejemplo ({verVideo.video.label})
                  </div>
                </div>
              )}
            </div>
            <div className={shared.dlgAct}>
              <button
                type="button"
                className={`${shared.btn} ${shared.ghost}`}
                onClick={() => setVerVideo(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
