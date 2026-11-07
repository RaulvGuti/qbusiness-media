import shared from "../panel.module.css";
import styles from "./page.module.css";
import { exigirStaffPanel } from "@/server/auth/panel";
import { listarEquipo } from "@/server/repositories/administradores";
import {
  DESCRIPCION_ROL,
  ETIQUETAS_ROL,
  seccionesVisibles,
} from "@/lib/permisos";
import { EquipoPanel } from "./EquipoPanel";

export const metadata = { title: "Perfil | Admin" };

export default async function PerfilPage() {
  const { perfil } = await exigirStaffPanel();
  const esPrincipal = perfil.rol === "admin_principal";
  const equipo = esPrincipal ? await listarEquipo() : [];
  const secciones = seccionesVisibles(perfil.rol);

  const miembroDesde = new Date(perfil.creadoEn).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <span className={shared.eye}>Cuenta</span>
      <h1 className={shared.title}>Perfil y usuarios</h1>
      <p className={shared.sub}>
        Datos de la cuenta activa y del equipo con acceso al panel. El rol se
        guarda en la tabla <code>administradores</code> y se valida también en
        la base de datos.
      </p>

      <div className={styles.cards}>
        <section className={shared.card}>
          <h2 className={shared.cardTitle}>Mi cuenta</h2>
          <dl className={styles.datos}>
            <div>
              <dt>Nombre</dt>
              <dd>{perfil.nombreCompleto}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{perfil.correo}</dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{perfil.telefono || "Sin registrar"}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>
                <span className={styles.rolBadge}>
                  {ETIQUETAS_ROL[perfil.rol]}
                </span>
              </dd>
            </div>
            <div>
              <dt>En el equipo desde</dt>
              <dd>{miembroDesde}</dd>
            </div>
          </dl>
          <p className={styles.nota}>
            El correo de acceso y la contraseña se administran desde Supabase
            Auth; aquí solo se muestra el perfil.
          </p>
        </section>

        <section className={shared.card}>
          <h2 className={shared.cardTitle}>Qué puede hacer este rol</h2>
          <p className={styles.descripcion}>{DESCRIPCION_ROL[perfil.rol]}</p>
          <ul className={styles.lista}>
            {secciones.map((seccion) => (
              <li key={seccion.href}>{seccion.texto}</li>
            ))}
          </ul>
          {!esPrincipal && (
            <p className={styles.aviso}>
              Las cuentas del equipo y el contenido del sitio los administra el
              administrador principal. Si necesitas un cambio, solicítalo.
            </p>
          )}
        </section>
      </div>

      {esPrincipal && (
        <EquipoPanel equipoInicial={equipo} usuarioId={perfil.id} />
      )}
    </>
  );
}
