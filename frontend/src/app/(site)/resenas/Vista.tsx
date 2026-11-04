'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import ReviewsList from '@/components/leads/ReviewsList';
import ReviewModal from '@/components/leads/ReviewModal';
import type {
  ResenaCliente,
  ResenaClienteInput,
  ResenaClienteResumen,
} from '@/types/resenas';
import type { ReservaEstudio } from '@/types/estudio';
import { motivoBloqueoResenaDetallado } from '@/server/services/resenas';

interface VistaProps {
  resenas: ResenaCliente[];
  tieneSesion: boolean;
  reservaCompletada: { id: string; estado: 'completada' } | null;
  reservas: ReservaEstudio[];
  resenasPropias: ResenaClienteResumen[];
}

export function Vista({
  resenas,
  tieneSesion,
  reservaCompletada,
  reservas,
  resenasPropias,
}: VistaProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const bloqueo = motivoBloqueoResenaDetallado(
    tieneSesion,
    reservas,
    resenasPropias,
  );

  const handleSubmitReview = async (form: ResenaClienteInput) => {
    const respuesta = await fetch('/api/api/resenas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reserva_id: form.reservaId || reservaCompletada?.id,
        autor: form.autor,
        empresa_autor: form.empresaAutor ?? null,
        comentario: form.comentario,
        calificacion: form.calificacion,
        video_url: form.videoUrl ?? null,
        video_proporcion: form.videoUrl ? form.videoProporcion ?? null : null,
      }),
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(datos.error ?? 'No se pudo enviar la reseña.');
    }

    setMensajeExito(
      'Gracias. Tu reseña quedó pendiente de aprobación y aparecerá pronto en el sitio.',
    );
    setModalOpen(false);
    router.refresh();
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

      {tieneSesion && bloqueo ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>{bloqueo}</p>
          <Link
            href="/renta"
            className="mt-2 inline-flex text-xs font-semibold text-qbTerracotta underline-offset-2 hover:underline"
          >
            Ver mis reservas en Renta de Estudio
          </Link>
        </div>
      ) : null}

      {mensajeExito ? (
        <p
          role="status"
          className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
        >
          {mensajeExito}
        </p>
      ) : null}

      <div className="mt-6">
        <ReviewsList resenas={resenas} />
      </div>

      <ReviewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        bloqueo={bloqueo}
        reservaId={reservaCompletada?.id}
        hrefInicioSesion={!tieneSesion ? '/login?next=/resenas' : undefined}
        onSubmit={handleSubmitReview}
      />
    </section>
  );
}
