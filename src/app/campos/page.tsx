'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Campo } from '@/types/agro';
import { eliminarCampo, obtenerCampos } from '@/services/campos';
import { BaseBadge, BaseButton, ListTable, PageToolbar, Section } from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';

export default function CamposPage() {
  const { user, organization, loading: authLoading } = useAuth();
  const [campos, setCampos] = useState<Campo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && user?.organizationId) {
      void loadCampos();
    }
  }, [authLoading, user?.organizationId]);

  async function loadCampos() {
    if (!user?.organizationId) return;
    try {
      setLoading(true);
      const data = await obtenerCampos(user.organizationId);
      setCampos(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user?.organizationId) return;
    if (!confirm('Eliminar este campo?')) return;
    await eliminarCampo(user.organizationId, id);
    setCampos(prev => prev.filter(c => c.id !== id));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return campos;
    return campos.filter(c => `${c.nombre} ${c.departamento} ${c.provincia}`.toLowerCase().includes(q));
  }, [campos, search]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Cargando...</div>;

  if (!organization) {
    return (
      <PageShell title="Campos" subtitle="Sin organizacion activa">
        <Link href="/dashboard"><BaseButton variant="outline">Volver</BaseButton></Link>
      </PageShell>
    );
  }

  return (
    <PageShell title="Campos" subtitle="ABM de establecimientos agricolas">
      <PageToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o ubicacion"
        actions={<Link href="/campos/nuevo"><BaseButton>Nuevo campo</BaseButton></Link>}
      />

      <Section title="Listado">
        <ListTable
          data={filtered}
          keyExtractor={item => item.id}
          emptyState={<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">{loading ? 'Cargando campos...' : 'No hay campos.'}</div>}
          columns={[
            { header: 'Nombre', accessorKey: 'nombre' },
            { header: 'Ubicacion', cell: item => `${item.departamento}, ${item.provincia}` },
            { header: 'Superficie', cell: item => `${item.superficieTotal} ha` },
            { header: 'Estado', cell: item => <BaseBadge variant={item.activo ? 'success' : 'outline'}>{item.activo ? 'Activo' : 'Inactivo'}</BaseBadge> },
            {
              header: 'Acciones',
              className: 'w-[220px]',
              cell: item => (
                <div className="flex gap-2">
                  <Link href={`/campos/${item.id}`}><BaseButton size="sm" variant="outline">Ver</BaseButton></Link>
                  <BaseButton size="sm" variant="destructive" onClick={e => { e.stopPropagation(); void handleDelete(item.id); }}>Eliminar</BaseButton>
                </div>
              ),
            },
          ]}
        />
      </Section>
    </PageShell>
  );
}
