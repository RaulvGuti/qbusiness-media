'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [enviando, setEnviando] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="page-stack">
      <div className="max-w-md mx-auto w-full space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-qbInk">
            Iniciar sesión
          </h1>
          <p className="text-sm text-qbMuted">
            Acceso exclusivo para administradores.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-qbChalk border border-qbBorder rounded-3xl shadow-sm p-6 sm:p-8 space-y-5"
        >
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
              placeholder="admin@qbusinessmedia.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-semibold text-qbInk">
              Contraseña
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full px-6 py-2.5 bg-qbChalk border border-qbBorder text-qbInk hover:bg-qbChalkHover rounded-xl text-xs font-semibold transition flex items-center justify-center disabled:opacity-60"
          >
            {enviando ? (
              <>Iniciando sesión...</>
            ) : (
              <>
                <Icon name="lock" className="mr-2" />
                Iniciar sesión
              </>
            )}
          </button>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-qbMuted hover:text-qbInk transition"
            >
              Volver al inicio
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}