'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { crearCampania } from '@/services/campanias';
import { obtenerCampos } from '@/services/campos';
import { obtenerLotes } from '@/services/lotes';
import type { Campo, Lote } from '@/types';
import {
  BaseButton,
  BaseInput,
  BaseSelect,
  BaseSelectContent,
  BaseSelectItem,
  BaseSelectTrigger,
  BaseSelectValue,
  Section,
} from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';

const CULTIVOS = ['Soja', 'Maiz', 'Algodon', 'Girasol', 'Sorgo', 'Trigo', 'Arroz', 'Poroto', 'Otro'];

export default function NuevaCampaniaPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [campos, setCampos] = useState<Campo[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    campoId: '',
    loteId: '',
    nombre: '',
    cultivo: '',
    fechaInicio: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!user) return;

    const cargarCampos = async () => {
      try {
        const data = await obtenerCampos(user.id);
        setCampos(data);
      } finally {
        setLoadingData(false);
      }
    };

    void cargarCampos();
  }, [user]);

  useEffect(() => {
    if (!user || !formData.campoId) {
      setLotes([]);
      return;
    }

    const cargarLotes = async () => {
      const data = await obtenerLotes(user.id, formData.campoId);
      setLotes(data);
    };

    void cargarLotes();
  }, [user, formData.campoId]);

  useEffect(() => {
    if (formData.cultivo && formData.loteId) {
      const lote = lotes.find(l => l.id === formData.loteId);
      const anio = new Date(formData.fechaInicio).getFullYear();
      setFormData(prev => ({ ...prev, nombre: `${prev.cultivo} ${lote?.nombre || ''} ${anio}/${anio + 1}` }));
    }
  }, [formData.cultivo, formData.loteId, formData.fechaInicio, lotes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!formData.campoId || !formData.loteId || !formData.cultivo) {
      setError('Completa los campos obligatorios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await crearCampania(user.id, {
        campoId: formData.campoId,
        loteId: formData.loteId,
        nombre: formData.nombre,
        cultivo: formData.cultivo,
        fechaInicio: new Date(formData.fechaInicio),
        estado: 'planificada',
      });

      router.push('/campanias');
    } catch {
      setError('Error al crear la campana');
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando...</div>;

  return (
    <PageShell title="Nueva campana" subtitle="Wizard operativo para campo, lote, cultivo, fechas y rendimiento esperado.">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <Section>
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#102d20,#1b4332)] p-6 text-white shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lime-200">Paso 1 a 5</p>
            <h2 className="mt-3 text-3xl font-semibold">Nueva campana agricola</h2>
            <p className="mt-3 text-sm leading-6 text-white/72">
              El flujo replica el wizard de Stitch: campo, lote, cultivo, fechas y definicion de rendimiento esperado.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              {['Seleccionar campo', 'Elegir lote', 'Definir cultivo', 'Fechas clave', 'Confirmacion'].map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-lime-200">0{index + 1}</span> {step}
                </div>
              ))}
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-[32px] border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <Field label="Campo" required>
            <BaseSelect value={formData.campoId} onValueChange={v => setFormData(prev => ({ ...prev, campoId: v, loteId: '' }))}>
              <BaseSelectTrigger><BaseSelectValue placeholder="Seleccionar campo" /></BaseSelectTrigger>
              <BaseSelectContent>
                {campos.map(campo => <BaseSelectItem key={campo.id} value={campo.id}>{campo.nombre}</BaseSelectItem>)}
              </BaseSelectContent>
            </BaseSelect>
          </Field>

          <Field label="Lote" required>
            <BaseSelect value={formData.loteId} onValueChange={v => setFormData(prev => ({ ...prev, loteId: v }))}>
              <BaseSelectTrigger><BaseSelectValue placeholder="Seleccionar lote" /></BaseSelectTrigger>
              <BaseSelectContent>
                {lotes.map(lote => <BaseSelectItem key={lote.id} value={lote.id}>{lote.nombre}</BaseSelectItem>)}
              </BaseSelectContent>
            </BaseSelect>
          </Field>

          <Field label="Cultivo" required>
            <BaseSelect value={formData.cultivo} onValueChange={v => setFormData(prev => ({ ...prev, cultivo: v }))}>
              <BaseSelectTrigger><BaseSelectValue placeholder="Seleccionar cultivo" /></BaseSelectTrigger>
              <BaseSelectContent>
                {CULTIVOS.map(cultivo => <BaseSelectItem key={cultivo} value={cultivo}>{cultivo}</BaseSelectItem>)}
              </BaseSelectContent>
            </BaseSelect>
          </Field>

          <Field label="Fecha inicio" required>
            <BaseInput type="date" value={formData.fechaInicio} onChange={e => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))} required />
          </Field>

          <Field label="Nombre campana" required>
            <BaseInput value={formData.nombre} onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))} required />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <BaseButton type="button" variant="outline" onClick={() => router.push('/campanias')}>Cancelar</BaseButton>
            <BaseButton type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear campana'}</BaseButton>
          </div>
          </form>
        </div>
      </Section>
    </PageShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}{required ? ' *' : ''}</label>
      {children}
    </div>
  );
}
