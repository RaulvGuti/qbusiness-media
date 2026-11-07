"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Icon } from "./Icon";

const ToastContext = createContext<(mensaje: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mensaje, setMensaje] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrar = useCallback((texto: string) => {
    setMensaje(texto);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2600);
  }, []);

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`fixed right-6 bottom-6 z-50 flex items-center space-x-3 rounded-2xl border border-qbIndigoHover bg-qbIndigo px-6 py-3.5 font-semibold text-white shadow-2xl transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-36 opacity-0"
        }`}
      >
        <Icon name="check-circle" className="text-lg" />
        <span>{mensaje}</span>
      </div>
    </ToastContext.Provider>
  );
}
