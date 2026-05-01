'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Plus, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { crearCampania, obtenerCampanias } from '@/services/campanias';
import { obtenerCampos } from '@/services/campos';
import { obtenerLotes } from '@/services/lotes';
import type { Campania, Campo, Lote } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageShell } from '@/components/layout/PageShell';

const CULTIVOS = ['Soja', 'Maiz', 'Algodon', 'Girasol', 'Sorgo', 'Trigo', 'Arroz', 'Poroto', 'Otro'];

const EMPTY_FORM = {
  campoId: '',
  loteId: '',
  cultivo: '',
  fechaInicio: new Date().toISOString().split('T')[0],
  nombre: '',
};

function badgeClass(estado: string) {
  if (estado === 'finalizada') return 'bg-slate-100 text-slate-700';
  if (estado === 'en_curso') return 'bg-emerald-100 text-emerald-700';
  return 'bg-blue-100 text-blue-700';
}

export default function CampaniasPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'en_curso' | 'finalizadas'>('todas');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [campos, setCampos] = useState<Campo[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) void cargarCampanias();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!dialogOpen || !user) return;
    obtenerCampos(user.id).then(setCampos).catch(() => setCampos([]));
  }, [dialogOpen, user]);

  useEffect(() => {
    if (!user || !form.campoId) {
      setLotes([]);
      return;
    }
    obtenerLotes(user.id, form.campoId).then(setLotes).catch(() => setLotes([]));
  }, [user, form.campoId]);

  useEffect(() => {
    if (form.cultivo && form.loteId) {
      const lote = lotes.find((item) => item.id === form.loteId);
      const anio = new Date(form.fechaInicio).getFullYear();
      setForm((prev) => ({
        ...prev,
        nombre: `${prev.cultivo} ${lote?.nombre || ''} ${anio}/${anio + 1}`,
      }));
    }
  }, [form.cultivo, form.loteId, form.fechaInicio, lotes]);

  async function cargarCampanias() {
    if (!user) return;
    try {
      setLoading(true);
      const data = await obtenerCampanias(user.id);
      setCampanias(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!form.campoId || !form.loteId || !form.cultivo) {
      setError('Completa campo, lote y cultivo');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const nueva = await crearCampania(user.id, {
        campoId: form.campoId,
        loteId: form.loteId,
        nombre: form.nombre,
        cultivo: form.cultivo,
        fechaInicio: new Date(form.fechaInicio),
        estado: 'planificada',
      });
      setCampanias((prev) => [...prev, nueva]);
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    } catch {
      setError('Error al crear la campana');
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    const byEstado = campanias.filter((campania) => {
      if (filtro === 'todas') return true;
      if (filtro === 'en_curso') return campania.estado === 'en_curso' || campania.estado === 'planificada';
      return campania.estado === 'finalizada';
    });

    const query = search.toLowerCase().trim();
    if (!query) return byEstado;
    return byEstado.filter((campania) => `${campania.nombre} ${campania.cultivo} ${campania.estado}`.toLowerCase().includes(query));
  }, [campanias, filtro, search]);

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Cargando campanas...</div>;
  }

  return (
    <PageShell
      title="Campanas"
      subtitle={`${campanias.length} campanas registradas`}
      rightSlot={
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_FORM);
            setError(null);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#0f2e21] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#174531]"
        >
          <Plus className="h-4 w-4" />
          Nueva campana
        </button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o cultivo"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none"
            />
          </label>
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'en_curso', label: 'En curso' },
            { key: 'finalizadas', label: 'Finalizadas' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFiltro(item.key as typeof filtro)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                filtro === item.key ? 'bg-[#0f2e21] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {filtered.length > 0 ? (
            filtered.map((campania) => (
              <Link key={campania.id} href={`/campanias/${campania.id}`}>
                <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        <CalendarDays className="h-4 w-4" />
                        Campana activa
                      </div>
                      <h3 className="mt-4 text-2xl font-semibold text-slate-950">{campania.nombre}</h3>
                      <p className="mt-2 text-sm text-slate-600">{campania.cultivo}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(campania.estado)}`}>
                      {campania.estado}
                    </span>
                  </div>
                  <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Inicio: {new Date(campania.fechaInicio).toLocaleDateString('es-AR')}
                  </div>
                </article>
              </Link>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500 lg:col-span-3">
              No hay campanas para el filtro seleccionado.
            </div>
          )}
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva campana</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5 pt-2">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <FormField label="Campo *">
              <select
                value={form.campoId}
                onChange={(event) => setForm((prev) => ({ ...prev, campoId: event.target.value, loteId: '' }))}
                className={fieldClassName}
              >
                <option value="">Seleccionar campo</option>
                {campos.map((campo) => (
                  <option key={campo.id} value={campo.id}>{campo.nombre}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Lote *">
              <select
                value={form.loteId}
                onChange={(event) => setForm((prev) => ({ ...prev, loteId: event.target.value }))}
                className={fieldClassName}
              >
                <option value="">{form.campoId ? 'Seleccionar lote' : 'Primero elige un campo'}</option>
                {lotes.map((lote) => (
                  <option key={lote.id} value={lote.id}>{lote.nombre}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Cultivo *">
              <select
                value={form.cultivo}
                onChange={(event) => setForm((prev) => ({ ...prev, cultivo: event.target.value }))}
                className={fieldClassName}
              >
                <option value="">Seleccionar cultivo</option>
                {CULTIVOS.map((cultivo) => (
                  <option key={cultivo} value={cultivo}>{cultivo}</option>
                ))}
              </select>
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Fecha inicio *">
                <input
                  type="date"
                  value={form.fechaInicio}
                  onChange={(event) => setForm((prev) => ({ ...prev, fechaInicio: event.target.value }))}
                  className={fieldClassName}
                  required
                />
              </FormField>
              <FormField label="Nombre sugerido">
                <input
                  value={form.nombre}
                  onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                  className={fieldClassName}
                  placeholder="Nombre de la campana"
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="rounded-2xl bg-lime-300 px-5 py-3 text-sm font-semibold text-[#0c2418] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Creando...' : 'Crear campana'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

const fieldClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white';

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
