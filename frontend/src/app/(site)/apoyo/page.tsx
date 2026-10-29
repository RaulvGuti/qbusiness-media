import Link from 'next/link';
import EventosRealizados from './EventosRealizados';
import SolicitudApoyoForm from '@/components/social/SolicitudApoyoForm';
import { listarCarpetasPublicadasConPortada } from '@/server/repositories/galeria';
import { createSupabaseServerClient } from '@/server/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ApoyoPage() {
  // Verify user session; only logged‑in users can view the support form
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <section className="page-stack">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-sm text-qbMuted">
            Inicia sesión para acceder al formulario de apoyo social.
          </p>
          <Link href="/login" className="text-qbTerracotta underline">
            Ir al login
          </Link>
        </div>
      </section>
    );
  }

  // carpetas_galeria estado='publicado' modulo='apoyo_social' + su portada
  const carpetas = await listarCarpetasPublicadasConPortada('apoyo_social');

  return (
    <section className="page-stack">
      {/* Encabezado centrado */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-[11px] font-bold text-qbInk uppercase tracking-widest">
          Compromiso con nuestra gente
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-qbInk">Apoyo Social</h2>
        <p className="text-sm text-qbMuted">
          Comprometidos con impactar a nuestra comunidad. En QBusiness Media destinamos horas de
          producción, equipo y difusión gratuita para fundaciones, cuerpos de socorro y causas sin
          fines de lucro en Guatemala.
        </p>
      </div>

      {/* Mismo ancho para las tarjetas de eventos y el formulario */}
      <div className="w-full max-w-5xl mx-auto space-y-12">
        <EventosRealizados carpetas={carpetas} />
        <SolicitudApoyoForm />
      </div>
    </section>
  );
}
