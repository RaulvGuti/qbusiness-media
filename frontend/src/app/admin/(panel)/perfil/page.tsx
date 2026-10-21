import shared from "../panel.module.css";

export const metadata = { title: "Perfil | Admin" };

// SUPABASE (al conectar): leer el usuario de la sesión
//   const { data: { user } } = await supabase.auth.getClaims() / auth.getUser()
// y su fila en `administradores` (id = auth.users.id, 000012).
const perfilDemo = {
  nombre: "Administrador",
  correo: "admin@qbusinessmedia.com",
  rol: "admin",
};

export default function PerfilPage() {
  return (
    <>
      <span className={shared.eye}>Cuenta</span>
      <h1 className={shared.title}>Perfil y usuarios</h1>
      <p className={shared.sub}>
        Datos de la cuenta activa. Las cuentas se gestionan desde Supabase Auth;
        el rol se determina por la tabla <code>administradores</code>.
      </p>

      <section className={shared.card} style={{ maxWidth: 560 }}>
        <h2 className={shared.cardTitle}>Mi cuenta</h2>
        <dl style={{ display: "grid", gap: 12, margin: 0, fontSize: 14 }}>
          <div style={{ display: "grid", gap: 2 }}>
            <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>
              Nombre
            </dt>
            <dd style={{ margin: 0 }}>{perfilDemo.nombre}</dd>
          </div>
          <div style={{ display: "grid", gap: 2 }}>
            <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>
              Correo
            </dt>
            <dd style={{ margin: 0 }}>{perfilDemo.correo}</dd>
          </div>
          <div style={{ display: "grid", gap: 2 }}>
            <dt style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", opacity: 0.6 }}>
              Rol
            </dt>
            <dd style={{ margin: 0, textTransform: "capitalize" }}>{perfilDemo.rol}</dd>
          </div>
        </dl>
        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 16 }}>
          Datos de demostración: al conectar Supabase Auth se cargan desde la
          sesión y la tabla <code>administradores</code>.
        </p>
      </section>
    </>
  );
}
