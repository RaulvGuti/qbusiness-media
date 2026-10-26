"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type DragEvent,
  type FormEvent,
  type SetStateAction,
} from "react";
import { useToast } from "@/components/ui/Toast";
import { obtenerSupabase } from "@/lib/supabase/client";
import {
  actualizarEstadoCarpeta,
  actualizarPieFoto,
  crearCarpetaGaleria,
  definirPortada,
  eliminarArchivoGaleria,
  registrarArchivoGaleria,
  reordenarArchivos,
} from "@/server/repositories/galeria";
import type { ArchivoGaleria, CarpetaGaleria, Empresa } from "@/types/portafolio";

/* ------------------------------------------------------------------ */
/* Tipos y constantes                                                  */
/* ------------------------------------------------------------------ */

type ArchivoUI = ArchivoGaleria;
type CarpetaUI = CarpetaGaleria;

type Orientacion = "horizontal" | "vertical" | "cuadrada";

const MODULOS_GESTOR = [
  { id: "inicio", label: "Inicio", representa: "Cliente o campaña" },
  { id: "portafolio", label: "Portafolio", representa: "Cliente o campaña" },
  { id: "backstage", label: "Backstage", representa: "Sesión o proyecto" },
  { id: "estudio", label: "Renta de estudio", representa: "Set o espacio" },
  { id: "apoyo_social", label: "Apoyo social", representa: "Causa o actividad" },
] as const;

const NUEVA = "__nueva__";

interface Props {
  carpetas: CarpetaGaleria[];
  setCarpetas: Dispatch<SetStateAction<CarpetaGaleria[]>>;
  archivos: ArchivoGaleria[];
  setArchivos: Dispatch<SetStateAction<ArchivoGaleria[]>>;
  setEmpresas: Dispatch<SetStateAction<Empresa[]>>;
}

const BUCKET = "galeria";

const mensajeDe = (e: unknown, porDefecto: string) =>
  e instanceof Error && e.message ? e.message : porDefecto;

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const clasificar = (w: number, h: number): Orientacion =>
  Math.abs(w - h) / Math.max(w, h) < 0.05 ? "cuadrada" : w > h ? "horizontal" : "vertical";

type Medidas = { orientacion: Orientacion; ancho: number; alto: number };

function detectarMedidas(file: File, url: string): Promise<Medidas> {
  return new Promise((resolve) => {
    const porDefecto: Medidas = { orientacion: "horizontal", ancho: 0, alto: 0 };
    if (file.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const ancho = v.videoWidth || 16;
        const alto = v.videoHeight || 9;
        resolve({ orientacion: clasificar(ancho, alto), ancho, alto });
      };
      v.onerror = () => resolve(porDefecto);
      v.src = url;
    } else {
      const img = new Image();
      img.onload = () =>
        resolve({
          orientacion: clasificar(img.naturalWidth, img.naturalHeight),
          ancho: img.naturalWidth,
          alto: img.naturalHeight,
        });
      img.onerror = () => resolve(porDefecto);
      img.src = url;
    }
  });
}

/** URL para previsualizar un archivo ya guardado (bucket público `galeria`). */
function urlDe(a: ArchivoGaleria): string | undefined {
  if (a.tipo === "enlace") return a.urlMiniatura ?? undefined;
  if (a.rutaStorage) {
    return obtenerSupabase().storage.from(BUCKET).getPublicUrl(a.rutaStorage).data.publicUrl;
  }
  return a.urlExterna ?? undefined;
}
function parseEnlace(raw: string): { plataforma: "youtube" | "vimeo"; id: string } | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return { plataforma: "youtube", id: u.pathname.slice(1) };
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return id ? { plataforma: "youtube", id } : null;
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? { plataforma: "vimeo", id } : null;
    }
  } catch {
    /* URL inválida */
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export function GaleriaGestor({ carpetas, setCarpetas, archivos, setArchivos, setEmpresas }: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [moduloId, setModuloId] = useState("");
  const [carpetaId, setCarpetaId] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const [enlace, setEnlace] = useState("");
  const [modal, setModal] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const modulo = MODULOS_GESTOR.find((m) => m.id === moduloId);
  const carpetasModulo = (carpetas as CarpetaUI[]).filter((c) => c.modulo === moduloId);
  const carpeta = carpetasModulo.find((c) => c.id === carpetaId);
  const items = (archivos as ArchivoUI[]).filter((a) => a.carpetaId === carpetaId);

  const ruta = !modulo
    ? "Selecciona un módulo"
    : `${modulo.label} › ${carpeta ? carpeta.nombre : "(elige o crea una carpeta)"}`;

  /* ---------- Destino ---------- */

  const cambiarModulo = (id: string) => {
    setModuloId(id);
    setCarpetaId("");
  };

  const cambiarCarpeta = (id: string) => {
    if (id === NUEVA) {
      setModal(true);
      return;
    }
    setCarpetaId(id);
  };

  const crearCarpeta = async (datos: { nombre: string; etiqueta: string; descripcion: string; filtro: string }) => {
    try {
      // La BD crea la carpeta y, en Inicio/Portafolio, busca o crea la empresa y la enlaza.
      const { carpeta: nueva, empresa } = await crearCarpetaGaleria({ modulo: moduloId, ...datos });
      setCarpetas((prev) => [nueva, ...prev]);
      if (empresa) {
        setEmpresas((prev) => (prev.some((e) => e.id === empresa.id) ? prev : [empresa, ...prev]));
      }
      setCarpetaId(nueva.id);
      setModal(false);
      toast("Carpeta creada");
    } catch (e) {
      toast(mensajeDe(e, "No se pudo crear la carpeta"));
    }
  };

  /* ---------- Subida ---------- */

  const procesarArchivos = async (lista: FileList | File[]) => {
    if (!carpeta) {
      toast("Primero elige o crea una carpeta");
      return;
    }
    const validos = Array.from(lista).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
    );
    if (validos.length === 0) {
      toast("Solo se aceptan fotos o videos");
      return;
    }

    setSubiendo(true);
    const supabase = obtenerSupabase();
    const nuevos: ArchivoGaleria[] = [];
    let fallos = 0;
    let ultimoError = "";

    // En serie: así el primero que se registre es el que queda como portada.
    for (const file of validos) {
      const preview = URL.createObjectURL(file);
      let ruta: string | null = null;
      try {
        const medidas = await detectarMedidas(file, preview);
        const ext = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
        ruta = `${carpeta.id}/${crypto.randomUUID()}.${ext}`;

        // Subida directa al bucket con la sesión del administrador (política galeria_insert_admin).
        const { error } = await supabase.storage.from(BUCKET).upload(ruta, file, {
          contentType: file.type,
          cacheControl: "31536000",
          upsert: false,
        });
        if (error) throw error;

        const archivo = await registrarArchivoGaleria({
          carpetaId: carpeta.id,
          tipo: file.type.startsWith("video/") ? "video" : "imagen",
          rutaStorage: ruta,
          nombreOriginal: file.name,
          orientacion: medidas.orientacion,
          anchoPx: medidas.ancho || null,
          altoPx: medidas.alto || null,
        });
        nuevos.push(archivo);
      } catch (e) {
        fallos++;
        ultimoError = mensajeDe(e, "Error al subir el archivo");
        // Si el objeto llegó al bucket pero no se pudo registrar, no lo dejes huérfano.
        if (ruta) await supabase.storage.from(BUCKET).remove([ruta]);
      } finally {
        URL.revokeObjectURL(preview);
      }
    }

    if (nuevos.length > 0) setArchivos((prev) => [...prev, ...nuevos]);
    setSubiendo(false);

    if (nuevos.length > 0) {
      toast(`${nuevos.length} archivo${nuevos.length === 1 ? "" : "s"} agregado${nuevos.length === 1 ? "" : "s"}`);
    }
    if (fallos > 0) {
      toast(`${fallos} archivo${fallos === 1 ? "" : "s"} no se pudo subir: ${ultimoError}`);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files?.length) void procesarArchivos(e.dataTransfer.files);
  };

  const agregarEnlace = async () => {
    if (!carpeta) {
      toast("Primero elige o crea una carpeta");
      return;
    }
    const info = parseEnlace(enlace);
    if (!info) {
      toast("Pega un enlace válido de YouTube o Vimeo");
      return;
    }
    const miniatura =
      info.plataforma === "youtube" ? `https://img.youtube.com/vi/${info.id}/hqdefault.jpg` : null;

    try {
      const nuevo = await registrarArchivoGaleria({
        carpetaId: carpeta.id,
        tipo: "enlace",
        urlExterna: enlace.trim(),
        urlMiniatura: miniatura,
        nombreOriginal: null,
        orientacion: "horizontal",
      });
      setArchivos((prev) => [...prev, nuevo]);
      setEnlace("");
      toast("Enlace agregado");
    } catch (e) {
      toast(mensajeDe(e, "No se pudo agregar el enlace"));
    }
  };

  /* ---------- Acciones por archivo ---------- */

  const actualizarItem = (id: string, cambios: Partial<ArchivoUI>) =>
    setArchivos((prev) =>
      prev.map((a) => (a.id === id ? ({ ...a, ...cambios } as ArchivoGaleria) : a)),
    );

  const guardarPie = async (a: ArchivoGaleria) => {
    try {
      await actualizarPieFoto(a.id, a.pieFoto ?? "");
    } catch (e) {
      toast(mensajeDe(e, "No se pudo guardar el pie de foto"));
    }
  };

  const ponerPortada = async (id: string) => {
    const objetivo = items.find((a) => a.id === id);
    if (objetivo?.tipo === "enlace") {
      toast("Un enlace no puede ser portada");
      return;
    }
    try {
      await definirPortada(carpetaId, id);
      setArchivos((prev) =>
        prev.map((a) =>
          a.carpetaId === carpetaId ? ({ ...a, esPortada: a.id === id } as ArchivoGaleria) : a,
        ),
      );
    } catch (e) {
      toast(mensajeDe(e, "No se pudo cambiar la portada"));
    }
  };

  const mover = async (id: string, dir: -1 | 1) => {
    const ids = items.map((a) => a.id);
    const pos = ids.indexOf(id);
    const destino = pos + dir;
    if (pos < 0 || destino < 0 || destino >= ids.length) return;
    [ids[pos], ids[destino]] = [ids[destino], ids[pos]];

    const previo = archivos;
    setArchivos((prev) => {
      const idxs = prev.reduce<number[]>((acc, a, i) => (a.carpetaId === carpetaId ? [...acc, i] : acc), []);
      const p = idxs.findIndex((i) => prev[i].id === id);
      const d = p + dir;
      if (p < 0 || d < 0 || d >= idxs.length) return prev;
      const copia = [...prev];
      [copia[idxs[p]], copia[idxs[d]]] = [copia[idxs[d]], copia[idxs[p]]];
      return copia;
    });

    try {
      await reordenarArchivos(carpetaId, ids);
    } catch (e) {
      setArchivos(previo);
      toast(mensajeDe(e, "No se pudo guardar el nuevo orden"));
    }
  };

  const eliminar = async (id: string) => {
    const objetivo = items.find((i) => i.id === id);
    try {
      // Borra el registro, reasigna la portada en la BD y elimina el objeto de Storage.
      await eliminarArchivoGaleria(id);
    } catch (e) {
      toast(mensajeDe(e, "No se pudo eliminar el archivo"));
      return;
    }
    setArchivos((prev) => {
      const resto = prev.filter((a) => a.id !== id);
      if (objetivo?.esPortada) {
        const primero = resto.findIndex(
          (a) => a.carpetaId === carpetaId && a.tipo !== "enlace",
        );
        if (primero >= 0) resto[primero] = { ...resto[primero], esPortada: true } as ArchivoGaleria;
      }
      return resto;
    });
  };

  /* ---------- Publicación ---------- */

  const publicar = async (estado: "publicado" | "borrador") => {
    if (!carpeta) return;
    try {
      await actualizarEstadoCarpeta(carpeta.id, estado);
    } catch (e) {
      toast(mensajeDe(e, "No se pudo cambiar el estado de la carpeta"));
      return;
    }
    setCarpetas((prev) =>
      prev.map((c) =>
        c.id === carpeta.id
          ? { ...c, estado, publicadaEn: estado === "publicado" ? new Date().toISOString() : null }
          : c,
      ),
    );
    toast(estado === "publicado" ? "Carpeta publicada en el sitio" : "Carpeta retirada del sitio");
  };

  const publicada = carpeta?.estado === "publicado";

  /* ---------------------------------------------------------------- */

  return (
    <div style={s.root}>
      <span style={s.badge}>
        <i style={s.dot} /> Herramienta reutilizable
      </span>
      <h1 style={s.h1}>Gestor de galería</h1>
      <p style={s.sub}>Administra fotos, videos y enlaces de cada módulo del sitio.</p>

      {/* 1. Destino */}
      <section style={s.card}>
        <h2 style={s.h2}>1. Destino del contenido</h2>
        <div style={s.grid2}>
          <label style={s.field}>
            <span style={s.label}>Módulo</span>
            <select style={s.select} value={moduloId} onChange={(e) => cambiarModulo(e.target.value)}>
              <option value="">Selecciona un módulo</option>
              {MODULOS_GESTOR.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label style={s.field}>
            <span style={s.label}>Carpeta</span>
            <select
              style={{ ...s.select, opacity: modulo ? 1 : 0.5 }}
              value={carpetaId}
              disabled={!modulo}
              onChange={(e) => cambiarCarpeta(e.target.value)}
            >
              <option value="">Selecciona una carpeta</option>
              {carpetasModulo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
              <option value={NUEVA}>+ Crear una carpeta</option>
            </select>
          </label>
        </div>
        <div style={s.ruta}>
          <span style={s.rutaLabel}>Ruta de destino</span>
          <b>{ruta}</b>
        </div>
      </section>

      {/* 2. Subir archivos */}
      <section style={s.card}>
        <h2 style={s.h2}>2. Subir archivos</h2>
        <div
          style={{ ...s.drop, ...(arrastrando ? s.dropOn : null) }}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={onDrop}
        >
          <p style={s.dropTitle}>Arrastra fotos o videos aquí</p>
          <p style={s.dropHint}>o usa el botón · cualquier proporción, se conserva la original</p>
          <button
            type="button"
            style={s.btnLight}
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
          >
            {subiendo ? "Subiendo…" : "Subir contenido"}
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            hidden
            onChange={(e) => {
              if (e.target.files?.length) void procesarArchivos(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div style={s.linkRow}>
          <input
            style={s.input}
            placeholder="Enlace de YouTube o Vimeo"
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregarEnlace()}
          />
          <button type="button" style={s.btnLight} onClick={agregarEnlace}>
            Agregar enlace
          </button>
        </div>
      </section>

      {/* 3. Archivos de la carpeta */}
      <section style={s.card}>
        <h2 style={s.h2}>
          3. Archivos de la carpeta{" "}
          {items.length > 0 && <span style={s.count}>({items.length})</span>}
        </h2>

        {items.length === 0 ? (
          <div style={s.vacio}>
            {carpeta ? "Esta carpeta aún no tiene archivos." : "Elige una carpeta para ver sus archivos."}
          </div>
        ) : (
          <ul style={s.gridArchivos}>
            {items.map((a, i) => (
              <li key={a.id} style={s.item}>
                <div style={s.preview}>
                  {a.esPortada && <span style={s.portadaBadge}>Portada</span>}
                  {(() => {
                    const url = urlDe(a);
                    if (a.tipo === "video" && url) {
                      return <video src={url} muted preload="metadata" style={s.media} />;
                    }
                    if (url) {
                      // eslint-disable-next-line @next/next/no-img-element
                      return <img src={url} alt={a.pieFoto || a.nombreOriginal || ""} style={s.media} />;
                    }
                    return <div style={s.sinMiniatura}>▶ {a.tipo === "enlace" ? "Enlace" : "Video"}</div>;
                  })()}
                </div>
                <input
                  style={s.pie}
                  placeholder="Pie de foto"
                  value={a.pieFoto ?? ""}
                  onChange={(e) => actualizarItem(a.id, { pieFoto: e.target.value })}
                  onBlur={() => void guardarPie(a)}
                />
                <div style={s.acciones}>
                  <button
                    type="button"
                    style={s.btnMini}
                    disabled={i === 0}
                    onClick={() => mover(a.id, -1)}
                    aria-label="Mover antes"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    style={s.btnMini}
                    disabled={i === items.length - 1}
                    onClick={() => mover(a.id, 1)}
                    aria-label="Mover después"
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    style={s.btnMini}
                    disabled={a.tipo === "enlace"}
                    onClick={() => ponerPortada(a.id)}
                  >
                    Portada
                  </button>
                  <button type="button" style={s.btnMini} onClick={() => eliminar(a.id)}>
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. Publicar */}
      <section style={s.card}>
        <h2 style={s.h2}>4. Publicar en el sitio web</h2>
        <p style={s.dropHint}>
          Envía esta carpeta al sitio público de usuarios. Podrás actualizarla o retirarla cuando quieras.
        </p>
        <div style={s.publicarRow}>
          <div style={s.estado}>
            <span style={s.pill}>{publicada ? "Publicado" : "Borrador"}</span>
            <span style={s.dropHint}>
              {!carpeta
                ? "Elige una carpeta."
                : items.length === 0
                  ? "Agrega al menos un archivo para publicar."
                  : publicada
                    ? "Visible para los usuarios."
                    : "Aún no es visible para los usuarios."}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {publicada && (
              <button type="button" style={s.btnGhost} onClick={() => publicar("borrador")}>
                Retirar
              </button>
            )}
            <button
              type="button"
              style={{ ...s.btnLight, ...(!carpeta || items.length === 0 ? s.btnOff : null) }}
              disabled={!carpeta || items.length === 0}
              onClick={() => publicar("publicado")}
            >
              {publicada ? "Actualizar publicación" : "Publicar en el sitio"}
            </button>
          </div>
        </div>
      </section>

      {modal && modulo && (
        <ModalCarpeta
          moduloLabel={modulo.label}
          representa={modulo.representa}
          onCancel={() => setModal(false)}
          onCreate={crearCarpeta}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal "Crear carpeta"                                               */
/* ------------------------------------------------------------------ */

function ModalCarpeta({
  moduloLabel,
  representa,
  onCancel,
  onCreate,
}: {
  moduloLabel: string;
  representa: string;
  onCancel: () => void;
  onCreate: (d: { nombre: string; etiqueta: string; descripcion: string; filtro: string }) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [etiqueta, setEtiqueta] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onCreate({
      nombre: nombre.trim(),
      etiqueta: etiqueta.trim(),
      descripcion: descripcion.trim(),
      filtro: filtro.trim(),
    });
  };

  return (
    <div style={s.overlay} onMouseDown={onCancel}>
      <form
        style={s.modal}
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={enviar}
        role="dialog"
        aria-modal="true"
      >
        <h3 style={{ ...s.h2, fontSize: 22, margin: 0 }}>Crear carpeta en {moduloLabel}</h3>
        <p style={{ ...s.sub, margin: "6px 0 18px", fontSize: 14 }}>Representa: {representa}</p>

        <div style={s.grid2}>
          <label style={s.field}>
            <span style={s.label}>Nombre</span>
            <input style={s.input} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus required />
          </label>
          <label style={s.field}>
            <span style={s.label}>Etiqueta</span>
            <input style={s.input} value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} />
          </label>
        </div>

        <label style={{ ...s.field, marginTop: 14 }}>
          <span style={s.label}>Descripción</span>
          <textarea
            style={{ ...s.input, minHeight: 90, resize: "vertical" }}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </label>

        <label style={{ ...s.field, marginTop: 14, maxWidth: "50%" }}>
          <span style={s.label}>Filtro</span>
          <input style={s.input} value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        </label>

        <div style={s.modalAcciones}>
          <button type="button" style={s.btnGhost} onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" style={s.btnLight}>
            Crear carpeta
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Estilos (tema oscuro, igual al de tus capturas)                     */
/* ------------------------------------------------------------------ */

const borde = "1px solid rgba(255,255,255,.1)";

const s: Record<string, CSSProperties> = {
  root: { color: "#fff", display: "grid", gap: 16, marginBottom: 24 },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    width: "fit-content",
    padding: "6px 14px",
    border: borde,
    borderRadius: 999,
    background: "#141414",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block" },
  h1: { fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, margin: 0, letterSpacing: "-.02em" },
  sub: { color: "rgba(255,255,255,.55)", margin: 0 },
  card: { background: "#0e0e0e", border: borde, borderRadius: 18, padding: 24 },
  h2: { fontSize: 18, fontWeight: 700, margin: "0 0 16px" },
  count: { fontWeight: 400, opacity: 0.5, fontSize: 14 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 13, color: "rgba(255,255,255,.55)" },
  select: {
    background: "#161616",
    color: "#fff",
    border: borde,
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 15,
    font: "inherit",
  },
  input: {
    background: "#161616",
    color: "#fff",
    border: borde,
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 14,
    font: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  ruta: {
    marginTop: 16,
    border: "1px dashed rgba(255,255,255,.18)",
    borderRadius: 12,
    padding: "16px 18px",
    background: "#141414",
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    alignItems: "center",
  },
  rutaLabel: { fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" },
  drop: {
    border: "1px dashed rgba(255,255,255,.2)",
    borderRadius: 14,
    padding: "42px 20px",
    textAlign: "center",
    background: "#111",
    transition: "background .15s, border-color .15s",
  },
  dropOn: { background: "#1a1a1a", borderColor: "#fff" },
  dropTitle: { margin: 0, fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,.75)" },
  dropHint: { margin: "6px 0 16px", fontSize: 12, color: "rgba(255,255,255,.5)" },
  linkRow: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 },
  btnLight: {
    background: "#fff",
    color: "#000",
    border: 0,
    borderRadius: 12,
    padding: "12px 22px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  btnOff: { background: "#3a3a3a", color: "rgba(255,255,255,.55)", cursor: "not-allowed" },
  btnGhost: {
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,.6)",
    borderRadius: 12,
    padding: "12px 22px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  vacio: {
    border: "1px dashed rgba(255,255,255,.18)",
    borderRadius: 12,
    padding: "28px 16px",
    textAlign: "center",
    fontSize: 13,
    color: "rgba(255,255,255,.55)",
  },
  gridArchivos: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
    gap: 14,
  },
  item: { background: "#141414", border: borde, borderRadius: 14, overflow: "hidden" },
  preview: { position: "relative", aspectRatio: "16 / 10", background: "#000" },
  media: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  sinMiniatura: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    color: "rgba(255,255,255,.5)",
    fontSize: 13,
  },
  portadaBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 1,
    background: "#fff",
    color: "#000",
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 10px",
    borderRadius: 999,
  },
  pie: {
    width: "100%",
    boxSizing: "border-box",
    background: "transparent",
    color: "#fff",
    border: 0,
    borderBottom: borde,
    padding: "10px 12px",
    fontSize: 12,
    font: "inherit",
    outline: "none",
  },
  acciones: { display: "flex", gap: 6, padding: 10 },
  btnMini: {
    flex: 1,
    background: "#1c1c1c",
    color: "#fff",
    border: borde,
    borderRadius: 8,
    padding: "7px 6px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  publicarRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "space-between",
    alignItems: "center",
  },
  estado: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" },
  pill: {
    border: "1px solid rgba(255,255,255,.35)",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".08em",
    textTransform: "uppercase",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.65)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 1000,
  },
  modal: {
    width: "min(640px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#0e0e0e",
    border: borde,
    borderRadius: 18,
    padding: 30,
    color: "#fff",
  },
  modalAcciones: { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 },
};
