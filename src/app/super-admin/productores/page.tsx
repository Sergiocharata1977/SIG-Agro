'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin } from '@/lib/superAdmin';
import {
  BaseBadge,
  BaseButton,
  BaseCard,
  BaseInput,
  ListTable,
  PageHeader,
  PageToolbar,
  Section,
} from '@/components/design-system';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pencil, Plus, Power, Users } from 'lucide-react';

type Producer = {
  id: string;
  userId?: string;
  email: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  provincia: string;
  localidad: string;
  razonSocial?: string;
  cuit?: string;
  activo?: boolean;
  updatedAt?: string | null;
};

type ProducerForm = {
  id?: string;
  userId: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  provincia: string;
  localidad: string;
  razonSocial: string;
  cuit: string;
};

const EMPTY_FORM: ProducerForm = {
  userId: '',
  email: '',
  nombre: '',
  apellido: '',
  telefono: '',
  provincia: '',
  localidad: '',
  razonSocial: '',
  cuit: '',
};

export default function SuperAdminProductoresPage() {
  const { firebaseUser } = useAuth();

  const [isSuper, setIsSuper] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [producers, setProducers] = useState<Producer[]>([]);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProducerForm>(EMPTY_FORM);

  useEffect(() => {
    const run = async () => {
      if (!firebaseUser) return;
      const allowed = await isSuperAdmin(firebaseUser.uid);
      setIsSuper(allowed);

      if (allowed) {
        await loadProducers();
      } else {
        setLoading(false);
      }
    };

    run();
  }, [firebaseUser]);

  async function loadProducers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/super-admin/producers', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'No se pudo cargar productores');
      setProducers(Array.isArray(data.producers) ? data.producers : []);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar productores');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(producer: Producer) {
    setForm({
      id: producer.id,
      userId: producer.userId || '',
      email: producer.email || '',
      nombre: producer.nombre || '',
      apellido: producer.apellido || '',
      telefono: producer.telefono || '',
      provincia: producer.provincia || '',
      localidad: producer.localidad || '',
      razonSocial: producer.razonSocial || '',
      cuit: producer.cuit || '',
    });
    setDialogOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      userId: form.userId || form.id || undefined,
    };

    try {
      const method = form.id ? 'PATCH' : 'POST';
      const res = await fetch('/api/super-admin/producers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Error al guardar productor');

      setDialogOpen(false);
      setForm(EMPTY_FORM);
      await loadProducers();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error al guardar productor');
    } finally {
      setSaving(false);
    }
  }

  async function toggleProducerStatus(producer: Producer) {
    try {
      const res = await fetch('/api/super-admin/producers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: producer.id,
          activo: !(producer.activo !== false),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'No se pudo actualizar estado');
      await loadProducers();
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar estado del productor');
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return producers;

    return producers.filter(p =>
      [p.nombre, p.apellido, p.email, p.localidad, p.provincia, p.razonSocial]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [producers, search]);

  const activeCount = producers.filter(p => p.activo !== false).length;
  const inactiveCount = producers.length - activeCount;

  if (!isSuper && !loading) {
    return <div className="p-8 text-center text-red-600">Acceso denegado: requiere rol Super Admin</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      <PageHeader
        title="ABM Productores"
        subtitle="Alta, edición y estado operativo de productores"
        actions={
          <BaseButton onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo productor
          </BaseButton>
        }
      />

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseCard>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total productores</p>
              <p className="text-2xl font-semibold text-slate-900">{producers.length}</p>
            </div>
          </div>
        </BaseCard>

        <BaseCard>
          <div>
            <p className="text-sm text-slate-500">Activos</p>
            <p className="text-2xl font-semibold text-emerald-700">{activeCount}</p>
          </div>
        </BaseCard>

        <BaseCard>
          <div>
            <p className="text-sm text-slate-500">Inactivos</p>
            <p className="text-2xl font-semibold text-amber-700">{inactiveCount}</p>
          </div>
        </BaseCard>
      </div>

      <PageToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre, email o razon social"
        actions={<BaseButton variant="outline" onClick={loadProducers}>Recargar</BaseButton>}
      />

      <Section title="Listado" description="Gestion centralizada de productores del sistema.">
        <ListTable
          data={filtered}
          keyExtractor={item => item.id}
          emptyState={
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              {loading ? 'Cargando productores...' : 'No hay productores cargados.'}
            </div>
          }
          columns={[
            { header: 'Nombre', cell: item => `${item.nombre} ${item.apellido || ''}`.trim() },
            { header: 'Email', accessorKey: 'email' },
            { header: 'Ubicacion', cell: item => `${item.localidad || '-'}, ${item.provincia || '-'}` },
            {
              header: 'Estado',
              cell: item => (
                <BaseBadge variant={item.activo !== false ? 'success' : 'outline'}>
                  {item.activo !== false ? 'activo' : 'inactivo'}
                </BaseBadge>
              ),
            },
            {
              header: 'Acciones',
              className: 'w-[220px]',
              cell: item => (
                <div className="flex items-center gap-2">
                  <BaseButton size="sm" variant="outline" onClick={e => { e.stopPropagation(); openEdit(item); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </BaseButton>
                  <BaseButton
                    size="sm"
                    variant={item.activo !== false ? 'destructive' : 'secondary'}
                    onClick={e => { e.stopPropagation(); toggleProducerStatus(item); }}
                  >
                    <Power className="h-3.5 w-3.5 mr-1" />
                    {item.activo !== false ? 'Desactivar' : 'Activar'}
                  </BaseButton>
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar productor' : 'Nuevo productor'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <BaseInput id="nombre" value={form.nombre} onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <BaseInput id="apellido" value={form.apellido} onChange={e => setForm(prev => ({ ...prev, apellido: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email *</Label>
                <BaseInput id="email" type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Telefono</Label>
                <BaseInput id="telefono" value={form.telefono} onChange={e => setForm(prev => ({ ...prev, telefono: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuit">CUIT</Label>
                <BaseInput id="cuit" value={form.cuit} onChange={e => setForm(prev => ({ ...prev, cuit: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia *</Label>
                <BaseInput id="provincia" value={form.provincia} onChange={e => setForm(prev => ({ ...prev, provincia: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localidad">Localidad *</Label>
                <BaseInput id="localidad" value={form.localidad} onChange={e => setForm(prev => ({ ...prev, localidad: e.target.value }))} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="razonSocial">Razon social</Label>
                <BaseInput id="razonSocial" value={form.razonSocial} onChange={e => setForm(prev => ({ ...prev, razonSocial: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <BaseButton type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </BaseButton>
              <BaseButton type="submit" disabled={saving}>
                {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear productor'}
              </BaseButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
