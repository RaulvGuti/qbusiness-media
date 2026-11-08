import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  createSupabaseServerClient,
  createSupabaseStaffClient,
} from "@/server/supabase/server";
import { FormularioRestablecer } from "./FormularioRestablecer";

export const metadata = {
  title: "Restablecer contraseña | QBusiness Media",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

function Pantalla({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
            QBusiness Media
          </p>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            {titulo}
          </h1>
          <p className="text-sm text-zinc-400">{descripcion}</p>
        </div>

        <div className="space-y-5 rounded-3xl border border-[#262626] bg-[#0d0d0d] p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}

function Aviso({
  titulo,
  descripcion,
  mensaje,
  esAdmin = false,
}: {
  titulo: string;
  descripcion: string;
  mensaje: string;
  esAdmin?: boolean;
}) {
  return (
    <Pantalla titulo={titulo} descripcion={descripcion}>
      <div className="space-y-4 text-center">
        <Icon name="lock" className="text-3xl text-zinc-400" />
        <p className="text-sm text-zinc-400">{mensaje}</p>
        <Link
          href={esAdmin ? "/admin" : "/login"}
          className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-xs font-semibold text-black transition hover:bg-slate-200"
        >
          {esAdmin ? "Volver al acceso administrativo" : "Volver al inicio de sesión"}
        </Link>
        <Link
          href="/"
          className="block text-sm text-zinc-400 transition hover:text-white"
        >
          Volver al inicio
        </Link>
      </div>
    </Pantalla>
  );
}

export default async function RestablecerPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const recuperacion = params.recuperacion === "1";
  const ambitoAdmin = params.ambito === "admin";

  if (error) {
    return (
      <Aviso
        esAdmin={ambitoAdmin}
        titulo="Enlace no válido"
        descripcion="No pudimos confirmar tu enlace de recuperación."
        mensaje="El enlace ya expiró o dejó de ser válido. Solicita uno nuevo desde la pantalla de acceso donde lo pediste."
      />
    );
  }

  if (!recuperacion) {
    return (
      <Aviso
        esAdmin={ambitoAdmin}
        titulo="Abre el enlace de tu correo"
        descripcion="Esta pantalla solo funciona con un enlace de recuperación válido."
        mensaje="Revisa tu correo electrónico y abre el enlace que enviamos para definir una contraseña nueva."
      />
    );
  }

  const supabase = ambitoAdmin
    ? await createSupabaseStaffClient()
    : await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <Aviso
        esAdmin={ambitoAdmin}
        titulo="Tu enlace expiró"
        descripcion="La sesión de recuperación ya no está disponible."
        mensaje="Solicita un enlace nuevo desde la pantalla de acceso donde lo pediste para continuar."
      />
    );
  }

  return (
    <Pantalla
      titulo="Restablecer contraseña"
      descripcion={
        <>
          Define una contraseña nueva para{" "}
          <span className="text-white">{user.email || "tu cuenta"}</span>.
        </>
      }
    >
      <FormularioRestablecer
        correo={user.email || "tu cuenta"}
        esAdmin={ambitoAdmin}
      />
    </Pantalla>
  );
}
