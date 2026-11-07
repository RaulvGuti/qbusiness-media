"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import shared from "../panel.module.css";
import styles from "./page.module.css";
import {
  cambiarRolPersonal,
  crearCuentaPersonal,
  quitarAccesoPersonal,
} from "@/server/services/personal";
import { ETIQUETAS_ROL } from "@/lib/permisos";
import type {
  MiembroEquipo,
  NuevaCuentaPersonalInput,
  RolAdministrador,
} from "@/types/admin";

interface Props {
  equipoInicial: MiembroEquipo[];
  usuarioId: string;
}

const FORM_VACIO: NuevaCuentaPersonalInput = {
  nombreCompleto: "",
  correo: "",
  telefono: "",
  password: "",
  rol: "secretaria",
};

export function EquipoPanel({ equipoInicial, usuarioId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<NuevaCuentaPersonalInput>(FORM_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  function cambiarCampo(
    campo: "nombreCompleto" | "correo" | "telefono" | "password",
    valor: string,
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function manejarAlta(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setEnviando(true);

    try {
      const resultado = await crearCuentaPersonal(form);
      setMensaje(resultado.mensaje);
      setForm(FORM_VACIO);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear la cuenta.",
      );
    } finally {
      setEnviando(false);
    }
  }

  async function manejarRol(id: string, rol: RolAdministrador) {
    setError(null);
    setMensaje(null);
    setOcupado(id);

    try {
      const resultado = await cambiarRolPersonal(id, rol);
      setMensaje(resultado.mensaje);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cambiar el rol.",
      );
    } finally {
      setOcupado(null);
    }
  }

  async function manejarBaja(id: string, nombre: string) {
    const confirmado = window.confirm(
      `¿Quitar el acceso al panel de ${nombre}? La cuenta de Supabase Auth no se borra.`,
    );
    if (!confirmado) return;

    setError(null);
    setMensaje(null);
    setOcupado(id);

    try {
      const resultado = await quitarAccesoPersonal(id);
      setMensaje(resultado.mensaje);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo quitar el acceso.",
      );
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section className={`${shared.card} ${styles.equipo}`}>
      <h2 className={shared.cardTitle}>Equipo con acceso al panel</h2>
      <p className={styles.descripcion}>
        Solo el administrador principal puede crear cuentas, cambiar roles o
        quitar accesos. Una cuenta nueva nace como <b>Secretaría</b> salvo que
        indiques otro rol.
      </p>

      {equipoInicial.length === 0 ? (
        <p className={shared.empty}>Todavía no hay otras cuentas.</p>
      ) : (
        <div className={styles.tablaWrap}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Persona</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acceso</th>
              </tr>
            </thead>
            <tbody>
              {equipoInicial.map((miembro) => {
                const esYo = miembro.id === usuarioId;
                const bloqueado = ocupado === miembro.id;

                return (
                  <tr key={miembro.id}>
                    <td>
                      {miembro.nombreCompleto}
                      {esYo && <span className={styles.yo}>Tú</span>}
                    </td>
                    <td>{miembro.correo}</td>
                    <td>
                      {esYo ? (
                        <span className={styles.rolBadge}>
                          {ETIQUETAS_ROL[miembro.rol]}
                        </span>
                      ) : (
                        <select
                          key={`${miembro.id}-${miembro.rol}`}
                          defaultValue={miembro.rol}
                          disabled={bloqueado}
                          onChange={(e) =>
                            manejarRol(
                              miembro.id,
                              e.target.value as RolAdministrador,
                            )
                          }
                          aria-label={`Rol de ${miembro.nombreCompleto}`}
                        >
                          <option value="secretaria">Secretaría</option>
                          <option value="admin_principal">
                            Administrador principal
                          </option>
                        </select>
                      )}
                    </td>
                    <td>
                      {esYo ? (
                        <span className={styles.notaCelda}>Tu propia cuenta</span>
                      ) : (
                        <button
                          type="button"
                          className={`${shared.btn} ${shared.sm} ${shared.danger}`}
                          disabled={bloqueado}
                          onClick={() =>
                            manejarBaja(miembro.id, miembro.nombreCompleto)
                          }
                        >
                          {bloqueado ? "Procesando..." : "Quitar acceso"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h3 className={styles.subtitulo}>Agregar una cuenta</h3>
      <p className={styles.nota} style={{ marginTop: 0, marginBottom: 16 }}>
        Si el correo ya existe en Supabase Auth, solo se le da acceso al panel
        con el rol elegido. La contraseña se puede cambiar después desde el
        correo de recuperación.
      </p>

      <form className={styles.formEquipo} onSubmit={manejarAlta}>
        <div className={shared.f}>
          <label htmlFor="equipo-nombre">Nombre completo</label>
          <input
            id="equipo-nombre"
            required
            value={form.nombreCompleto}
            onChange={(e) => cambiarCampo("nombreCompleto", e.target.value)}
          />
        </div>

        <div className={shared.f}>
          <label htmlFor="equipo-correo">Correo</label>
          <input
            id="equipo-correo"
            type="email"
            required
            value={form.correo}
            onChange={(e) => cambiarCampo("correo", e.target.value)}
          />
        </div>

        <div className={shared.f}>
          <label htmlFor="equipo-telefono">Teléfono (opcional)</label>
          <input
            id="equipo-telefono"
            value={form.telefono ?? ""}
            onChange={(e) => cambiarCampo("telefono", e.target.value)}
          />
        </div>

        <div className={shared.f}>
          <label htmlFor="equipo-password">Contraseña inicial</label>
          <input
            id="equipo-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => cambiarCampo("password", e.target.value)}
          />
        </div>

        <div className={shared.f}>
          <label htmlFor="equipo-rol">Rol</label>
          <select
            id="equipo-rol"
            value={form.rol}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                rol: e.target.value as RolAdministrador,
              }))
            }
          >
            <option value="secretaria">Secretaría (operación)</option>
            <option value="admin_principal">
              Administrador principal (acceso total)
            </option>
          </select>
        </div>

        <div className={styles.acciones}>
          <button
            type="submit"
            className={`${shared.btn} ${shared.btnPrimary}`}
            disabled={enviando}
          >
            {enviando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
          {mensaje && <p className={styles.mensaje}>{mensaje}</p>}
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </form>
    </section>
  );
}
