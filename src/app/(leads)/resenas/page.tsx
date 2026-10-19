'use client';

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import ReviewsList from '@/components/leads/ReviewsList';
import ReviewModal from '@/components/leads/ReviewModal';
import type { ResenaCliente } from '@/types/leads';
import styles from "./page.module.css";

const resenasMock: ResenaCliente[] = [
  {
    id: 'r1',
    nombreCliente: 'María González',
    empresa: 'Agencia Creativa',
    cargo: 'Directora de Marketing',
    calificacion: 5,
    testimonio:
      'Excelente trabajo, muy profesional y cumplieron con todos los plazos. El resultado superó nuestras expectativas.',
    proyectoRelacionado: 'Video Corporativo',
    estado: 'publicada',
    fechaCreacion: '2025-09-10',
    fechaPublicacion: '2025-09-12',
  },
  {
    id: 'r2',
    nombreCliente: 'Carlos López',
    empresa: 'Startup Tech',
    cargo: 'CEO',
    calificacion: 5,
    testimonio:
      'Gran calidad de producción y atención al detalle. Recomendados al 100%.',
    proyectoRelacionado: 'Campaña Lanzamiento',
    estado: 'publicada',
    fechaCreacion: '2025-08-15',
    fechaPublicacion: '2025-08-18',
  },
  {
    id: 'r3',
    nombreCliente: 'Ana Rodríguez',
    empresa: 'Fundación Social',
    cargo: 'Coordinadora',
    calificacion: 5,
    testimonio:
      'Nos apoyaron con mucho compromiso en nuestra causa. Muy agradecidos por su labor social.',
    proyectoRelacionado: 'Apoyo Social',
    estado: 'publicada',
    fechaCreacion: '2025-07-20',
    fechaPublicacion: '2025-07-22',
  },
];

export default function ResenasPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [resenas, setResenas] = useState<ResenaCliente[]>(resenasMock);

  const handleSubmitReview = (form: {
    nombreCliente: string;
    empresa: string;
    cargo: string;
    calificacion: number;
    testimonio: string;
    proyectoRelacionado: string;
  }) => {
    const nueva: ResenaCliente = {
      id: `r-${Date.now()}`,
      ...form,
      estado: 'borrador',
      fechaCreacion: new Date().toISOString().split('T')[0],
    };
    setResenas((prev) => [nueva, ...prev]);
    setModalOpen(false);
  };

  return (
    <section className={styles.page}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-qbBorder pb-6">
        <div>
          <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">Testimonios</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">Reseñas de Clientes</h2>
          <p className="text-sm text-qbMuted">La opinión de quienes ya confiaron en nosotros.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition flex items-center"
        >
          <Icon name="check-circle" className="mr-2" />
          Publicar testimonio
        </button>
      </div>

      <ReviewsList resenas={resenas} />

      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitReview}
      />
    </section>
  );
}