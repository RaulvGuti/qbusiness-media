'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';
import { obtenerSupabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const supabase = obtenerSupabase();

      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        setSuccessMessage('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
        setIsRegistering(false);
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        const { data: adminCheck } = await supabase
          .from('administradores')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (adminCheck) {
          router.push('/admin/dashboard');
        } else {
          router.push('/resenas');
        }
      }
    } catch {
      setError('Ocurrió un error inesperado.');
    } finally {
      setEnviando(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const supabase = obtenerSupabase();

      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (googleError) {
        setError(googleError.message);
      }
    } catch {
      setError('No se pudo conectar con el proveedor de Google.');
    }
  };

  const handleRecoverPassword = async () => {
    if (!form.email) {
      setError('Por favor, ingresa tu correo electrónico primero para recuperar tu contraseña.');
      return;
    }

    const supabase = obtenerSupabase();

    const { error: recoverError } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (recoverError) {
      setError(recoverError.message);
    } else {
      alert('Se han enviado las instrucciones de recuperación a tu correo electrónico.');
    }
  };

  return (
    <section className="page-stack">
      <div className="max-w-md mx-auto w-full space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-qbInk">
            {isRegistering ? 'Crear una cuenta' : 'Iniciar sesión'}
          </h1>
          <p className="text-sm text-qbMuted">
            {isRegistering 
              ? 'Regístrate para dejar reseñas y acceder a QBusiness Media.' 
              : 'Acceso para administradores y clientes de QBusiness Media.'}
          </p>
        </div>

        <div className="bg-qbChalk border border-qbBorder rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">
          {/* Botón de Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full px-6 py-3 bg-white border border-qbBorder text-qbInk hover:bg-qbLinen rounded-xl text-xs font-semibold transition flex items-center justify-center gap-3 shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.2v3.15C3.16 21.37 7.23 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.25c-.25-.72-.38-1.5-.38-2.25s.13-1.53.38-2.25V6.6H1.2C.44 8.13 0 9.87 0 12s.44 3.87 1.2 5.4l4.08-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.16 2.63 1.2 6.6l4.08 3.15c.95-2.84 3.6-4.95 6.72-4.95z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-qbBorder"></div>
            <span className="flex-shrink mx-3 text-[10px] text-qbMuted uppercase font-semibold">o correo electrónico</span>
            <div className="flex-grow border-t border-qbBorder"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-semibold text-qbInk">
                Correo electrónico
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                className="w-full bg-white border border-qbBorder rounded-xl px-4 py-3 text-sm text-qbInk focus:outline-none focus:border-qbInk transition shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-sm font-semibold text-qbInk">
                  Contraseña
                </label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={handleRecoverPassword}
                    className="text-xs font-medium text-qbIndigo hover:underline cursor-pointer"
                  >
                    ¿Recuperar contraseña?
                  </button>
                )}
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-white border border-qbBorder rounded-xl px-4 py-3 text-sm text-qbInk focus:outline-none focus:border-qbInk transition shadow-sm"
              />
            </div>

            {error && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                {error}
              </p>
            )}

            {successMessage && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full px-6 py-2.5 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition flex items-center justify-center disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {enviando ? (
                <>{isRegistering ? 'Registrando...' : 'Iniciando sesión...'}</>
              ) : (
                <>
                  <Icon name="lock" className="mr-2" />
                  {isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
                </>
              )}
            </button>

            {/* Alternar entre vistas */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-sm text-qbMuted hover:text-qbInk transition cursor-pointer font-medium"
              >
                {isRegistering 
                  ? '¿Ya tienes una cuenta? Inicia sesión' 
                  : '¿No tienes cuenta? Regístrate aquí'}
              </button>
            </div>

            <div className="text-center pt-1">
              <Link
                href="/"
                className="text-sm text-qbMuted hover:text-qbInk transition"
              >
                Volver al inicio
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}