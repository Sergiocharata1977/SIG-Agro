'use client';

import { useMemo, useState } from 'react';
import {
  AbmEntityCard,
  AbmFormLayout,
  BaseBadge,
  BaseButton,
  BaseCard,
  ListGrid,
  ListTable,
  PageHeader,
  PageToolbar,
  Section,
} from '@/components/design-system';
import { BaseInput as Input } from '@/components/design-system';
import { Label } from '@/components/ui/label';

interface ProductorDemo {
  id: string;
  nombre: string;
  provincia: string;
  estado: 'activo' | 'inactivo';
}

const DEMO_DATA: ProductorDemo[] = [
  { id: 'prod-001', nombre: 'Don Juan Agro', provincia: 'Chaco', estado: 'activo' },
  { id: 'prod-002', nombre: 'Establecimiento El Sol', provincia: 'Santa Fe', estado: 'activo' },
  { id: 'prod-003', nombre: 'La Cosecha SRL', provincia: 'Cordoba', estado: 'inactivo' },
];

export default function DesignSystemPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => DEMO_DATA.filter(item => item.nombre.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      <PageHeader
        title="Design System SIG Agro"
        subtitle="Referencia oficial de componentes UI para ABM, paneles y navegacion"
        actions={<BaseButton>Accion principal</BaseButton>}
      />

      <Section title="Toolbar estandar ABM" description="Busqueda, filtros y acciones consistentes.">
        <PageToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar productor..."
          actions={
            <>
              <BaseButton variant="outline">Exportar</BaseButton>
              <BaseButton>Nuevo</BaseButton>
            </>
          }
        />
      </Section>

      <Section title="Estados y primitivos" description="Botones, badges y tarjetas base.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <BaseCard title="Botones">
            <div className="flex flex-wrap gap-2">
              <BaseButton size="sm">Default</BaseButton>
              <BaseButton size="sm" variant="outline">Outline</BaseButton>
              <BaseButton size="sm" variant="destructive">Delete</BaseButton>
            </div>
          </BaseCard>

          <BaseCard title="Badges">
            <div className="flex flex-wrap gap-2">
              <BaseBadge variant="success">activo</BaseBadge>
              <BaseBadge variant="secondary">pendiente</BaseBadge>
              <BaseBadge variant="outline">inactivo</BaseBadge>
            </div>
          </BaseCard>

          <BaseCard title="Regla">
            <p className="text-sm text-slate-600">
              Toda nueva pantalla debe salir de estos componentes y patrones, evitando CSS suelto por modulo.
            </p>
          </BaseCard>
        </div>
      </Section>

      <Section title="Patron tabla ABM" description="Listado de productores con estado y provincia.">
        <ListTable
          data={filtered}
          keyExtractor={item => item.id}
          columns={[
            { header: 'ID', accessorKey: 'id' },
            { header: 'Nombre', accessorKey: 'nombre' },
            { header: 'Provincia', accessorKey: 'provincia' },
            {
              header: 'Estado',
              cell: item => (
                <BaseBadge variant={item.estado === 'activo' ? 'success' : 'outline'}>{item.estado}</BaseBadge>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Patron card ABM" description="Vista en tarjetas para modo grid.">
        <ListGrid
          data={filtered}
          keyExtractor={item => item.id}
          columns={3}
          renderItem={item => (
            <AbmEntityCard title={item.nombre} subtitle={item.provincia} status={item.estado}>
              <p className="text-sm text-slate-600">Codigo: {item.id}</p>
            </AbmEntityCard>
          )}
        />
      </Section>

      <Section title="Patron formulario ABM" description="Formulario base reusable para alta/edicion.">
        <AbmFormLayout title="Alta de productor" description="Este bloque se reutiliza en cada modulo ABM.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre comercial</Label>
              <Input id="nombre" placeholder="Don Juan Agro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia</Label>
              <Input id="provincia" placeholder="Chaco" />
            </div>
          </div>
        </AbmFormLayout>
      </Section>
    </div>
  );
}
