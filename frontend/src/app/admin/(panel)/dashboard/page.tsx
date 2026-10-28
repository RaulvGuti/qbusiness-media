import Link from "next/link";
import shared from "../panel.module.css";
import styles from "./page.module.css";
import { listarLeads } from "@/server/repositories/leads";
import { listarReservas } from "@/server/repositories/estudio";
import { listarTodasLasResenas } from "@/server/repositories/resenas";
import { listarSolicitudes } from "@/server/repositories/solicitudes";
import { exigirStaffPanel } from "@/server/auth/panel";
import { puede, type Permiso } from "@/lib/permisos";

export const metadata = { title: "Dashboard | Admin" };

const ATAJOS: {
  titulo: string;
  detalle: string;
  href: string;
  permiso: Permiso;
}[] = [
  {
    titulo: "Galería",
    detalle: "Carpetas y archivos",
    href: "/admin/galeria",
    permiso: "galeria",
  },
  {
    titulo: "Textos y configuración",
    detalle: "Contenido del sitio",
    href: "/admin/textos",
    permiso: "textos",
  },
  {
    titulo: "Destacados",
    detalle: "Orden del inicio",
    href: "/admin/destacados",
    permiso: "destacados",
  },
  {
    titulo: "Contactos",
    detalle: "Mensajes y apoyo social",
    href: "/admin/contactos",
    permiso: "contactos",
  },
  {
    titulo: "Reseñas",
    detalle: "Aprobar o rechazar",
    href: "/admin/resenas",
    permiso: "resenas",
  },
  {
    titulo: "Reservas del estudio",
    detalle: "Solicitudes y bloqueos",
    href: "/admin/reservas",
    permiso: "reservas",
  },
];

// Gráfica decorativa de la semana (sin datos reales todavía).
const SEMANA = [
  { dia: "L", alto: 40 },
  { dia: "M", alto: 65 },
  { dia: "X", alto: 50 },
  { dia: "J", alto: 85 },
  { dia: "V", alto: 100, hoy: true },
  { dia: "S", alto: 30 },
  { dia: "D", alto: 45 },
];

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("es-GT", { day: "2-digit", month: "short" });

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ permiso?: string }>;
}) {
  const { perfil } = await exigirStaffPanel();
  const { permiso } = await searchParams;
  const atajos = ATAJOS.filter((atajo) => puede(perfil.rol, atajo.permiso));

  // SUPABASE (admin): conteos sobre leads_contacto, resenas_clientes,
  // solicitudes_apoyo_social y reservas.
  const [leads, reservas, resenas, solicitudes] = await Promise.all([
    listarLeads(),
    listarReservas(),
    listarTodasLasResenas(),
    listarSolicitudes(),
  ]);

  const stats = {
    resenasPendientes: resenas.filter((r) => r.estado === "pendiente").length,
    leadsNuevos: leads.filter((l) => l.estado === "nuevo").length,
    reservasPendientes: reservas.filter((r) => r.estado === "pendiente").length,
    solicitudesNuevas: solicitudes.filter((s) => s.estado === "nueva").length,
  };

  const actividad = [
    ...leads.map((l) => ({
      texto: `Mensaje de ${l.nombre} en el formulario de contacto.`,
      cuando: fmt(l.creadoEn),
      nuevo: l.estado === "nuevo",
    })),
    ...resenas
      .filter((r) => r.estado === "pendiente")
      .map((r) => ({
        texto: `Reseña pendiente de ${r.autor}.`,
        cuando: fmt(r.creadoEn),
        nuevo: true,
      })),
    ...solicitudes.map((s) => ({
      texto: `Solicitud de apoyo de ${s.nombreEntidad}.`,
      cuando: fmt(s.creadoEn),
      nuevo: s.estado === "nueva",
    })),
    ...reservas.map((r) => ({
      texto: `Reserva de ${r.nombre} para el ${fmt(r.fechaHoraInicio)}.`,
      cuando: fmt(r.creadoEn),
      nuevo: r.estado === "pendiente",
    })),
  ]
    .sort((a, b) => Number(b.nuevo) - Number(a.nuevo))
    .slice(0, 6);

  return (
    <>
      <span className={shared.eye}>Dashboard de control</span>
      <h1 className={shared.title}>Dashboard</h1>
      <p className={shared.sub}>Resumen de la actividad administrativa.</p>

      {permiso === "denegado" && (
        <p className={styles.aviso}>
          Esa sección es exclusiva del administrador principal. Tu cuenta sigue
          con acceso a la operación del día a día.
        </p>
      )}

      <div className={styles.stats}>
        <div className={`${styles.stat} ${styles.statHl}`}>
          <span>Reseñas pendientes</span>
          <b>{stats.resenasPendientes}</b>
          <small>Por moderar</small>
        </div>
        <div className={styles.stat}>
          <span>Mensajes nuevos</span>
          <b>{stats.leadsNuevos}</b>
          <small>Sin gestionar</small>
        </div>
        <div className={styles.stat}>
          <span>Reservas pendientes</span>
          <b>{stats.reservasPendientes}</b>
          <small>Por confirmar</small>
        </div>
        <div className={styles.stat}>
          <span>Apoyo social (nuevas)</span>
          <b>{stats.solicitudesNuevas}</b>
          <small>Por revisar</small>
        </div>
      </div>

      <div className={styles.row}>
        <section className={shared.card}>
          <h2 className={shared.cardTitle}>Actividad reciente</h2>
          {actividad.length === 0 && (
            <p style={{ color: "#8a8a8a", fontSize: 13 }}>Sin actividad registrada.</p>
          )}
          {actividad.map((a) => (
            <div key={a.texto} className={styles.act}>
              <i className={`${styles.dot} ${a.nuevo ? "" : styles.dotOld}`} />
              <p>{a.texto}</p>
              <time>{a.cuando}</time>
            </div>
          ))}
        </section>

        <div className={styles.stack}>
          <section className={shared.card}>
            <h2 className={shared.cardTitle}>Accesos rápidos</h2>
            <div className={styles.quick}>
              {atajos.map((a) => (
                <Link key={a.titulo} href={a.href} className={styles.q}>
                  {a.titulo}
                  <span>{a.detalle}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className={shared.card}>
            <h2 className={shared.cardTitle}>Actividad de la semana</h2>
            <div className={styles.bars}>
              {SEMANA.map((d) => (
                <i
                  key={d.dia}
                  className={d.hoy ? styles.barHoy : undefined}
                  style={{ height: `${d.alto}%` }}
                />
              ))}
            </div>
            <div className={styles.days}>
              {SEMANA.map((d) => (
                <span key={d.dia}>{d.dia}</span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
