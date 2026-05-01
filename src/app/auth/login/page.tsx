'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Leaf, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clearError();
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch {}
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071a13] text-white">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80"
          alt="Campo"
          className="h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(163,230,53,0.18),transparent_25%),linear-gradient(135deg,rgba(7,26,19,0.95),rgba(7,26,19,0.82))]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8">
        <section className="max-w-2xl">
          <Link href="/" className="inline-flex items-center gap-3">
            <img src="/logo-sig-agro.png" alt="SIG Agro" className="h-11 w-11 rounded-xl object-cover" />
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">SIG Agro</div>
              <div className="text-xs text-white/60">GIS, IA y control operativo</div>
            </div>
          </Link>

          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-200">
            <ShieldCheck className="h-4 w-4" />
            Acceso seguro
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
            Entra a tu operacion y mira el campo con otra claridad.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
            Centraliza mapas, scouting, costos y recomendaciones de IA desde una sola cuenta.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {['Mapas satelitales activos', 'Scouting georreferenciado', 'Alertas y decisiones IA'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/82 backdrop-blur-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/95 p-8 text-slate-900 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-lime-100 p-3 text-[#0f2e21]">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold">Iniciar sesion</h2>
              <p className="mt-1 text-sm text-slate-500">Accede con tu cuenta productiva.</p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Contrasena</span>
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 pr-2 transition focus-within:border-emerald-500 focus-within:bg-white">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full bg-transparent px-4 py-3.5 text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f2e21] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#174531] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar al sistema'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            No tienes cuenta?{' '}
            <Link href="/auth/registro" className="font-semibold text-emerald-700 hover:text-emerald-600">
              Crear cuenta
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
