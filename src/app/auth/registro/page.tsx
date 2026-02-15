'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { BaseButton, BaseCard, BaseInput, BaseSelect, BaseSelectContent, BaseSelectItem, BaseSelectTrigger, BaseSelectValue } from '@/components/design-system';

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Cordoba','Corrientes','Entre Rios','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquen','Rio Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucuman'
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
    setFormData(prev => ({ ...prev, [key]: value }));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (!formData.organizationName.trim()) return setLocalError('El nombre de la empresa es requerido');

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">SIG Agro</h1>
          <p className="text-slate-600">Registro de cuenta</p>
        </div>

        <BaseCard title={step === 1 ? 'Paso 1: Usuario' : 'Paso 2: Empresa'}>
          {displayError && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{displayError}</div>}

          {step === 1 ? (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
              <Field label="Nombre completo"><BaseInput value={formData.displayName} onChange={e => update('displayName', e.target.value)} required /></Field>
              <Field label="Email"><BaseInput type="email" value={formData.email} onChange={e => update('email', e.target.value)} required /></Field>
              <Field label="Contrasena">
                <div className="flex gap-2">
                  <BaseInput type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => update('password', e.target.value)} required />
                  <BaseButton type="button" variant="outline" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Ver'}</BaseButton>
                </div>
              </Field>
              <Field label="Confirmar contrasena"><BaseInput type="password" value={formData.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required /></Field>
              <div className="flex justify-end"><BaseButton type="submit">Continuar</BaseButton></div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nombre organizacion"><BaseInput value={formData.organizationName} onChange={e => update('organizationName', e.target.value)} required /></Field>
              <Field label="CUIT"><BaseInput value={formData.cuit} onChange={e => update('cuit', e.target.value)} /></Field>
              <Field label="Provincia">
                <BaseSelect value={formData.province} onValueChange={v => update('province', v)}>
                  <BaseSelectTrigger><BaseSelectValue /></BaseSelectTrigger>
                  <BaseSelectContent>
                    {PROVINCIAS.map(p => <BaseSelectItem key={p} value={p}>{p}</BaseSelectItem>)}
                  </BaseSelectContent>
                </BaseSelect>
              </Field>
              <Field label="Ciudad"><BaseInput value={formData.city} onChange={e => update('city', e.target.value)} /></Field>
              <Field label="Telefono"><BaseInput value={formData.phone} onChange={e => update('phone', e.target.value)} /></Field>
              <div className="flex justify-between gap-2">
                <BaseButton type="button" variant="outline" onClick={() => setStep(1)}>Atras</BaseButton>
                <BaseButton type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear cuenta'}</BaseButton>
              </div>
            </form>
          )}

          <p className="mt-4 text-sm text-slate-600">Ya tienes cuenta? <Link href="/auth/login" className="text-emerald-700 font-medium">Iniciar sesion</Link></p>
        </BaseCard>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
