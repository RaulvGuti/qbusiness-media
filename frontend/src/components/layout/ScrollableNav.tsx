"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useScrollableNav } from "./useScrollableNav";

interface Props {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  arrowClassName?: string;
}

/** Estilo único de las etiquetas de navegación: sin bordes ni rectángulos. */
export function navLinkClass(active: boolean): string {
  return [
    "shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold text-white",
    "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
    active ? "border-white" : "border-transparent hover:border-white/40",
  ].join(" ");
}

/**
 * Fila de navegación con scroll horizontal: drag con mouse, rueda convertida a
 * scrollLeft, difuminados y flechas cuando el contenido sobresale. El contenido
 * interno usa `min-w-max mx-auto`, así se centra cuando cabe y deja de recortar
 * el primer enlace cuando no.
 */
export function ScrollableNav({
  ariaLabel,
  children,
  className = "",
  arrowClassName = "",
}: Props) {
  const pathname = usePathname();
  const {
    scrollRef,
    canLeft,
    canRight,
    isDragging,
    onPointerDown,
    onClickCapture,
    scrollByPage,
  } = useScrollableNav();

  useEffect(() => {
    const active = scrollRef.current?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    active?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [pathname, scrollRef]);

  const cursor = isDragging
    ? "cursor-grabbing"
    : canLeft || canRight
      ? "cursor-grab"
      : "";

  return (
    <div className={`relative min-w-0 ${className}`}>
      <nav
        ref={scrollRef}
        aria-label={ariaLabel}
        className={`scrollbar-none flex flex-nowrap items-center overflow-x-auto overflow-y-hidden overscroll-x-contain py-1 select-none ${cursor}`}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        onDragStart={(event) => event.preventDefault()}
      >
        <div className="mx-auto flex min-w-max items-center gap-1 px-2">
          {children}
        </div>
      </nav>

      {canLeft && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-qbIndigo to-transparent"
          />
          <button
            type="button"
            aria-label="Desplazar navegación a la izquierda"
            onClick={() => scrollByPage(-1)}
            className={`absolute top-1/2 left-0 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-qbIndigo/70 text-white/80 transition-colors hover:bg-qbIndigoHover hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none ${arrowClassName}`}
          >
            <Icon name="arrow-left" />
          </button>
        </>
      )}

      {canRight && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-qbIndigo to-transparent"
          />
          <button
            type="button"
            aria-label="Desplazar navegación a la derecha"
            onClick={() => scrollByPage(1)}
            className={`absolute top-1/2 right-0 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-qbIndigo/70 text-white/80 transition-colors hover:bg-qbIndigoHover hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none ${arrowClassName}`}
          >
            <Icon name="arrow-right" />
          </button>
        </>
      )}
    </div>
  );
}
