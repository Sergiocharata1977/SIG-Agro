'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba', 'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy',
  'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquen', 'Rio Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
  'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucuman',
];

export default function RegistroPage() {
  const router = useRouter();
  const { signUp, loading, error, clearError } = useAuth();
  const [step, setStep] = useState(1);
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    cuit: '',
    province: 'Chaco',
    city: '',
    phone: '',
  });

  const displayError = localError || error;

  function update<K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setLocalError('');
    clearError();
  }

  function handleNextStep() {
    if (!formData.displayName.trim()) return setLocalError('El nombre es requerido');
    if (!formData.email.trim()) return setLocalError('El email es requerido');
    if (formData.password.length < 6) return setLocalError('La contrasena debe tener al menos 6 caracteres');
    if (formData.password !== formData.confirmPassword) return setLocalError('Las contrasenas no coinciden');
    setStep(2);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clearError();
    setLocalError('');

    if (!formData.organizationName.trim()) return setLocalError('El nombre de la organizacion es requerido');

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        organizationName: formData.organizationName,
        cuit: formData.cuit || undefined,
        province: formData.province,
        city: formData.city || undefined,
        phone: formData.phone || undefined,
      });
      router.push('/dashboard');
    } catch {}
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f7fc]">
      <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_right,rgba(178,247,70,0.18),transparent_28%),linear-gradient(135deg,#012d1d,#174531)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-3 text-white">
          <img src="/logo-sig-agro.png" alt="Don Juan GIS" className="h-11 w-11 rounded-xl object-cover" />
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">Don Juan GIS</div>
            <div className="text-xs text-white/60">Alta de cuenta productiva</div>
          </div>
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[36px] border border-white/10 bg-[#102d20] p-8 text-white shadow-2xl shadow-black/15">
            <div className="inline-flex rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime-200">
              Paso {step} de 2
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              Configura tu espacio productivo con la misma linea visual de Don Juan GIS.
            </h1>
            <p className="mt-5 text-base leading-7 text-white/72">
              Registramos usuario y organizacion para dejar lista la operacion desde el primer ingreso.
            </p>

            <div className="mt-10 space-y-4">
              <div className={`rounded-2xl border px-4 py-4 ${step === 1 ? 'border-lime-300/30 bg-lime-300/10' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-lime-300" />
                  <div>
                    <div className="font-semibold">Usuario</div>
                    <div className="text-sm text-white/60">Identidad de acceso y credenciales.</div>
                  </div>
                </div>
              </div>
              <div className={`rounded-2xl border px-4 py-4 ${step === 2 ? 'border-lime-300/30 bg-lime-300/10' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-lime-300" />
                  <div>
                    <div className="font-semibold">Organizacion</div>
                    <div className="text-sm text-white/60">Empresa, ubicacion y contexto productivo.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
            <h2 className="text-3xl font-semibold text-slate-950">
              {step === 1 ? 'Create account' : 'Workspace setup'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {step === 1 ? 'Defini tus credenciales de acceso.' : 'Completá la identidad operativa de la organizacion.'}
            </p>

            {displayError ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {displayError}
              </div>
            ) : null}

            {step === 1 ? (
              <form onSubmit={(event) => { event.preventDefault(); handleNextStep(); }} className="mt-8 space-y-5">
                <Field label="Nombre completo">
                  <input className={fieldClassName} value={formData.displayName} onChange={(event) => update('displayName', event.target.value)} required />
                </Field>
                <Field label="Email">
                  <input className={fieldClassName} type="email" value={formData.email} onChange={(event) => update('email', event.target.value)} required />
                </Field>
                <Field label="Contrasena">
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 pr-2 focus-within:border-emerald-500 focus-within:bg-white">
                    <input
                      className="w-full bg-transparent px-4 py-3.5 outline-none"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(event) => update('password', event.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Confirmar contrasena">
                  <input className={fieldClassName} type="password" value={formData.confirmPassword} onChange={(event) => update('confirmPassword', event.target.value)} required />
                </Field>
                <div className="flex justify-end">
                  <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#0f2e21] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#174531]">
                    Continuar setup
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <Field label="Nombre de la organizacion">
                  <input className={fieldClassName} value={formData.organizationName} onChange={(event) => update('organizationName', event.target.value)} required />
                </Field>
                <Field label="CUIT">
                  <input className={fieldClassName} value={formData.cuit} onChange={(event) => update('cuit', event.target.value)} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Provincia">
                    <select className={fieldClassName} value={formData.province} onChange={(event) => update('province', event.target.value)}>
                      {PROVINCIAS.map((provincia) => (
                        <option key={provincia} value={provincia}>{provincia}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Ciudad">
                    <input className={fieldClassName} value={formData.city} onChange={(event) => update('city', event.target.value)} />
                  </Field>
                </div>
                <Field label="Telefono">
                  <input className={fieldClassName} value={formData.phone} onChange={(event) => update('phone', event.target.value)} />
                </Field>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(1)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <ArrowLeft className="h-4 w-4" />
                    Atras
                  </button>
                  <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-lime-300 px-5 py-3 text-sm font-semibold text-[#0c2418] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? 'Creando...' : 'Crear cuenta y espacio'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 text-sm text-slate-600">
              Ya tenes cuenta?{' '}
              <Link href="/auth/login" className="font-semibold text-emerald-700 hover:text-emerald-600">
                Iniciar sesion
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

const fieldClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
