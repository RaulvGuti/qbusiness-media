'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        setError('Credenciales inválidas o acceso no autorizado.');
        setEnviando(false);
        return;
      }

      const { data: adminCheck, error: adminError } = await supabase
        .from('administradores')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (adminError || !adminCheck) {
        await supabase.auth.signOut();
        setError('Acceso restringido solo para personal autorizado.');
        setEnviando(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch (err) {
      setError('Ocurrió un error inesperado al iniciar sesión.');
      setEnviando(false);
    }
  };

  const handleRecoverPassword = async () => {
    if (!form.email) {
      setError('Por favor, ingresa tu correo electrónico corporativo primero.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      alert('Se han enviado las instrucciones de recuperación a tu correo corporativo.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Panel Administrativo
          </h1>
          <p className="text-sm text-[#8a8a8a]">
            Acceso exclusivo y protegido para la empresa. Sin registro público.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#0d0d0d] border border-[#262626] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="space-y-2">
            <label htmlFor="admin-email" className="text-sm font-semibold text-white">
              Correo electrónico corporativo
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="admin@qbusinessmedia.com"
              className="w-full bg-[#171717] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="admin-password" className="text-sm font-semibold text-white">
                Contraseña
              </label>
              <button
                type="button"
                onClick={handleRecoverPassword}
                className="text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
              >
                ¿Recuperar contraseña?
              </button>
            </div>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-[#171717] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-xl p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full px-6 py-3.5 bg-white text-black hover:bg-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center disabled:opacity-60 cursor-pointer shadow-sm"
          >
            {enviando ? (
              <>Validando acceso...</>
            ) : (
              <>
                <Icon name="lock" className="mr-2" />
                Entrar al Panel
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-sm text-[#8a8a8a] hover:text-white transition"
            >
              Volver al inicio
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}