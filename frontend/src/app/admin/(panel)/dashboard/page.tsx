import Link from "next/link";
import shared from "../panel.module.css";
import styles from "./page.module.css";
import {
  obtenerActividadReciente,
  obtenerActividadSemanal,
  obtenerResumenDashboard,
  type ActividadDashboard,
} from "@/server/repositories/dashboard";
import { exigirStaffPanel } from "@/server/auth/panel";
import { puede, type Permiso } from "@/lib/permisos";

export const dynamic = "force-dynamic";

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

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("es-GT", { day: "2-digit", month: "short" });

function textoActividad(item: ActividadDashboard): string {
  switch (item.tipo) {
    case "contacto":
      return `Mensaje de ${item.titulo} en el formulario de contacto.`;
    case "apoyo_social":
      return `Solicitud de apoyo de ${item.titulo}.`;
    case "resena":
      return `Reseña ${item.estado === "pendiente" ? "pendiente" : "de"} ${item.titulo}.`;
    case "reserva":
      return `Reserva de ${item.titulo}${
        item.detalle ? ` para el ${item.detalle}` : ""
      }.`;
    default:
      return item.titulo;
  }
}

function esActividadNueva(item: ActividadDashboard): boolean {
  if (item.tipo === "contacto") return item.estado === "nuevo";
  if (item.tipo === "apoyo_social") return item.estado === "nueva";
  return item.estado === "pendiente";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ permiso?: string }>;
}) {
  const { perfil, supabase } = await exigirStaffPanel();
  const { permiso } = await searchParams;
  const atajos = ATAJOS.filter((atajo) => puede(perfil.rol, atajo.permiso));

  const [resumen, actividadReciente, semana] = await Promise.all([
    obtenerResumenDashboard(supabase),
    obtenerActividadReciente(supabase, 8),
    obtenerActividadSemanal(supabase),
  ]);

  // La sección Contactos ya no existe en el panel: su actividad tampoco se
  // muestra en el dashboard, aunque los leads se conservan en la base.
  const actividad = actividadReciente.filter((item) => item.tipo !== "contacto");

  const stats = [
    {
      etiqueta: "Reseñas pendientes",
      valor: resumen.resenasPendientes,
      detalle: "Por moderar",
      destacada: true,
    },
    {
      etiqueta: "Reservas pendientes",
      valor: resumen.reservasPendientes,
      detalle: "Por confirmar",
    },
    {
      etiqueta: "Apoyo social (nuevas)",
      valor: resumen.apoyoSocialNuevo,
      detalle: "Por revisar",
    },
    {
      etiqueta: "Comprobantes por revisar",
      valor: resumen.pagosPorRevisar,
      detalle: "Subidos por el cliente",
    },
  ];

  const maximoSemana = Math.max(1, ...semana.map((dia) => dia.total));

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
        {stats.map((stat) => (
          <div
            key={stat.etiqueta}
            className={`${styles.stat} ${stat.destacada ? styles.statHl : ""}`}
          >
            <span>{stat.etiqueta}</span>
            <b>{stat.valor}</b>
            <small>{stat.detalle}</small>
          </div>
        ))}
      </div>

      <div className={styles.row}>
        <section className={shared.card}>
          <h2 className={shared.cardTitle}>Actividad reciente</h2>
          {actividad.length === 0 && (
            <p style={{ color: "#8a8a8a", fontSize: 13 }}>Sin actividad registrada.</p>
          )}
          {actividad.map((item) => {
            const nuevo = esActividadNueva(item);
            return (
              <div
                key={`${item.tipo}-${item.entidadId}`}
                className={styles.act}
              >
                <i className={`${styles.dot} ${nuevo ? "" : styles.dotOld}`} />
                <p>{textoActividad(item)}</p>
                <time>{fmt(item.creadoEn)}</time>
              </div>
            );
          })}
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
              {semana.map((dia) => (
                <i
                  key={dia.clave}
                  className={dia.esHoy ? styles.barHoy : undefined}
                  style={{
                    height: `${Math.max(
                      6,
                      Math.round((dia.total / maximoSemana) * 100),
                    )}%`,
                  }}
                  title={`${dia.etiqueta}: ${dia.total} ${
                    dia.total === 1 ? "registro" : "registros"
                  }`}
                />
              ))}
            </div>
            <div className={styles.days}>
              {semana.map((dia) => (
                <span key={dia.clave}>{dia.etiqueta}</span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
