'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_SESION_ADMIN } from '@/lib/auth-cookies';

/**
 * Cliente de Supabase para acciones de sesión.
 *
 * `ambitoAdmin` elige la cookie del panel (`qb-admin-auth-token`). El sitio
 * público usa la cookie normal. Mantenerlas separadas permite que un
 * administrador pruebe el sitio como cliente sin cerrar su sesión de trabajo.
 */
async function createClient(ambitoAdmin = false) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(ambitoAdmin ? { cookieOptions: { name: COOKIE_SESION_ADMIN } } : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // El método setAll se puede ignorar desde Server Components si es necesario.
          }
        },
      },
    },
  );
}

// 1. Login de Administrador (Oculto - Exclusivo Empresa, sin registro público)
export async function adminLoginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient(true);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Credenciales inválidas o acceso no autorizado.' };
  }

  const { data: adminCheck } = await supabase
    .from('administradores')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!adminCheck) {
    await supabase.auth.signOut({ scope: 'local' });
    return { error: 'Acceso restringido solo para personal autorizado.' };
  }

  redirect('/admin/dashboard');
}

// 2. Cerrar sesión del panel: borra solo la cookie del panel.
export async function cerrarSesionAction() {
  const supabase = await createClient(true);
  await supabase.auth.signOut({ scope: 'local' });
  redirect('/admin');
}

// 3. Recuperación de contraseña para Administrador
export async function recoverPasswordAction(formData: FormData) {
  const email = formData.get('email') as string;
  const supabase = await createClient(true);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?ambito=admin`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Se han enviado las instrucciones de recuperación a su correo corporativo.' };
}

// 4. Login / Registro Público (Módulo de Reseñas)
export async function publicAuthAction(formData: FormData, isRegistering: boolean) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient(false);

  let error;
  if (isRegistering) {
    const res = await supabase.auth.signUp({ email, password });
    error = res.error;
  } else {
    const res = await supabase.auth.signInWithPassword({ email, password });
    error = res.error;
  }

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
