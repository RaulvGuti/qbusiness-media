'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import ReviewsList from '@/components/leads/ReviewsList';
import ReviewModal from '@/components/leads/ReviewModal';
import type { FormularioResena } from '@/components/leads/ReviewModal';

// Mock temporal con la estructura exacta de la tabla public.resenas
const resenasMock = [
  {
    id: 'r1',
    autor: 'María González',
    empresa_autor: 'Agencia Creativa',
    texto: 'Excelente trabajo, muy profesional y cumplieron con todos los plazos. El resultado superó nuestras expectativas.',
    calificacion: 5,
    estado: 'APROBADA',
    origen: 'VISITANTE',
    created_at: '2025-09-10',
  },
  {
    id: 'r2',
    autor: 'Carlos López',
    empresa_autor: 'Startup Tech',
    texto: 'Gran calidad de producción y atención al detalle. Recomendados al 100%.',
    calificacion: 5,
    estado: 'APROBADA',
    origen: 'VISITANTE',
    created_at: '2025-08-15',
  },
];

export default function ResenasPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [resenas, setResenas] = useState(resenasMock);

  const handleSubmitReview = async (form: FormularioResena) => {
    // Cuando integres Supabase harás:
    // const { error } = await supabase.from('resenas').insert([form]);

    const nuevaResena = {
      id: `r-${Date.now()}`,
      ...form,
      estado: 'PENDIENTE',
      created_at: new Date().toISOString().split('T')[0],
    };

    setResenas((prev) => [nuevaResena, ...prev]);
    setModalOpen(false);
  };

  return (
    <section className="page-stack">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-qbBorder pb-6">
        <div>
          <span className="text-xs font-bold text-qbTerracotta uppercase tracking-widest">
            Testimonios
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk mt-1">
            Reseñas de Clientes
          </h2>
          <p className="text-sm text-qbMuted mt-1">
            La opinión de quienes ya confiaron en nosotros.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-qbTerracotta text-white hover:bg-qbTerracotta/90 rounded-xl text-xs font-bold transition flex items-center shadow-sm"
        >
          <Icon name="star" className="mr-2" />
          Publicar testimonio
        </button>
      </div>

      {/* Lista de Reseñas */}
      <div className="mt-6">
        <ReviewsList resenas={resenas} />
      </div>

      {/* Modal de Registro */}
      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitReview}
      />
    </section>
  );
}