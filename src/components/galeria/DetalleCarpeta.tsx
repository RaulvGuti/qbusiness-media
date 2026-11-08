'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { CarpetaConPortada, MedioPublico } from '@/types/galeria-publica';

interface DetalleCarpetaProps {
  carpeta: CarpetaConPortada;
  medios: MedioPublico[];
  /** Texto pequeño sobre el título (p. ej. "Portafolio"). */
  etiqueta: string;
  volverHref: string;
  volverTexto: string;
}

function IndicadorPlay() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white text-lg">
        ▶
      </span>
    </span>
  );
}

export function DetalleCarpeta({ carpeta, medios, etiqueta, volverHref, volverTexto }: DetalleCarpetaProps) {
  const [abierto, setAbierto] = useState<number | null>(null);
  const actual = abierto === null ? null : medios[abierto];

  const cerrar = useCallback(() => setAbierto(null), []);
  const mover = useCallback(
    (paso: -1 | 1) =>
      setAbierto((i) => (i === null ? null : (i + paso + medios.length) % medios.length)),
    [medios.length],
  );

  useEffect(() => {
    if (abierto === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowLeft') mover(-1);
      if (e.key === 'ArrowRight') mover(1);
    };
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previo;
    };
  }, [abierto, cerrar, mover]);

  const datos = [carpeta.nombreEmpresa, carpeta.lugar, carpeta.equipoUsado].filter(
    (d): d is string => Boolean(d),
  );

  return (
    <section className="page-stack">
      <div className="border-b border-qbBorder pb-6 space-y-3">
        <Link href={volverHref} className="text-xs font-semibold text-qbMuted hover:text-qbInk transition">
          ← {volverTexto}
        </Link>
        <div>
          <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">{etiqueta}</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">{carpeta.nombre}</h2>
          {carpeta.descripcion && (
            <p className="text-sm text-qbMuted mt-2 max-w-3xl leading-relaxed">{carpeta.descripcion}</p>
          )}
          {datos.length > 0 && <p className="text-xs text-qbMuted mt-3">{datos.join(' · ')}</p>}
        </div>
      </div>

      {medios.length === 0 ? (
        <div className="text-center py-12 text-qbMuted">Esta carpeta aún no tiene archivos.</div>
      ) : (
        <div className="mt-6 columns-1 sm:columns-2 lg:columns-3 gap-4">
          {medios.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setAbierto(i)}
              aria-label={m.pieFoto ?? m.nombre ?? `Ver archivo ${i + 1}`}
              className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-qbBorder bg-black/40 text-left cursor-pointer hover:border-qbTerracotta transition"
            >
              {m.tipo === 'imagen' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt={m.pieFoto ?? m.nombre ?? carpeta.nombre}
                  loading="lazy"
                  className="block h-auto w-full transition-transform duration-300 group-hover:scale-[1.02]"
                />
              )}
              {m.tipo === 'video' && (
                <>
                  <video
                    src={`${m.url}#t=0.1`}
                    muted
                    playsInline
                    preload="metadata"
                    className="block h-auto w-full"
                  />
                  <IndicadorPlay />
                </>
              )}
              {m.tipo === 'enlace' && (
                <div className="relative aspect-video w-full bg-black/60">
                  {m.miniatura && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.miniatura} alt={m.pieFoto ?? carpeta.nombre} loading="lazy" className="h-full w-full object-cover" />
                  )}
                  <IndicadorPlay />
                </div>
              )}
              {m.pieFoto && (
                <span className="block border-t border-qbBorder px-3 py-2 text-xs text-qbMuted">{m.pieFoto}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {actual && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={carpeta.nombre}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={cerrar}
        >
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20 cursor-pointer"
          >
            ✕
          </button>

          {medios.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  mover(-1);
                }}
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 cursor-pointer"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={(e) => {
                  e.stopPropagation();
                  mover(1);
                }}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 cursor-pointer"
              >
                ›
              </button>
            </>
          )}

          <div
            className="flex max-h-full w-full max-w-6xl flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {actual.tipo === 'imagen' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={actual.id}
                src={actual.url}
                alt={actual.pieFoto ?? actual.nombre ?? carpeta.nombre}
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            )}
            {actual.tipo === 'video' && (
              <video
                key={actual.id}
                src={actual.url}
                controls
                autoPlay
                playsInline
                className="max-h-[80vh] max-w-full bg-black"
              />
            )}
            {actual.tipo === 'enlace' && (
              <div className="aspect-video w-full">
                <iframe
                  key={actual.id}
                  src={actual.url}
                  title={actual.pieFoto ?? carpeta.nombre}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            )}
            <p className="text-xs text-white/70">
              {abierto! + 1} / {medios.length}
              {actual.pieFoto ? ` · ${actual.pieFoto}` : ''}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
