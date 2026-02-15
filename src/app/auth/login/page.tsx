'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { BaseButton, BaseCard, BaseInput } from '@/components/design-system';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">SIG Agro</h1>
          <p className="text-slate-600">Ingreso al sistema</p>
        </div>

        <BaseCard title="Iniciar sesion" description="Accede con tu cuenta de productor">
          {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <BaseInput type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Contrasena</label>
              <div className="flex gap-2">
                <BaseInput type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
                <BaseButton type="button" variant="outline" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Ver'}</BaseButton>
              </div>
            </div>

            <BaseButton type="submit" fullWidth disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</BaseButton>
          </form>

          <p className="mt-4 text-sm text-slate-600">No tienes cuenta? <Link href="/auth/registro" className="text-emerald-700 font-medium">Registrarse</Link></p>
        </BaseCard>
      </div>
    </div>
  );
}
