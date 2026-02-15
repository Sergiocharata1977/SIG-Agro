'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BaseBadge,
  BaseButton,
  BaseCard,
  BaseInput,
  BaseSelect,
  BaseSelectContent,
  BaseSelectItem,
  BaseSelectTrigger,
  BaseSelectValue,
  ListTable,
  PageToolbar,
  Section,
} from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';
import {
  actualizarTercero,
  calcularTotalesSaldos,
  crearTercero,
  obtenerTerceros,
} from '@/services/terceros';
import { useAuth } from '@/contexts/AuthContext';
import type { Tercero, TipoTercero } from '@/types/contabilidad-simple';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type FormState = {
  nombre: string;
  tipo: TipoTercero;
  cuit: string;
  direccion: string;
  localidad: string;
  provincia: string;
  telefono: string;
  email: string;
  notas: string;
};

const EMPTY_FORM: FormState = {
  nombre: '',
  tipo: 'ambos',
  cuit: '',
  direccion: '',
  localidad: '',
  provincia: '',
  telefono: '',
  email: '',
  notas: '',
};

export default function TercerosPage() {
  const { user } = useAuth();

  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<TipoTercero | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [totales, setTotales] = useState({ totalCuentasCobrar: 0, totalCuentasPagar: 0 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Tercero | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (user?.organizationId) {
      void cargarDatos();
    }
  }, [user, filtroTipo]);

  async function cargarDatos() {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      const [tercerosData, totalesData] = await Promise.all([
        obtenerTerceros(user.organizationId, filtroTipo === 'todos' ? undefined : filtroTipo),
        calcularTotalesSaldos(user.organizationId),
      ]);
      setTerceros(tercerosData);
      setTotales(totalesData);
    } catch (error) {
      console.error('Error cargando terceros:', error);
    } finally {
      setLoading(false);
    }
  }

  function abrirDialog(tercero?: Tercero) {
    if (tercero) {
      setEditando(tercero);
      setFormData({
        nombre: tercero.nombre,
        tipo: tercero.tipo,
        cuit: tercero.cuit || '',
        direccion: tercero.direccion || '',
        localidad: tercero.localidad || '',
        provincia: tercero.provincia || '',
        telefono: tercero.telefono || '',
        email: tercero.email || '',
        notas: tercero.notas || '',
      });
    } else {
      setEditando(null);
      setFormData(EMPTY_FORM);
    }
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.organizationId || !formData.nombre.trim()) return;

    setGuardando(true);
    try {
      if (editando) {
        await actualizarTercero(user.organizationId, editando.id, formData);
      } else {
        await crearTercero(user.organizationId, {
          ...formData,
          activo: true,
        });
      }

      setDialogOpen(false);
      setEditando(null);
      setFormData(EMPTY_FORM);
      await cargarDatos();
    } catch (error) {
      console.error('Error guardando tercero:', error);
    } finally {
      setGuardando(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return terceros;
    return terceros.filter(t =>
      [t.nombre, t.cuit, t.localidad, t.provincia, t.email].join(' ').toLowerCase().includes(q)
    );
  }, [terceros, search]);

  if (loading) {
    return (
      <PageShell title="Terceros" subtitle="Clientes, proveedores y comerciales">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Cargando terceros...</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Terceros" subtitle="Clientes, proveedores y comerciales">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseCard>
          <p className="text-sm text-slate-500">Cuentas a cobrar</p>
          <p className="text-2xl font-semibold text-blue-700">$ {totales.totalCuentasCobrar.toLocaleString('es-AR')}</p>
        </BaseCard>
        <BaseCard>
          <p className="text-sm text-slate-500">Cuentas a pagar</p>
          <p className="text-2xl font-semibold text-orange-700">$ {totales.totalCuentasPagar.toLocaleString('es-AR')}</p>
        </BaseCard>
        <BaseCard>
          <p className="text-sm text-slate-500">Total terceros</p>
          <p className="text-2xl font-semibold text-slate-900">{terceros.length}</p>
        </BaseCard>
      </div>

      <PageToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre, CUIT, localidad..."
        filters={
          <BaseSelect value={filtroTipo} onValueChange={v => setFiltroTipo(v as TipoTercero | 'todos')}>
            <BaseSelectTrigger className="w-44">
              <BaseSelectValue />
            </BaseSelectTrigger>
            <BaseSelectContent>
              <BaseSelectItem value="todos">Todos</BaseSelectItem>
              <BaseSelectItem value="cliente">Cliente</BaseSelectItem>
              <BaseSelectItem value="proveedor">Proveedor</BaseSelectItem>
              <BaseSelectItem value="ambos">Ambos</BaseSelectItem>
            </BaseSelectContent>
          </BaseSelect>
        }
        actions={<BaseButton onClick={() => abrirDialog()}>Nuevo tercero</BaseButton>}
      />

      <Section title="Listado de terceros" description="ABM unificado con saldos comerciales.">
        <ListTable
          data={filtered}
          keyExtractor={item => item.id}
          emptyState={
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              No hay terceros registrados.
            </div>
          }
          columns={[
            {
              header: 'Nombre',
              cell: item => (
                <div>
                  <p className="font-medium text-slate-900">{item.nombre}</p>
                  {(item.localidad || item.provincia) && (
                    <p className="text-xs text-slate-500">{item.localidad || '-'}{item.provincia ? `, ${item.provincia}` : ''}</p>
                  )}
                </div>
              ),
            },
            {
              header: 'Tipo',
              cell: item => (
                <BaseBadge variant={item.tipo === 'cliente' ? 'secondary' : item.tipo === 'proveedor' ? 'outline' : 'success'}>
                  {item.tipo}
                </BaseBadge>
              ),
            },
            { header: 'CUIT', cell: item => item.cuit || '-' },
            {
              header: 'Nos debe',
              className: 'text-right',
              cell: item => (item.saldoCliente > 0 ? `$ ${item.saldoCliente.toLocaleString('es-AR')}` : '-'),
            },
            {
              header: 'Le debemos',
              className: 'text-right',
              cell: item => (item.saldoProveedor > 0 ? `$ ${item.saldoProveedor.toLocaleString('es-AR')}` : '-'),
            },
            {
              header: 'Acciones',
              className: 'w-[120px]',
              cell: item => (
                <BaseButton size="sm" variant="outline" onClick={e => { e.stopPropagation(); abrirDialog(item); }}>
                  Editar
                </BaseButton>
              ),
            },
          ]}
        />
      </Section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar tercero' : 'Nuevo tercero'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nombre" required>
                <BaseInput value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
              </Field>

              <Field label="Tipo" required>
                <BaseSelect value={formData.tipo} onValueChange={v => setFormData({ ...formData, tipo: v as TipoTercero })}>
                  <BaseSelectTrigger>
                    <BaseSelectValue />
                  </BaseSelectTrigger>
                  <BaseSelectContent>
                    <BaseSelectItem value="cliente">Cliente</BaseSelectItem>
                    <BaseSelectItem value="proveedor">Proveedor</BaseSelectItem>
                    <BaseSelectItem value="ambos">Ambos</BaseSelectItem>
                  </BaseSelectContent>
                </BaseSelect>
              </Field>

              <Field label="CUIT">
                <BaseInput value={formData.cuit} onChange={e => setFormData({ ...formData, cuit: e.target.value })} />
              </Field>

              <Field label="Telefono">
                <BaseInput value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
              </Field>

              <Field label="Email">
                <BaseInput type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </Field>

              <Field label="Provincia">
                <BaseInput value={formData.provincia} onChange={e => setFormData({ ...formData, provincia: e.target.value })} />
              </Field>

              <Field label="Localidad">
                <BaseInput value={formData.localidad} onChange={e => setFormData({ ...formData, localidad: e.target.value })} />
              </Field>

              <Field label="Direccion">
                <BaseInput value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} />
              </Field>
            </div>

            <div className="flex justify-end gap-2">
              <BaseButton type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </BaseButton>
              <BaseButton type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear tercero'}
              </BaseButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-slate-700">{label}{required ? ' *' : ''}</Label>
      {children}
    </div>
  );
}
