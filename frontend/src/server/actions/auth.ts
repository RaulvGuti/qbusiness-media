'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Cliente de Supabase corregido con await cookies() para Next.js reciente
async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // El método setAll se puede ignorar desde Server Components si es necesario
          }
        },
      },
    }
  );
}

// 1. Login de Administrador (Oculto - Exclusivo Empresa, sin registro público)
export async function adminLoginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

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
    await supabase.auth.signOut();
    return { error: 'Acceso restringido solo para personal autorizado.' };
  }

  redirect('/admin/dashboard');
}

// 2. Cerrar sesión del panel (borra la cookie de Supabase en el servidor)
export async function cerrarSesionAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin');
}

// 3. Recuperación de Contraseña para Administrador
export async function recoverPasswordAction(formData: FormData) {
  const email = formData.get('email') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/reset-password`,
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
  const supabase = await createClient();

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