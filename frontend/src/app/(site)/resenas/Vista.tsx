'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import ReviewsList from '@/components/leads/ReviewsList';
import ReviewModal from '@/components/leads/ReviewModal';
import type { ResenaCliente, ResenaClienteInput } from '@/types/resenas';
import { motivoBloqueoResena } from '@/server/services/resenas';

interface VistaProps {
  resenas: ResenaCliente[];
}

export function Vista({ resenas }: VistaProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // SUPABASE (al conectar): comprobar sesión con supabase.auth.getClaims()
  // y buscar la reserva más reciente completada del cliente.
  const tieneSesion = false;
  const reservaCompletada = null;
  const bloqueo = motivoBloqueoResena(tieneSesion, reservaCompletada);

  const handleSubmitReview = async (form: ResenaClienteInput) => {
    // SUPABASE (al conectar):
    //   supabase.from('resenas_clientes').insert({ ...form, origen: 'cliente', estado: 'pendiente' })
    // La RLS exige reserva propia COMPLETADA. La reseña nace 'pendiente'
    // y un administrador la aprueba.
    void form;
    setModalOpen(false);
  };

  return (
    <section className="page-stack">
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
          Dejar una reseña
        </button>
      </div>

      <div className="mt-6">
        <ReviewsList resenas={resenas} />
      </div>

      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        bloqueo={bloqueo}
        onSubmit={handleSubmitReview}
      />
    </section>
  );
}
