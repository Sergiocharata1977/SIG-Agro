'use client';

import { useMemo } from 'react';
import { BaseCard } from '@/components/design-system';
import { PageShell } from '@/components/layout/PageShell';
import { PluginCard } from '@/components/plugins/PluginCard';
import { usePlugins } from '@/contexts/PluginsContext';
import {
  CATALOGO_PLUGINS,
  type Plugin,
  type PluginCategoria,
} from '@/types/plugins';

const CATEGORY_META: Array<{
  id: PluginCategoria;
  title: string;
  description: string;
}> = [
  {
    id: 'contabilidad',
    title: 'Contabilidad',
    description: 'Mayor, libro diario, reportes y herramientas de cierre.',
  },
  {
    id: 'tesoreria',
    title: 'Tesoreria',
    description: 'Caja, bancos, cheques y flujo de fondos operativo.',
  },
  {
    id: 'comercial',
    title: 'Comercial',
    description: 'Ventas, servicios y operaciones comerciales ampliadas.',
  },
  {
    id: 'agro',
    title: 'Agro',
    description: 'Gestion economica y seguimiento productivo por campana.',
  },
  {
    id: 'control',
    title: 'Control',
    description: 'Presupuesto, auditoria y control interno por organizacion.',
  },
];

export default function ConfiguracionPluginsPage() {
  const { isActive, loading, pluginsActivos } = usePlugins();

  const pluginsPorCategoria = useMemo(
    () =>
      CATEGORY_META.map((category) => ({
        ...category,
        plugins: CATALOGO_PLUGINS.filter((plugin) => plugin.categoria === category.id),
      })).filter((category) => category.plugins.length > 0),
    []
  );

  const totalDisponibles = CATALOGO_PLUGINS.length;
  const totalActivos = pluginsActivos.length;

  if (loading) {
    return (
      <PageShell
        title="Modulos de tu plan"
        subtitle="Revisa que capacidades ya estan incluidas y cuales puedes solicitar para tu organizacion."
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Cargando modulos disponibles...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Modulos de tu plan"
      subtitle="Consulta los modulos activos de tu organizacion y descubre nuevas capacidades disponibles para sumar a tu plan."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <KpiCard
          label="Modulos activos"
          value={totalActivos}
          tone="text-emerald-700"
          detail="Capacidades actualmente habilitadas para tu organizacion."
        />
        <KpiCard
          label="Modulos disponibles"
          value={totalDisponibles}
          tone="text-slate-900"
          detail="Plugins del catalogo que puedes revisar o solicitar."
        />
      </div>

      <div className="space-y-8">
        {pluginsPorCategoria.map((category) => (
          <section key={category.id} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-950">{category.title}</h2>
              <p className="text-sm text-slate-600">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {category.plugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  activo={isActive(plugin.id)}
                  modoAdmin={false}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

function KpiCard({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: number;
  tone: string;
  detail: string;
}) {
  return (
    <BaseCard>
      <div className="space-y-2">
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`text-3xl font-semibold ${tone}`}>{value}</p>
        <p className="text-sm leading-6 text-slate-600">{detail}</p>
      </div>
    </BaseCard>
  );
}
