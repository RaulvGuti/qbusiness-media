"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

const DRAG_THRESHOLD = 6;
const CLICK_SUPPRESS_MS = 300;

/**
 * Desplazamiento horizontal para una barra de navegación.
 *
 * El táctil sigue usando el scroll nativo; este hook agrega lo que falta en
 * escritorio: arrastrar con el mouse y convertir la rueda vertical en
 * horizontal. Solo intercepta la rueda cuando hay contenido desbordado y no
 * estamos en un extremo, para no bloquear el scroll normal de la página.
 */
export function useScrollableNav() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragAbort = useRef<AbortController | null>(null);
  const dragMoved = useRef(false);
  const suppressClickUntil = useRef(0);

  const updateOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(max > 1 && el.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateOverflow();
    el.addEventListener("scroll", updateOverflow, { passive: true });

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    window.addEventListener("resize", updateOverflow);
    return () => {
      el.removeEventListener("scroll", updateOverflow);
      observer.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [updateOverflow]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;

      const goingLeft = event.deltaY < 0;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft >= max - 1;
      if ((goingLeft && atStart) || (!goingLeft && atEnd)) return;

      event.preventDefault();
      el.scrollLeft = Math.min(max, Math.max(0, el.scrollLeft + event.deltaY));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => () => dragAbort.current?.abort(), []);

  /**
   * El arrastre se escucha en `window`, no en el nav, para seguir funcionando
   * aunque el puntero salga del componente. No se usa `setPointerCapture`
   * porque retargetea el click al nav y los enlaces dejan de navegar.
   */
  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;

      const el = scrollRef.current;
      if (!el) return;

      dragAbort.current?.abort();
      const controller = new AbortController();
      dragAbort.current = controller;

      const pointerId = event.pointerId;
      const startX = event.clientX;
      const startY = event.clientY;
      const startScroll = el.scrollLeft;

      dragMoved.current = false;
      suppressClickUntil.current = 0;

      const onMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;

        const delta = moveEvent.clientX - startX;
        if (!dragMoved.current) {
          const deltaY = moveEvent.clientY - startY;
          // Solo es arrastre si el movimiento es claramente horizontal. Así un
          // click con temblor vertical no se come la navegación del enlace.
          if (
            Math.abs(delta) <= DRAG_THRESHOLD ||
            Math.abs(delta) <= Math.abs(deltaY)
          ) {
            return;
          }

          dragMoved.current = true;
          setIsDragging(true);
        }

        el.scrollLeft = startScroll - delta;
      };

      const finish = (finishEvent: PointerEvent) => {
        if (finishEvent.pointerId !== pointerId) return;

        if (dragMoved.current) {
          suppressClickUntil.current = Date.now() + CLICK_SUPPRESS_MS;
        }
        dragMoved.current = false;
        setIsDragging(false);
        controller.abort();
        if (dragAbort.current === controller) dragAbort.current = null;
      };

      window.addEventListener("pointermove", onMove, {
        signal: controller.signal,
      });
      window.addEventListener("pointerup", finish, {
        signal: controller.signal,
      });
      window.addEventListener("pointercancel", finish, {
        signal: controller.signal,
      });
    },
    [],
  );

  const onClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (Date.now() < suppressClickUntil.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressClickUntil.current = 0;
      }
    },
    [],
  );

  const scrollByPage = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.max(220, el.clientWidth * 0.65),
      behavior: "smooth",
    });
  }, []);

  return {
    scrollRef,
    canLeft,
    canRight,
    isDragging,
    onPointerDown,
    onClickCapture,
    scrollByPage,
  };
}
