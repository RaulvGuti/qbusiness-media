import Link from "next/link";
import shared from "../panel.module.css";
import styles from "./page.module.css";

const ACTIVIDAD = [
  { texto: "Nueva solicitud de reserva del estudio para el sábado.", cuando: "Hace 20 min", nuevo: true },
  { texto: "Reseña pendiente de aprobar de un cliente.", cuando: "Hace 2 h", nuevo: true },
  { texto: "Mensaje nuevo desde el formulario de contacto.", cuando: "Hace 3 h", nuevo: true },
  { texto: "Solicitud de apoyo social recibida.", cuando: "Ayer", nuevo: false },
  { texto: "Reseña aprobada y publicada.", cuando: "Ayer", nuevo: false },
];

const ATAJOS = [
  { titulo: "Reseñas", detalle: "Aprobar o rechazar" },
  { titulo: "Contactos", detalle: "Responder mensajes" },
  { titulo: "Reservas del estudio", detalle: "Revisar solicitudes" },
  { titulo: "Textos del sitio", detalle: "Editar contenido", href: "/admin/textos" },
  { titulo: "Galería", detalle: "Subir fotos y videos" },
];

const SEMANA = [
  { dia: "L", alto: 40 },
  { dia: "M", alto: 65 },
  { dia: "X", alto: 50 },
  { dia: "J", alto: 85 },
  { dia: "V", alto: 100, hoy: true },
  { dia: "S", alto: 30 },
  { dia: "D", alto: 45 },
];

export default function DashboardPage() {
  return (
    <>
      <span className={shared.eye}>Dashboard de control</span>
      <h1 className={shared.title}>Dashboard</h1>
      <p className={shared.sub}>Resumen de la actividad administrativa.</p>

      <div className={styles.stats}>
        <div className={`${styles.stat} ${styles.statHl}`}>
          <span>Reseñas pendientes</span>
          <b>7</b>
          <small>3 llegaron esta semana</small>
        </div>
        <div className={styles.stat}>
          <span>Mensajes nuevos</span>
          <b>12</b>
          <small>4 sin leer desde ayer</small>
        </div>
        <div className={styles.stat}>
          <span>Solicitudes de reserva</span>
          <b>5</b>
          <small>2 para este fin de semana</small>
        </div>
      </div>

      <div className={styles.row}>
        <section className={shared.card}>
          <h2 className={shared.cardTitle}>Actividad reciente</h2>
          {ACTIVIDAD.map((a) => (
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
              {ATAJOS.map((a) =>
                a.href ? (
                  <Link key={a.titulo} href={a.href} className={styles.q}>
                    {a.titulo}
                    <span>{a.detalle}</span>
                  </Link>
                ) : (
                  <button key={a.titulo} type="button" className={styles.q}>
                    {a.titulo}
                    <span>{a.detalle}</span>
                  </button>
                ),
              )}
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
