import SolicitudApoyoForm from '@/components/social/SolicitudApoyoForm';
import styles from "./page.module.css";

export default function ApoyoPage() {
  return (
    <section className={styles.page}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-qbBorder pb-6">
        <div>
          <span className="text-xs font-bold text-qbSage uppercase tracking-widest">Impacto Social</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">Apoyo Social</h2>
          <p className="text-sm text-qbMuted">
            Apoyamos a fundaciones, instituciones sin fines de lucro y cuerpos de bomberos voluntarios.
          </p>
        </div>
      </div>

      <SolicitudApoyoForm />
    </section>
  );
}