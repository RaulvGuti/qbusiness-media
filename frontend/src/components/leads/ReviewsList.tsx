import { Icon } from '@/components/ui/Icon';
import type { ResenaCliente } from '@/types/resenas';

interface ReviewsListProps {
  resenas: ResenaCliente[];
}

function StarRating({ calificacion }: { calificacion: number | null }) {
  if (calificacion === null) return null;
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
  const publicadas = resenas.filter((r) => r.estado === 'aprobada');

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
            “{r.comentario}”
          </blockquote>
          {r.videoUrl && (
            <p className="text-xs text-qbIndigo">
              <Icon name="play-circle" className="mr-1" />
              Reseña en video ({r.videoProporcion ?? '16/9'})
            </p>
          )}
          <div className="pt-3 border-t border-qbBorder space-y-1">
            <p className="font-bold text-qbInk text-sm">{r.autor}</p>
            {r.empresaAutor && (
              <p className="text-xs text-qbMuted">{r.empresaAutor}</p>
            )}
            <time className="text-[11px] text-qbMuted">
              {new Date(r.creadoEn).toLocaleDateString('es-GT')}
            </time>
          </div>
        </article>
      ))}
    </div>
  );
}
