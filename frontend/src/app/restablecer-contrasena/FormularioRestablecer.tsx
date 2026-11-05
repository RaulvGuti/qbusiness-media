"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { obtenerSupabase, obtenerSupabaseAdmin } from "@/lib/supabase/client";

const MINIMO_CARACTERES = 8;

type Props = {
  correo: string;
  esAdmin: boolean;
};

function mensajeDeError(mensaje: string) {
  const texto = mensaje.toLowerCase();

  if (texto.includes("different from the old")) {
    return "La nueva contraseña debe ser diferente a la anterior.";
  }

  if (
    texto.includes("at least") ||
    texto.includes("password should be") ||
    texto.includes("weak password")
  ) {
    return "La contraseña no cumple los requisitos mínimos.";
  }

  if (texto.includes("session") || texto.includes("jwt") || texto.includes("token")) {
    return "Tu enlace expiró. Solicita uno nuevo desde la pantalla de acceso.";
  }

  return "No se pudo actualizar la contraseña. Intenta de nuevo.";
}

export function FormularioRestablecer({ correo, esAdmin }: Props) {
  const [form, setForm] = useState({ password: "", confirmacion: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (form.password.length < MINIMO_CARACTERES) {
      setError(
        `La contraseña debe tener al menos ${MINIMO_CARACTERES} caracteres.`,
      );
      return;
    }

    if (form.password !== form.confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);

    try {
      const supabase = esAdmin ? obtenerSupabaseAdmin() : obtenerSupabase();
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.password,
      });

      if (updateError) {
        setError(mensajeDeError(updateError.message));
        return;
      }

      // La contraseña ya cambió. Cierra solo la sesión de este ámbito para no
      // tumbar la sesión pública si se trata de una cuenta de administrador.
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Ignorar: el siguiente inicio de sesión validará la contraseña nueva.
      }

      setListo(true);
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (listo) {
    return (
      <div className="space-y-5 text-center">
        <Icon name="check-circle" className="text-3xl text-emerald-400" />
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white">
            Contraseña actualizada
          </h2>
          <p className="text-sm text-[#8a8a8a]">
            La contraseña de {correo} se cambió correctamente. Cerramos la
            sesión para que entres con la nueva contraseña.
          </p>
        </div>
        <Link
          href={esAdmin ? "/admin" : "/login"}
          className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-xs font-semibold text-black transition hover:bg-slate-200"
        >
          {esAdmin ? "Ir al acceso administrativo" : "Iniciar sesión"}
        </Link>
        <Link
          href="/"
          className="block text-sm text-[#8a8a8a] transition hover:text-white"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="restablecer-contrasena"
          className="text-sm font-semibold text-white"
        >
          Nueva contraseña
        </label>
        <input
          id="restablecer-contrasena"
          name="password"
          type="password"
          required
          minLength={MINIMO_CARACTERES}
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          className="w-full rounded-xl border border-[#3f3f46] bg-[#171717] px-4 py-3 text-sm text-white transition placeholder:text-[#71717a] focus:border-white focus:outline-none"
        />
        <p className="text-[11px] text-[#8a8a8a]">
          Mínimo {MINIMO_CARACTERES} caracteres.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="restablecer-confirmacion"
          className="text-sm font-semibold text-white"
        >
          Confirmar contraseña
        </label>
        <input
          id="restablecer-confirmacion"
          name="confirmacion"
          type="password"
          required
          minLength={MINIMO_CARACTERES}
          autoComplete="new-password"
          value={form.confirmacion}
          onChange={handleChange}
          placeholder="••••••••"
          className="w-full rounded-xl border border-[#3f3f46] bg-[#171717] px-4 py-3 text-sm text-white transition placeholder:text-[#71717a] focus:border-white focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-800/50 bg-red-950/40 p-3 text-xs text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-white px-6 py-3 text-xs font-semibold text-black transition hover:bg-slate-200 disabled:opacity-60"
      >
        {enviando ? (
          "Actualizando..."
        ) : (
          <>
            <Icon name="lock" className="mr-2" />
            Guardar contraseña
          </>
        )}
      </button>

      <div className="pt-1 text-center">
        <Link
          href={esAdmin ? "/admin" : "/login"}
          className="text-sm text-[#8a8a8a] transition hover:text-white"
        >
          {esAdmin
            ? "Volver al acceso administrativo"
            : "Volver al inicio de sesión"}
        </Link>
      </div>
    </form>
  );
}
