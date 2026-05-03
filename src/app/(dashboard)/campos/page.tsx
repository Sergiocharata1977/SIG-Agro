'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Eye, Map, Pencil, Plus, Ruler, Search, Share2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Campo } from '@/types/agro';
import { actualizarCampo, crearCampo, obtenerCampos } from '@/services/campos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PageShell } from '@/components/layout/PageShell';

const MapaGeneral = dynamic(() => import('@/components/mapa/MapaGeneral'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#132f22] text-sm text-white/70">
      Cargando GIS...
    </div>
  ),
});

const EMPTY_FORM = {
  nombre: '',
  departamento: '',
  localidad: '',
  provincia: 'Chaco',
  superficieTotal: 0,
};

export default function CamposPage() {
  const { organizationId, loading: authLoading } = useAuth();
  const [campos, setCampos] = useState<Campo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Campo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!authLoading && organizationId) {
      void loadCampos();
    }
  }, [authLoading, organizationId]);

  async function loadCampos() {
    if (!organizationId) return;
    try {
      setLoading(true);
      const data = await obtenerCampos(organizationId);
      setCampos(data);
    } finally {
      setLoading(false);
    }
  }

  function abrirDialog(campo?: Campo) {
    if (campo) {
      setEditando(campo);
      setFormData({
        nombre: campo.nombre,
        departamento: campo.departamento,
        localidad: campo.localidad || '',
        provincia: campo.provincia || 'Chaco',
        superficieTotal: campo.superficieTotal || 0,
      });
    } else {
      setEditando(null);
      setFormData(EMPTY_FORM);
    }
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId || !formData.nombre.trim() || !formData.departamento.trim()) {
      setError('Completa nombre y departamento');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const payload = {
        productorId: editando?.productorId || organizationId,
        nombre: formData.nombre.trim(),
        provincia: formData.provincia.trim() || 'Chaco',
        departamento: formData.departamento.trim(),
        localidad: formData.localidad.trim() || undefined,
        superficieTotal: Number(formData.superficieTotal || 0),
        activo: true,
      };

      if (editando) {
        await actualizarCampo(organizationId, editando.id, payload);
      } else {
        await crearCampo(organizationId, payload);
      }

      setDialogOpen(false);
      setEditando(null);
      setFormData(EMPTY_FORM);
      await loadCampos();
    } catch {
      setError(`Error al ${editando ? 'actualizar' : 'crear'} el campo`);
    } finally {
      setGuardando(false);
    }
  }

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return campos;
    return campos.filter((campo) => `${campo.nombre} ${campo.departamento} ${campo.provincia}`.toLowerCase().includes(query));
  }, [campos, search]);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Cargando GIS...</div>;
  }

  return (
    <PageShell
      title="Modulo de mapas y GIS"
      subtitle="Gestion visual de campos, capas e indices productivos."
      rightSlot={
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">
            <Ruler className="h-4 w-4" />
            Medir distancia
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-[#0f2e21] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#174531]">
            <Share2 className="h-4 w-4" />
            Exportar VRA
          </button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.42fr_1fr_0.38fr]">
        <aside className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-[#0f5a43] px-5 py-5 text-white">
            <h2 className="text-2xl font-semibold">Gestion de lotes</h2>
          </div>

          <div className="p-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar lote o campana..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none"
              />
            </label>

            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Cargando campos...
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((campo) => (
                  <div key={campo.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-4">
                        <div className="w-2 rounded-full bg-emerald-700" />
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Campo activo</div>
                          <div className="mt-1 text-2xl font-semibold text-slate-950">{campo.nombre}</div>
                          <div className="mt-2 text-sm text-slate-500">
                            {campo.departamento}, {campo.provincia}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {campo.superficieTotal?.toLocaleString('es-AR')} ha
                          </div>
                        </div>
                      </div>
                      <Eye className="mt-1 h-5 w-5 text-emerald-700" />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => abrirDialog(campo)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No hay campos para mostrar.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => abrirDialog()}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 px-4 py-3 text-sm font-semibold text-[#0c2418] transition hover:bg-lime-200"
            >
              <Plus className="h-4 w-4" />
              Nuevo campo
            </button>
          </div>
        </aside>

        <section className="relative min-h-[48rem] overflow-hidden rounded-[30px] border border-slate-200 bg-[#132f22] shadow-sm">
          <MapaGeneral />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,230,53,0.1),transparent_22%)]" />
          <div className="absolute left-6 top-6 flex rounded-[26px] border border-white/15 bg-white/90 shadow-xl backdrop-blur-sm">
            <button type="button" className="inline-flex items-center gap-2 border-r border-slate-200 px-6 py-4 text-sm font-semibold text-[#0f2e21]">
              <Map className="h-4 w-4" />
              Dibujar poligono
            </button>
            <button type="button" className="inline-flex items-center gap-2 border-r border-slate-200 px-6 py-4 text-sm font-semibold text-[#0f2e21]">
              <Ruler className="h-4 w-4" />
              Medir
            </button>
            <button type="button" className="inline-flex items-center gap-2 px-6 py-4 text-sm font-semibold text-[#0f2e21]">
              <Share2 className="h-4 w-4" />
              Exportar
            </button>
          </div>
          <div className="absolute bottom-5 left-6 right-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#081c15]/88 px-5 py-4 text-sm text-white shadow-xl">
            <div>Fecha satelital: 24 May 2024</div>
            <div>Sentinel-2 L2A</div>
            <div>Nubosidad: 0.4%</div>
            <div>EPSG:4326</div>
          </div>
        </section>

        <aside className="space-y-6">
          <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Indice vegetativo</div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-[#0f2e21]">
              NDVI - Vigor Vegetal
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Escala de valor</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Vigor alto</span>
              </div>
              <div className="mt-4 h-4 rounded-full bg-[linear-gradient(90deg,#ef4444_0%,#f59e0b_35%,#eab308_60%,#22c55e_100%)]" />
              <div className="mt-3 flex justify-between text-xs text-slate-400">
                <span>0.1</span>
                <span>0.5</span>
                <span>0.9</span>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Opacidad de capa</span>
                <span className="font-semibold text-emerald-700">85%</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-200">
                <div className="h-2 w-[85%] rounded-full bg-emerald-600" />
              </div>
            </div>
          </article>

          <article className="rounded-[30px] border border-lime-300/30 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-lime-300/25 p-3 text-[#476d0c]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-950">Anomalia detectada</div>
                <div className="mt-3 text-sm leading-6 text-slate-600">
                  Estres hidrico detectado en sector noreste. Probable falla de riego o infiltracion desigual.
                </div>
                <Link href="/analisis-ia" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-700">
                  Ver detalle
                </Link>
              </div>
            </div>
          </article>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar campo' : 'Nuevo campo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            <Field label="Nombre" required>
              <input value={formData.nombre} onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))} className={fieldClassName} required />
            </Field>
            <Field label="Departamento" required>
              <input value={formData.departamento} onChange={(e) => setFormData((prev) => ({ ...prev, departamento: e.target.value }))} className={fieldClassName} required />
            </Field>
            <Field label="Localidad">
              <input value={formData.localidad} onChange={(e) => setFormData((prev) => ({ ...prev, localidad: e.target.value }))} className={fieldClassName} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Provincia">
                <input value={formData.provincia} onChange={(e) => setFormData((prev) => ({ ...prev, provincia: e.target.value }))} className={fieldClassName} />
              </Field>
              <Field label="Superficie total (ha)">
                <input type="number" min={0} step="0.01" value={formData.superficieTotal} onChange={(e) => setFormData((prev) => ({ ...prev, superficieTotal: Number(e.target.value) }))} className={fieldClassName} />
              </Field>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className="rounded-2xl bg-lime-300 px-5 py-3 text-sm font-semibold text-[#0c2418] transition hover:bg-lime-200 disabled:opacity-60">
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear campo'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

const fieldClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}{required ? ' *' : ''}</Label>
      {children}
    </div>
  );
}
