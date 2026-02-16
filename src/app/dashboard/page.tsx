'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Bell, CalendarDays, CheckCircle2, DollarSign, Layers3, MapPinned, Tractor } from 'lucide-react';
import Sidebar, { toggleMobileSidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminEmail } from '@/lib/auth-utils';
import type { Field, Plot, Crop } from '@/types/sig-agro';
import type { Alert } from '@/types/sig-agro-advanced';
import type { OperationRecord } from '@/types/contabilidad-simple';
import { obtenerFields } from '@/services/fields';
import { obtenerPlots } from '@/services/plots';
import { obtenerCrops, getCampaniaActual, obtenerCampaniasDisponibles } from '@/services/crops';
import { obtenerAlertas, obtenerConteoNoLeidas } from '@/services/alerts';
import { listOperationsByOrg } from '@/services/operations-registry';
import { BaseButton } from '@/components/design-system';
import { CULTIVOS_CONFIG } from '@/types/sig-agro';
import { TIPOS_ALERTA_CONFIG, SEVERIDAD_CONFIG } from '@/types/sig-agro-advanced';

const MapaGeneral = dynamic(() => import('@/components/mapa/MapaGeneral'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-slate-500 text-sm">Cargando mapa...</span>
    </div>
  ),
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value || 0);
}

function currentMonthCount(operations: OperationRecord[]) {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();
  return operations.filter((op) => {
    const d = new Date(op.fecha);
    return d.getMonth() === m && d.getFullYear() === y;
  }).length;
}

function calculateFinance(operations: OperationRecord[]) {
  const isVentaDirecta = (op: OperationRecord) => op.type === 'entrega_acopiador' && Boolean((op.metadata as { esVenta?: boolean } | undefined)?.esVenta);
  const costos = operations
    .filter((op) => ['compra_insumo', 'aplicacion_insumo', 'pago'].includes(op.type))
    .reduce((sum, op) => sum + (op.amount || 0), 0);
  const ingresos = operations
    .filter((op) => ['venta', 'cobro'].includes(op.type) || isVentaDirecta(op))
    .reduce((sum, op) => sum + (op.amount || 0), 0);
  return { costos, ingresos, margen: ingresos - costos };
}

function DashboardHeader({
  selectedField,
  fields,
  selectedCampaign,
  campaigns,
  onFieldChange,
  onCampaignChange,
  activeAlerts,
}: {
  selectedField: Field | null;
  fields: Field[];
  selectedCampaign: string;
  campaigns: string[];
  onFieldChange: (id: string) => void;
  onCampaignChange: (campaign: string) => void;
  activeAlerts: number;
}) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 md:px-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button onClick={toggleMobileSidebar} className="w-10 h-10 flex md:hidden items-center justify-center rounded-md hover:bg-slate-100" aria-label="Abrir menu">
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden lg:flex items-center gap-2 text-slate-700 text-sm">
          {activeAlerts > 0 ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{activeAlerts > 0 ? `${activeAlerts} alertas activas` : 'Operacion estable'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 min-w-[180px]"
          value={selectedField?.id || ''}
          onChange={(e) => onFieldChange(e.target.value)}
        >
          <option value="" disabled>Campo activo</option>
          {fields.map((field) => (
            <option key={field.id} value={field.id}>{field.nombre}</option>
          ))}
        </select>

        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 min-w-[150px]"
          value={selectedCampaign}
          onChange={(e) => onCampaignChange(e.target.value)}
        >
          {campaigns.map((campaign) => (
            <option key={campaign} value={campaign}>{campaign}</option>
          ))}
        </select>

        <div className="w-9 h-9 bg-slate-700 rounded-full text-white text-sm font-semibold grid place-items-center" title={user?.email || ''}>
          {(user?.email || 'U').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}

function KpiCard({ icon, label, value, subtitle, tone = 'default' }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  tone?: 'default' | 'success' | 'danger' | 'warning';
}) {
  const toneStyles = {
    default: 'border-slate-200 text-slate-900',
    success: 'border-emerald-200 text-emerald-700',
    danger: 'border-rose-200 text-rose-700',
    warning: 'border-amber-200 text-amber-700',
  } as const;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-semibold ${toneStyles[tone]}`}>{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { firebaseUser, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuperAdmin = user?.role === 'super_admin' || isSuperAdminEmail(firebaseUser?.email);

  const [fields, setFields] = useState<Field[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [operations, setOperations] = useState<OperationRecord[]>([]);
  const [alertCount, setAlertCount] = useState(0);

  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState(getCampaniaActual());
  const [campaigns, setCampaigns] = useState<string[]>([getCampaniaActual()]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!firebaseUser) {
      router.replace('/auth/login');
      return;
    }
    if (isSuperAdmin) {
      router.replace('/super-admin/productores');
    }
  }, [authLoading, firebaseUser, isSuperAdmin, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.organizationId) return;
      try {
        setLoadingData(true);
        const orgId = user.organizationId;

        const [f, p, c, a, cnt, ops, campList] = await Promise.all([
          obtenerFields(orgId, { activo: true }),
          obtenerPlots(orgId, { activo: true }),
          obtenerCrops(orgId),
          obtenerAlertas(orgId, { soloNoResueltas: true, limite: 10 }),
          obtenerConteoNoLeidas(orgId),
          listOperationsByOrg(orgId, 80),
          obtenerCampaniasDisponibles(orgId),
        ]);

        setFields(f);
        setPlots(p);
        setCrops(c);
        setAlerts(a);
        setAlertCount(cnt);
        setOperations(ops);

        const availableCampaigns = campList.length ? campList : [getCampaniaActual()];
        setCampaigns(availableCampaigns);
        setSelectedCampaign((prev) => (availableCampaigns.includes(prev) ? prev : availableCampaigns[0]));

        if (!selectedField && f.length > 0) {
          setSelectedField(f[0]);
        }
      } catch (error) {
        console.error('Error cargando dashboard productor:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (!authLoading && user?.organizationId) {
      void loadData();
    }
  }, [authLoading, user?.organizationId]);

  useEffect(() => {
    const plotId = searchParams.get('plotId');
    if (!plotId) {
      setSelectedPlot(null);
      return;
    }
    const found = plots.find((plot) => plot.id === plotId) || null;
    setSelectedPlot(found);
  }, [plots, searchParams]);

  const plotsByField = useMemo(() => {
    if (!selectedField) return plots;
    return plots.filter((plot) => plot.fieldId === selectedField.id);
  }, [plots, selectedField]);

  const cropsByCampaign = useMemo(() => crops.filter((crop) => crop.campania === selectedCampaign), [crops, selectedCampaign]);

  const hectares = useMemo(() => plotsByField.reduce((sum, plot) => sum + (plot.superficie || 0), 0), [plotsByField]);

  const fieldsCount = fields.length;
  const cultivosCount = cropsByCampaign.length;
  const opsMonth = currentMonthCount(operations);
  const finance = calculateFinance(operations);
  const marginTone = finance.margen >= 0 ? 'success' : 'danger';

  const plotCostRanking = useMemo(() => {
    const map = new Map<string, number>();
    operations
      .filter((op) => ['compra_insumo', 'aplicacion_insumo', 'pago'].includes(op.type) && op.plotId)
      .forEach((op) => {
        const key = op.plotId as string;
        map.set(key, (map.get(key) || 0) + (op.amount || 0));
      });

    return Array.from(map.entries())
      .map(([plotId, amount]) => ({
        plotId,
        amount,
        plotName: plots.find((plot) => plot.id === plotId)?.nombre || plotId,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [operations, plots]);

  const activeCropForSelectedPlot = useMemo(() => {
    if (!selectedPlot) return null;
    return cropsByCampaign.find((crop) => crop.plotId === selectedPlot.id) || null;
  }, [selectedPlot, cropsByCampaign]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-600">Cargando sesion...</div>
      </div>
    );
  }

  if (!firebaseUser || isSuperAdmin) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          selectedField={selectedField}
          fields={fields}
          selectedCampaign={selectedCampaign}
          campaigns={campaigns}
          onFieldChange={(fieldId) => {
            const field = fields.find((f) => f.id === fieldId) || null;
            setSelectedField(field);
            setSelectedPlot(null);
            router.replace('/dashboard');
          }}
          onCampaignChange={setSelectedCampaign}
          activeAlerts={alertCount}
        />

        <div className="flex-1 overflow-auto p-3 md:p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <KpiCard icon={<MapPinned className="w-4 h-4" />} label="Campos activos" value={String(fieldsCount)} />
            <KpiCard icon={<Layers3 className="w-4 h-4" />} label="Hectareas sembradas" value={`${hectares.toLocaleString('es-AR')} ha`} />
            <KpiCard icon={<Tractor className="w-4 h-4" />} label="Actividades del mes" value={String(opsMonth)} />
            <KpiCard icon={<DollarSign className="w-4 h-4" />} label="Costo campana" value={formatCurrency(finance.costos)} tone="warning" />
            <KpiCard icon={<DollarSign className="w-4 h-4" />} label="Ingreso estimado" value={formatCurrency(finance.ingresos)} tone="success" />
            <KpiCard icon={<Bell className="w-4 h-4" />} label="Margen estimado" value={formatCurrency(finance.margen)} tone={marginTone} subtitle={selectedCampaign} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-8 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden h-[460px]">
                {loadingData ? (
                  <div className="h-full bg-slate-100 animate-pulse flex items-center justify-center text-sm text-slate-500">Cargando mapa...</div>
                ) : (
                  <MapaGeneral
                    campos={fields as any}
                    lotes={plotsByField as any}
                    onCampoClick={(field: Field) => setSelectedField(field)}
                    onLoteClick={(plot: Plot) => {
                      setSelectedPlot(plot);
                      router.replace(`/dashboard?plotId=${plot.id}`);
                    }}
                  />
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">Costo por lote</h3>
                  <span className="text-xs text-slate-500">Campana {selectedCampaign}</span>
                </div>
                {plotCostRanking.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin datos de costos por lote.</p>
                ) : (
                  <div className="space-y-2">
                    {plotCostRanking.map((row) => (
                      <div key={row.plotId} className="flex items-center gap-3">
                        <div className="w-40 text-sm text-slate-700 truncate">{row.plotName}</div>
                        <div className="flex-1 h-2 rounded bg-slate-100 overflow-hidden">
                          <div className="h-full bg-slate-700" style={{ width: `${Math.min(100, (row.amount / Math.max(plotCostRanking[0].amount, 1)) * 100)}%` }} />
                        </div>
                        <div className="text-sm font-medium text-slate-800">{formatCurrency(row.amount)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="xl:col-span-4 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Detalle de lote</h3>
                {!selectedPlot ? (
                  <p className="text-sm text-slate-500">Selecciona un lote en el mapa para ver detalle.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Lote</span><span className="font-medium text-slate-900">{selectedPlot.nombre}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Superficie</span><span className="text-slate-900">{selectedPlot.superficie || 0} ha</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Estado</span><span className="text-slate-900">{selectedPlot.estado}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Cultivo</span><span className="text-slate-900">{activeCropForSelectedPlot?.cultivo || 'Sin asignar'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Rendimiento proyectado</span><span className="text-slate-900">{activeCropForSelectedPlot?.rendimientoEstimado ? `${activeCropForSelectedPlot.rendimientoEstimado} kg/ha` : 'Pendiente'}</span></div>
                    <div className="pt-2">
                      <div className="flex flex-wrap gap-2">
                        <BaseButton variant="outline" size="sm" onClick={() => router.push(`/campos/${selectedPlot.fieldId}`)}>Ver ficha del campo</BaseButton>
                        <BaseButton variant="outline" size="sm" onClick={() => router.push(`/operaciones?plotId=${selectedPlot.id}`)}>Actividades</BaseButton>
                        <BaseButton variant="outline" size="sm" onClick={() => router.push(`/rentabilidad?plotId=${selectedPlot.id}`)}>Costos y margen</BaseButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">Actividad reciente</h3>
                  <CalendarDays className="w-4 h-4 text-slate-500" />
                </div>
                {operations.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin actividad registrada.</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {operations.slice(0, 8).map((op) => (
                      <div key={op.id} className="border-l-2 border-slate-300 pl-3 py-1">
                        <p className="text-sm text-slate-900">{op.descripcion}</p>
                        <p className="text-xs text-slate-500">{new Date(op.fecha).toLocaleDateString('es-AR')} · {formatCurrency(op.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Alertas inteligentes</h3>
                {alerts.length === 0 ? (
                  <div className="flex items-center gap-2 text-emerald-700 text-sm"><CheckCircle2 className="w-4 h-4" /> Sin alertas activas</div>
                ) : (
                  <div className="space-y-2">
                    {alerts.slice(0, 5).map((alert) => {
                      const tipo = TIPOS_ALERTA_CONFIG[alert.tipo];
                      const sev = SEVERIDAD_CONFIG[alert.severidad];
                      return (
                        <div key={alert.id} className={`rounded-md border p-2 ${sev.bgColor}`}>
                          <div className="text-sm font-medium text-slate-900">{tipo.icon} {alert.titulo}</div>
                          <div className="text-xs text-slate-600">{alert.descripcion}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Cultivos campana {selectedCampaign}</h3>
                {cropsByCampaign.length === 0 ? (
                  <p className="text-sm text-slate-500">Sin cultivos registrados.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(
                      cropsByCampaign.reduce<Record<string, number>>((acc, crop) => {
                        acc[crop.cultivo] = (acc[crop.cultivo] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([cultivo, count]) => {
                      const cfg = CULTIVOS_CONFIG[cultivo as keyof typeof CULTIVOS_CONFIG] || CULTIVOS_CONFIG.otro;
                      return (
                        <div key={cultivo} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{cfg.icon} {cfg.label}</span>
                          <span className="text-slate-900 font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedPlot && (
          <div className="xl:hidden sticky bottom-0 z-20 bg-white border-t border-slate-200 p-2">
            <div className="text-xs text-slate-500 mb-1 px-1">Lote activo: {selectedPlot.nombre}</div>
            <div className="grid grid-cols-3 gap-2">
              <BaseButton size="sm" variant="outline" onClick={() => router.push(`/operaciones?plotId=${selectedPlot.id}`)}>Actividades</BaseButton>
              <BaseButton size="sm" variant="outline" onClick={() => router.push(`/rentabilidad?plotId=${selectedPlot.id}`)}>Costos</BaseButton>
              <BaseButton size="sm" variant="outline" onClick={() => router.push(`/campos/${selectedPlot.fieldId}`)}>Ficha</BaseButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

