import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getDashboardMetrics() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  // 1. Contar reseñas pendientes de aprobar
  const { count: pendingReviewsCount, error: err1 } = await supabase
    .from('resenas_clientes')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente');

  // 2. Contar mensajes nuevos (leads de contacto)
  const { count: newMessagesCount, error: err2 } = await supabase
    .from('leads_contacto')
    .select('*', { count: 'exact', head: true })
    .eq('leido', false);

  // 3. Contar solicitudes de reserva pendientes
  const { count: pendingBookingsCount, error: err3 } = await supabase
    .from('reservas')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pendiente');

  if (err1 || err2 || err3) {
    console.error('Error al obtener métricas del dashboard:', { err1, err2, err3 });
  }

  return {
    pendingReviews: pendingReviewsCount || 0,
    newMessages: newMessagesCount || 0,
    pendingBookings: pendingBookingsCount || 0,
  };
}