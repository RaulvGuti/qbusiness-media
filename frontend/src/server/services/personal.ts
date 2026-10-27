"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPrincipal } from "@/server/auth/require-admin";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { ETIQUETAS_ROL } from "@/lib/permisos";
import type {
  NuevaCuentaPersonalInput,
  RolAdministrador,
} from "@/types/admin";

/**
 * Gestión de cuentas del equipo (000038).
 *
 * Crear la cuenta de acceso exige el service role de Supabase Auth, por eso se
 * usa `createSupabaseAdminClient()` SOLO después de comprobar que quien llama
 * es administrador principal. El alta en `administradores` se hace con la RPC
 * `crear_administrador`, que vuelve a validar el rol en la base de datos.
 */

function esRolValido(valor: string): valor is RolAdministrador {
  return valor === "admin_principal" || valor === "secretaria";
}

function correoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export async function crearCuentaPersonal(input: NuevaCuentaPersonalInput) {
  const acceso = await requireAdminPrincipal();

  if (!acceso.authorized) {
    throw new Error(
      acceso.status === 401
        ? "Tu sesión expiró. Vuelve a iniciar sesión."
        : "Solo el administrador principal puede crear cuentas del equipo.",
    );
  }

  const nombre = input.nombreCompleto.trim();
  const correo = input.correo.trim().toLowerCase();
  const telefono = (input.telefono ?? "").trim();
  const password = input.password;
  const rol = input.rol;

  if (nombre.length < 2 || nombre.length > 150) {
    throw new Error("Escribe el nombre completo de la persona.");
  }
  if (!correoValido(correo)) {
    throw new Error("El correo no es válido.");
  }
  if (telefono.length > 40) {
    throw new Error("El teléfono es demasiado largo.");
  }
  if (password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres.");
  }
  if (!esRolValido(rol)) {
    throw new Error("El rol indicado no es válido.");
  }

  const admin = createSupabaseAdminClient();

  const { data: creada, error: errorAuth } = await admin.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
    user_metadata: {
      nombre_completo: nombre,
      ...(telefono ? { telefono } : {}),
    },
  });

  const yaExistia =
    Boolean(errorAuth) &&
    (errorAuth?.code === "email_exists" || errorAuth?.status === 422);

  if (errorAuth && !yaExistia) {
    throw new Error("No se pudo crear la cuenta de acceso. Revisa el correo.");
  }

  const { error: errorAlta } = await acceso.supabase.rpc("crear_administrador", {
    p_correo: correo,
    p_rol: rol,
  });

  if (errorAlta) {
    // Si la cuenta de Auth se acababa de crear, no dejarla huérfana.
    if (creada?.user) {
      await admin.auth.admin.deleteUser(creada.user.id);
    }
    throw new Error(
      errorAlta.message || "No se pudo dar acceso al panel a esa cuenta.",
    );
  }

  revalidatePath("/admin/perfil");

  return {
    mensaje: yaExistia
      ? `Se dio acceso al panel a ${correo} con rol ${ETIQUETAS_ROL[rol]}.`
      : `Cuenta de ${nombre} creada con rol ${ETIQUETAS_ROL[rol]}.`,
  };
}

export async function cambiarRolPersonal(id: string, rol: RolAdministrador) {
  const acceso = await requireAdminPrincipal();

  if (!acceso.authorized) {
    throw new Error(
      acceso.status === 401
        ? "Tu sesión expiró. Vuelve a iniciar sesión."
        : "Solo el administrador principal puede cambiar roles.",
    );
  }

  if (!id || !esRolValido(rol)) {
    throw new Error("El cambio de rol no es válido.");
  }

  const { error } = await acceso.supabase.rpc("cambiar_rol_administrador", {
    p_id: id,
    p_rol: rol,
  });

  if (error) {
    throw new Error(error.message || "No se pudo cambiar el rol.");
  }

  revalidatePath("/admin/perfil");

  return { mensaje: `Rol actualizado a ${ETIQUETAS_ROL[rol]}.` };
}

export async function quitarAccesoPersonal(id: string) {
  const acceso = await requireAdminPrincipal();

  if (!acceso.authorized) {
    throw new Error(
      acceso.status === 401
        ? "Tu sesión expiró. Vuelve a iniciar sesión."
        : "Solo el administrador principal puede quitar accesos.",
    );
  }

  if (!id) {
    throw new Error("No se indicó la cuenta que se quiere quitar.");
  }

  const { error } = await acceso.supabase.rpc("quitar_administrador", {
    p_id: id,
  });

  if (error) {
    throw new Error(error.message || "No se pudo quitar el acceso al panel.");
  }

  revalidatePath("/admin/perfil");

  return { mensaje: "La cuenta ya no tiene acceso al panel." };
}
