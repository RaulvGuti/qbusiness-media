"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import styles from "./page.module.css";

// Acceso de demostración. Se reemplaza por Supabase Auth cuando se conecte el backend.
export function Vista() {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const ok = datos.get("usuario") === "admin" && datos.get("clave") === "admin123";
    setError(!ok);
    if (ok) {
      toast("Bienvenido al panel administrativo");
      router.push("/admin/dashboard");
    }
  }

  return (
    <section className={styles.page}>
      <div className="mx-auto max-w-md space-y-6 rounded-3xl border border-qbBorder bg-qbChalk p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-2xl text-qbIndigo">
            <Icon name="lock" />
          </div>
          <h1 className="text-2xl font-bold text-qbInk">Acceso Administrativo</h1>
          <p className="text-xs text-qbMuted">Área exclusiva para gestión y operaciones de QBusiness Media.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="usuario" className="mb-1 block text-xs font-semibold tracking-wider text-qbMuted uppercase">
              Usuario
            </label>
            <input
              id="usuario"
              name="usuario"
              type="text"
              required
              placeholder="admin"
              className="w-full rounded-xl border border-qbBorder bg-qbLinen px-4 py-3 text-sm text-qbInk transition focus:border-white focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="clave" className="mb-1 block text-xs font-semibold tracking-wider text-qbMuted uppercase">
              Contraseña
            </label>
            <input
              id="clave"
              name="clave"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-qbBorder bg-qbLinen px-4 py-3 text-sm text-qbInk transition focus:border-white focus:outline-none"
            />
          </div>
          {error && (
            <p role="alert" className="text-center text-xs font-semibold text-red-400">
              Usuario o contraseña incorrectos.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-qbTerracotta py-3.5 text-sm font-bold tracking-wider text-white uppercase transition duration-200 hover:bg-qbTerracottaHover"
          >
            Ingresar al Panel
          </button>
          <p className="text-center text-[11px] text-qbMuted">
            Credenciales demo: <span className="font-mono font-bold">admin</span> /{" "}
            <span className="font-mono font-bold">admin123</span>
          </p>
        </form>
      </div>
    </section>
  );
}
