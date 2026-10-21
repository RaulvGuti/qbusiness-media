"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import shared from "../panel.module.css";
import { actualizarEstadoCarpeta } from "@/server/repositories/galeria";
import type { ArchivoGaleria, CarpetaGaleria, Empresa } from "@/types/portafolio";

interface Props {
  carpetasIniciales: CarpetaGaleria[];
  archivosIniciales: ArchivoGaleria[];
  empresasIniciales: Empresa[];
}

const MODULOS: CarpetaGaleria["modulo"][] = [
  "portafolio",
  "backstage",
  "estudio",
  "apoyo_social",
];

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function GaleriaPanel({ carpetasIniciales, archivosIniciales, empresasIniciales }: Props) {
  const toast = useToast();
  const [modulo, setModulo] = useState<"todos" | CarpetaGaleria["modulo"]>("todos");
  const [carpetas, setCarpetas] = useState(carpetasIniciales);

  const archivos = archivosIniciales;
  const empresas = empresasIniciales;

  const visibles = carpetas.filter((c) => modulo === "todos" || c.modulo === modulo);

  const alternarEstado = async (carpeta: CarpetaGaleria) => {
    const nuevo = carpeta.estado === "publicado" ? "borrador" : "publicado";
    // SUPABASE (admin): UPDATE carpetas_galeria SET estado = $nuevo WHERE id = $id.
    await actualizarEstadoCarpeta(carpeta.id, nuevo);
    setCarpetas((prev) =>
      prev.map((c) =>
        c.id === carpeta.id
          ? {
              ...c,
              estado: nuevo,
              publicadaEn: nuevo === "publicado" ? new Date().toISOString() : null,
            }
          : c,
      ),
    );
    toast(nuevo === "publicado" ? "Carpeta publicada" : "Carpeta pasada a borrador");
  };

  const archivosDe = (carpetaId: string): ArchivoGaleria[] =>
    archivos.filter((a) => a.carpetaId === carpetaId);

  return (
    <>
      <div className={shared.toolbar}>
        <div className={shared.chips}>
          {(["todos", ...MODULOS] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`${shared.chip} ${m === modulo ? shared.on : ""}`}
              onClick={() => setModulo(m)}
            >
              {m === "todos" ? "Todos" : m}
            </button>
          ))}
        </div>
      </div>

      <section className={shared.card}>
        <h2 className={shared.cardTitle}>Carpetas</h2>
        {visibles.length === 0 && (
          <p className={shared.empty}>No hay carpetas en este módulo.</p>
        )}
        <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
          {visibles.map((c) => {
            const items = archivosDe(c.id);
            return (
              <li
                key={c.id}
                style={{
                  border: "1px solid rgba(0,0,0,.08)",
                  borderRadius: 14,
                  padding: 16,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <b>{c.nombre}</b>{" "}
                    <span style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase" }}>
                      {c.modulo}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`${shared.btn} ${shared.sm} ${c.estado === "borrador" ? shared.btnPrimary : shared.ghost}`}
                    onClick={() => alternarEstado(c)}
                  >
                    {c.estado === "publicado" ? "Publicada ✓" : "Borrador"}
                  </button>
                </div>
                {c.descripcion && (
                  <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>{c.descripcion}</p>
                )}
                <div style={{ fontSize: 12, opacity: 0.7, display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {c.nombreEmpresa && <span>Empresa: {c.nombreEmpresa}</span>}
                  <span>{items.length} archivo{items.length === 1 ? "" : "s"}</span>
                  <span>Creada {fmtFecha(c.creadoEn)}</span>
                  {c.publicadaEn && <span>Publicada {fmtFecha(c.publicadaEn)}</span>}
                </div>
                {items.length > 0 && (
                  <ul
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      listStyle: "none",
                      padding: 0,
                      margin: "4px 0 0",
                    }}
                  >
                    {items.map((a) => (
                      <li
                        key={a.id}
                        style={{
                          fontSize: 11,
                          border: "1px solid rgba(0,0,0,.1)",
                          borderRadius: 8,
                          padding: "4px 8px",
                        }}
                      >
                        {a.tipo} · {a.orientacion}
                        {a.pieFoto ? ` · ${a.pieFoto}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={shared.card}>
        <h2 className={shared.cardTitle}>Empresas</h2>
        {empresas.length === 0 && (
          <p className={shared.empty}>No hay empresas registradas.</p>
        )}
        <ul style={{ display: "grid", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
          {empresas.map((e) => (
            <li
              key={e.id}
              style={{
                border: "1px solid rgba(0,0,0,.08)",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <div>
                <b>{e.nombre}</b>{" "}
                {!e.activa && (
                  <span style={{ fontSize: 11, opacity: 0.6 }}>(inactiva)</span>
                )}
                {e.descripcion && (
                  <div style={{ opacity: 0.7 }}>{e.descripcion}</div>
                )}
              </div>
              {e.logoRuta && (
                <span style={{ fontSize: 11, opacity: 0.6 }}>logo: {e.logoRuta}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
