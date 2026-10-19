import { Icon } from '@/components/ui/Icon';
import type { ResenaCliente } from '@/types/leads';

interface ReviewsListProps {
  resenas: ResenaCliente[];
}

function StarRating({ calificacion }: { calificacion: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => i + 1).map((s) => (
        <Icon
          key={s}
          name="star"
          className={s <= calificacion ? 'text-qbTerracotta' : 'text-qbBorder'}
        />
      ))}
    </div>
  );
}

export default function ReviewsList({ resenas }: ReviewsListProps) {
  const publicadas = resenas.filter((r) => r.estado === 'publicada');

  if (publicadas.length === 0) {
    return (
      <div className="text-center py-10 text-qbMuted">
        Aún no hay reseñas publicadas.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {publicadas.map((r) => (
        <article
          key={r.id}
          className="bg-qbChalk border border-qbBorder rounded-3xl p-6 space-y-4 shadow-sm hover:border-qbTerracotta transition"
        >
          <StarRating calificacion={r.calificacion} />
          <blockquote className="text-qbInk leading-relaxed text-sm">
            “{r.testimonio}”
          </blockquote>
          <div className="pt-3 border-t border-qbBorder space-y-1">
            <p className="font-bold text-qbInk text-sm">{r.nombreCliente}</p>
            {(r.cargo || r.empresa) && (
              <p className="text-xs text-qbMuted">
                {[r.cargo, r.empresa].filter(Boolean).join(' • ')}
              </p>
            )}
            {r.fechaPublicacion && (
              <time className="text-[11px] text-qbMuted">{r.fechaPublicacion}</time>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}