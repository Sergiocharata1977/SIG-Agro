'use client';

import { ComponentType, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Bot,
  Boxes,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FileText,
  FlaskConical,
  Fuel,
  Landmark,
  LayoutDashboard,
  Map,
  MapPin,
  Package,
  Pin,
  Receipt,
  Send,
  Settings,
  Sprout,
  Tractor,
  Truck,
  Warehouse,
  Wheat,
  X,
} from 'lucide-react';
import { AGRO_PLUGINS } from '@/config/plugins';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminEmail } from '@/lib/auth-utils';

let mobileToggleFn: (() => void) | null = null;
let mobileCloseFn: (() => void) | null = null;

export function toggleMobileSidebar() {
  if (mobileToggleFn) mobileToggleFn();
}

export function closeMobileSidebar() {
  if (mobileCloseFn) mobileCloseFn();
}

type MenuNode = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  active: boolean;
  feature?: string;
  module: string;
  disabled?: boolean;
  badge?: string;
};

type MenuGroup = {
  key: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  module: string;
  feature?: string;
  items: MenuNode[];
};

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    firebaseUser,
    user,
    organization,
    organizations,
    organizationId,
    enabledPlugins,
    setActiveOrganization,
    hasModuleAccess,
    canPerformAction,
  } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [operationsHubOpen, setOperationsHubOpen] = useState(false);
  const [grainsHubOpen, setGrainsHubOpen] = useState(false);
  const [financeHubOpen, setFinanceHubOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const contextualPlotId = searchParams.get('plotId');
  const hasActiveOrganization = Boolean(
    organizationId && organizations.some((org) => org.id === organizationId)
  );

  useEffect(() => {
    mobileToggleFn = () => setMobileOpen((prev) => !prev);
    mobileCloseFn = () => setMobileOpen(false);
    return () => {
      mobileToggleFn = null;
      mobileCloseFn = null;
    };
  }, []);

  useEffect(() => {
    setMegaMenuOpen(false);
    setOperationsHubOpen(false);
    setGrainsHubOpen(false);
    setFinanceHubOpen(false);
  }, [pathname]);

  const pluginSlugs = useMemo(
    () => new Set(AGRO_PLUGINS.map((plugin) => plugin.identity.slug)),
    []
  );

  const visibleRoutes = useMemo(
    () =>
      AGRO_PLUGINS
        .filter((plugin) => enabledPlugins.includes(plugin.identity.slug))
        .flatMap((plugin) => plugin.routes.navigation),
    [enabledPlugins]
  );

  const allPluginRoutePaths = useMemo(
    () => new Set(AGRO_PLUGINS.flatMap((plugin) => plugin.routes.navigation.map((route) => route.path))),
    []
  );

  const enabledPluginSlugs = useMemo(
    () => new Set(enabledPlugins),
    [enabledPlugins]
  );

  const enabledPluginRoutePaths = useMemo(
    () => new Set(visibleRoutes.map((route) => route.path)),
    [visibleRoutes]
  );

  const isPluginEnabled = (module: string, feature?: string, href?: string) => {
    const pluginSlug = feature && pluginSlugs.has(feature)
      ? feature
      : pluginSlugs.has(module)
        ? module
        : null;

    if (pluginSlug) {
      return enabledPluginSlugs.has(pluginSlug);
    }

    if (!href) {
      return true;
    }

    if (allPluginRoutePaths.has(href)) {
      return enabledPluginRoutePaths.has(href);
    }

    return true;
  };

  const groups = useMemo<MenuGroup[]>(() => {
    const ops: MenuGroup[] = [
      {
        key: 'panel',
        title: 'Panel General',
        icon: LayoutDashboard,
        active: pathname === '/dashboard' || pathname === '/metricas',
        module: 'dashboard',
        items: [
          {
            icon: LayoutDashboard,
            label: 'Panel General',
            href: '/dashboard',
            active: pathname === '/dashboard',
            module: 'dashboard',
          },
          {
            icon: BarChart3,
            label: 'Indicadores',
            href: '/metricas',
            active: pathname === '/metricas',
            module: 'metricas',
          },
        ],
      },
      {
        key: 'gis',
        title: 'Campos y GIS',
        icon: Map,
        active:
          pathname === '/dashboard' ||
          pathname?.startsWith('/campos') ||
          pathname?.startsWith('/lotes') ||
          false,
        module: 'mapa_gis',
        feature: 'mapa_gis',
        items: [
          { icon: Map, label: 'Mapa GIS', href: '/dashboard', active: pathname === '/dashboard', module: 'mapa_gis', feature: 'mapa_gis' },
          { icon: Pin, label: 'Campos', href: '/campos', active: pathname?.startsWith('/campos') || false, module: 'campos', feature: 'mapa_gis' },
          { icon: MapPin, label: 'Lotes', href: '/lotes', active: pathname?.startsWith('/lotes') || false, module: 'campos', feature: 'mapa_gis' },
          { icon: Bot, label: 'Mapas satelitales', href: '/analisis-ia', active: pathname?.startsWith('/analisis-ia') || false, module: 'analisis_ia' },
          { icon: ChartNoAxesCombined, label: 'Ambientes productivos', module: 'mapa_gis', active: false, disabled: true, badge: 'proximamente' },
        ],
      },
      {
        key: 'campanias',
        title: 'Campanias y Cultivos',
        icon: Sprout,
        active: pathname?.startsWith('/campanias') || false,
        module: 'campanias',
        feature: 'campanias',
        items: [
          { icon: CalendarDays, label: 'Campanias', href: '/campanias', active: pathname?.startsWith('/campanias') || false, module: 'campanias', feature: 'campanias' },
          { icon: Sprout, label: 'Cultivos y cuaderno', href: '/cuaderno', active: pathname?.startsWith('/cuaderno') || false, module: 'campanias', feature: 'campanias' },
          { icon: BarChart3, label: 'Rendimientos', href: '/rentabilidad', active: pathname?.startsWith('/rentabilidad') || false, module: 'contabilidad' },
        ],
      },
      {
        key: 'insumos-stock',
        title: 'Insumos y Stock',
        icon: Package,
        active: pathname?.startsWith('/operaciones') || false,
        module: 'contabilidad',
        items: [
          { icon: Package, label: 'Insumos', href: '/operaciones', active: pathname?.startsWith('/operaciones') || false, module: 'contabilidad' },
          { icon: Warehouse, label: 'Depositos', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: Receipt, label: 'Compras de insumos', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: Boxes, label: 'Stock y movimientos', href: '/operaciones', active: false, module: 'contabilidad' },
        ],
      },
      {
        key: 'operaciones-agro',
        title: 'Operaciones Agricolas',
        icon: Tractor,
        active: pathname?.startsWith('/operaciones') || false,
        module: 'contabilidad',
        items: [
          { icon: Sprout, label: 'Siembra', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: Droplets, label: 'Fertilizacion', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: FlaskConical, label: 'Aplicaciones', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: Fuel, label: 'Combustible', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: Tractor, label: 'Mano de obra', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: Wheat, label: 'Cosecha', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: Truck, label: 'Entrega a acopiador', href: '/operaciones', active: false, module: 'contabilidad' },
        ],
      },
      {
        key: 'granos-silos',
        title: 'Granos y Silos',
        icon: Warehouse,
        active: pathname?.startsWith('/operaciones') || false,
        module: 'contabilidad',
        items: [
          { icon: Warehouse, label: 'Silos', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: Boxes, label: 'Stock de granos', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: Truck, label: 'Entregas', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: FileText, label: 'Cartas de porte', href: '/operaciones', active: false, module: 'contabilidad' },
        ],
      },
      {
        key: 'finanzas',
        title: 'Finanzas',
        icon: Landmark,
        active:
          pathname?.startsWith('/contabilidad') ||
          pathname?.startsWith('/terceros') ||
          pathname?.startsWith('/operaciones') ||
          pathname?.startsWith('/rentabilidad') ||
          false,
        module: 'contabilidad',
        feature: 'contabilidad',
        items: [
          { icon: Receipt, label: 'Ventas', href: '/operaciones', active: false, module: 'contabilidad', feature: 'contabilidad' },
          { icon: Receipt, label: 'Cobranzas', href: '/operaciones', active: false, module: 'contabilidad', feature: 'contabilidad' },
          { icon: Receipt, label: 'Pagos', href: '/operaciones', active: false, module: 'contabilidad', feature: 'contabilidad' },
          { icon: Landmark, label: 'Libro diario', href: '/contabilidad', active: pathname?.startsWith('/contabilidad') || false, module: 'contabilidad', feature: 'contabilidad' },
          { icon: ChartNoAxesCombined, label: 'Balance y rentabilidad', href: '/rentabilidad', active: pathname?.startsWith('/rentabilidad') || false, module: 'contabilidad', feature: 'contabilidad' },
          { icon: Building2, label: 'Terceros', href: '/terceros', active: pathname?.startsWith('/terceros') || false, module: 'contabilidad', feature: 'contabilidad' },
        ],
      },
    ];

    const control: MenuGroup[] = [
      {
        key: 'reportes',
        title: 'Reportes',
        icon: BarChart3,
        active: pathname?.startsWith('/metricas') || pathname?.startsWith('/rentabilidad') || false,
        module: 'metricas',
        items: [
          { icon: ChartNoAxesCombined, label: 'Rentabilidad por lote', href: '/rentabilidad', active: pathname?.startsWith('/rentabilidad') || false, module: 'contabilidad' },
          { icon: BarChart3, label: 'Panel de metricas', href: '/metricas', active: pathname?.startsWith('/metricas') || false, module: 'metricas' },
          { icon: Map, label: 'Reportes GIS', href: '/dashboard', active: false, module: 'mapa_gis' },
        ],
      },
      {
        key: 'docs',
        title: 'Documentacion',
        icon: BookOpen,
        active: pathname?.startsWith('/documentos') || false,
        module: 'documentos',
        items: [
          { icon: FileText, label: 'Documentos ISO', href: '/documentos', active: pathname?.startsWith('/documentos') || false, module: 'documentos' },
          { icon: BookOpen, label: 'Auditoria', href: '/documentos', active: false, module: 'documentos' },
        ],
      },
      {
        key: 'config',
        title: 'Configuracion',
        icon: Settings,
        active:
          pathname?.startsWith('/organizaciones') ||
          pathname?.startsWith('/configuracion') ||
          false,
        module: 'admin',
        items: [
          { icon: Settings, label: 'Parametros', href: '/organizaciones', active: pathname?.startsWith('/organizaciones') || false, module: 'admin' },
          { icon: Send, label: 'WhatsApp', href: '/configuracion/whatsapp', active: pathname?.startsWith('/configuracion/whatsapp') || false, module: 'admin' },
          { icon: Boxes, label: 'Plugins', href: '/configuracion/plugins', active: pathname?.startsWith('/configuracion/plugins') || false, module: 'admin' },
          { icon: Package, label: 'Tipos de insumos', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: MapPin, label: 'Parametros GIS', href: '/dashboard', active: false, module: 'mapa_gis' },
        ],
      },
    ];

    return [...ops, ...control];
  }, [pathname]);

  useEffect(() => {
    const defaults: Record<string, boolean> = {};
    for (const g of groups) {
      defaults[g.key] = hasActiveOrganization ? g.active : g.key === 'organizacion';
    }
    setExpandedGroups((prev) => ({ ...defaults, ...prev }));
  }, [groups, hasActiveOrganization]);

  const isSuperAdmin = user?.role === 'super_admin' || isSuperAdminEmail(firebaseUser?.email);
  if (isSuperAdmin) return null;

  const filteredGroups = groups
    .filter(() => hasActiveOrganization)
    .filter((group) => {
      if (group.module === 'admin') {
        if (group.key === 'organizacion') return true;
        return canPerformAction('admin');
      }
      return hasModuleAccess(group.module);
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.module === 'admin') {
          if (item.href === '/organizaciones') return true;
          return canPerformAction('admin');
        }
        return hasModuleAccess(item.module);
      }),
    }))
    .filter((group) => group.items.length > 0 && group.key !== 'organizacion');

  if (hasActiveOrganization && pathname === '/dashboard' && contextualPlotId) {
    filteredGroups.unshift({
      key: 'contexto-lote',
      title: `Campo contextual`,
      icon: MapPin,
      active: true,
      module: 'campos',
      items: [
        {
          icon: MapPin,
          label: `Lote ${contextualPlotId.slice(0, 8)}`,
          href: `/dashboard?plotId=${contextualPlotId}`,
          active: true,
          module: 'campos',
        },
        {
          icon: Tractor,
          label: 'Actividades del lote',
          href: `/operaciones?plotId=${contextualPlotId}`,
          active: false,
          module: 'contabilidad',
        },
        {
          icon: ChartNoAxesCombined,
          label: 'Costos y margen del lote',
          href: `/rentabilidad?plotId=${contextualPlotId}`,
          active: false,
          module: 'contabilidad',
        },
        {
          icon: BookOpen,
          label: 'Historial del lote',
          href: `/cuaderno?plotId=${contextualPlotId}`,
          active: false,
          module: 'campanias',
        },
      ],
    });
  }

  const opKeys = new Set([
    'contexto-lote',
    'insumos-stock',
  ]);

  const megaMenuKeys = new Set(['panel', 'gis', 'campanias']);
  const popupMenuKeys = new Set(['operaciones-agro', 'granos-silos', 'finanzas']);
  const megaMenuGroups = filteredGroups.filter((g) => megaMenuKeys.has(g.key));
  const operationsHubGroup = filteredGroups.find((g) => g.key === 'operaciones-agro');
  const OperationsHubIcon = operationsHubGroup?.icon ?? Tractor;
  const grainsHubGroup = filteredGroups.find((g) => g.key === 'granos-silos');
  const GrainsHubIcon = grainsHubGroup?.icon ?? Warehouse;
  const financeHubGroup = filteredGroups.find((g) => g.key === 'finanzas');
  const FinanceHubIcon = financeHubGroup?.icon ?? Landmark;
  const operationalGroups = filteredGroups.filter((g) => opKeys.has(g.key));
  const controlGroups = filteredGroups.filter((g) => !opKeys.has(g.key) && !megaMenuKeys.has(g.key) && !popupMenuKeys.has(g.key));

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-slate-950/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed md:relative z-[200] h-screen bg-emerald-950 text-emerald-50 flex flex-col transition-all duration-300 border-r border-emerald-900 ${collapsed ? 'md:w-20' : 'md:w-80'} w-80 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-emerald-900 relative">
          <div className="flex items-center gap-3">
            <Image src="/logo-sig-agro.png" alt="SIG Agro" width={40} height={40} className="rounded-lg" />
            {!collapsed && (
              <div>
                <div className="font-semibold text-emerald-50">Don Candido IA</div>
                <div className="text-xs text-emerald-300/70">SIG Agro</div>
              </div>
            )}
          </div>

          <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-emerald-300 hover:text-emerald-50 md:hidden" aria-label="Cerrar menu">
            <X className="w-4 h-4" />
          </button>

          <button onClick={() => setCollapsed((prev) => !prev)} className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3 w-7 h-7 bg-emerald-900 rounded-full items-center justify-center text-emerald-200 hover:text-emerald-50 border border-emerald-700 z-10" aria-label={collapsed ? 'Expandir' : 'Colapsar'}>
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-3 bg-emerald-900/30 space-y-2">
            <div className="text-[11px] uppercase tracking-[0.16em] text-emerald-300/70">Organizacion activa</div>

            <div className="rounded-xl bg-emerald-900/60 p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-sky-700 text-white grid place-items-center text-xs font-bold">{(organization?.name || 'O').charAt(0).toUpperCase()}</div>
                <div className="text-sm font-medium text-emerald-50 truncate">{organization?.name || 'Sin organizacion'}</div>
              </div>

              {organizations.length > 1 && (
                <select
                  value={organizationId || ''}
                  onChange={(e) => void setActiveOrganization(e.target.value)}
                  className="w-full text-sm rounded-lg bg-emerald-950/70 text-emerald-50 px-2.5 py-2 outline-none focus:ring-2 focus:ring-emerald-500/40 border border-emerald-800"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              )}

              {organizations.length <= 1 && (
                <div className="text-xs text-emerald-200/70 px-1">
                  {organizations.length === 0 ? 'Todavia no tenes organizaciones creadas.' : 'Tenes 1 organizacion vinculada.'}
                </div>
              )}

              <Link
                href="/organizaciones"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center w-full rounded-lg bg-emerald-600/30 px-2.5 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-600/40"
              >
                ABM Organizaciones
              </Link>
            </div>
          </div>
        )}

        {hasActiveOrganization && megaMenuGroups.length > 0 && (
          <div className="relative px-3 pt-3">
            {!collapsed ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMegaMenuOpen((prev) => !prev)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    megaMenuOpen || megaMenuGroups.some((group) => group.active)
                      ? 'border-emerald-500/70 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-lg shadow-emerald-950/20'
                      : 'border-emerald-800 bg-emerald-900/45 text-emerald-50 hover:border-emerald-700 hover:bg-emerald-900/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                      <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">Explorar sistema</div>
                      <div className="mt-0.5 text-xs text-emerald-100/75">
                        Inicio, campos y campanias en un solo panel
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${megaMenuOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {megaMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[220] hidden md:block" onClick={() => setMegaMenuOpen(false)} />
                    <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-[230] md:left-[calc(100%+16px)] md:right-auto md:top-0 md:w-[780px]">
                      <div className="overflow-hidden rounded-[28px] border border-emerald-700/60 bg-[linear-gradient(160deg,rgba(1,53,39,0.98),rgba(4,79,57,0.96))] shadow-[0_28px_80px_rgba(2,12,9,0.45)] backdrop-blur-xl">
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Mega menu</p>
                            <h3 className="mt-1 text-2xl font-semibold text-white">Exploracion central</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/75">
                              Accesos principales para tablero, territorio operativo y seguimiento productivo.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMegaMenuOpen(false)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-50 transition hover:bg-white/10"
                            aria-label="Cerrar panel de exploracion"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid gap-4 p-5 md:grid-cols-3">
                          {megaMenuGroups.map((group) => {
                            const GroupIcon = group.icon;
                            return (
                              <section
                                key={group.key}
                                className={`rounded-[24px] border p-4 ${
                                  group.active
                                    ? 'border-emerald-400/60 bg-white/10'
                                    : 'border-white/10 bg-white/[0.04]'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/15">
                                    <GroupIcon className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-base font-semibold text-white">{group.title}</h4>
                                    <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                                      {describeGroup(group.key)}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                  {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const cls = `flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                                      item.active
                                        ? 'border-emerald-300/40 bg-emerald-300/12 text-white'
                                        : 'border-white/8 bg-black/10 text-emerald-50/88 hover:border-emerald-300/25 hover:bg-white/8'
                                    }`;

                                    if (item.disabled || !item.href) {
                                      return (
                                        <div key={`${group.key}-${item.label}`} className={`${cls} cursor-not-allowed opacity-70`}>
                                          <Icon className="h-4 w-4" />
                                          <span className="flex-1">{item.label}</span>
                                          {item.badge && <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/75">{item.badge}</span>}
                                        </div>
                                      );
                                    }

                                    return (
                                      <Link
                                        key={`${group.key}-${item.href}-${item.label}`}
                                        href={item.href}
                                        onClick={() => {
                                          setMegaMenuOpen(false);
                                          setMobileOpen(false);
                                        }}
                                        className={cls}
                                      >
                                        <Icon className="h-4 w-4" />
                                        <span className="flex-1">{item.label}</span>
                                        {item.badge && <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/75">{item.badge}</span>}
                                      </Link>
                                    );
                                  })}
                                </div>
                              </section>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex w-full items-center justify-center rounded-md border border-transparent px-3 py-2.5 text-emerald-100/80 transition hover:border-emerald-800 hover:bg-emerald-900/50 hover:text-emerald-50"
                aria-label="Expandir exploracion"
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {hasActiveOrganization && operationsHubGroup && (
          <div className="relative px-3 pt-3">
            {!collapsed ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOperationsHubOpen((prev) => !prev)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    operationsHubOpen || operationsHubGroup.active
                      ? 'border-emerald-500/70 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-lg shadow-emerald-950/20'
                      : 'border-emerald-800 bg-emerald-900/45 text-emerald-50 hover:border-emerald-700 hover:bg-emerald-900/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                      <Tractor className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{operationsHubGroup.title}</div>
                      <div className="mt-0.5 text-xs text-emerald-100/75">
                        Labores, ejecucion y trazabilidad en un solo panel
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${operationsHubOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {operationsHubOpen && (
                  <>
                    <div className="fixed inset-0 z-[220] hidden md:block" onClick={() => setOperationsHubOpen(false)} />
                    <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-[230] md:left-[calc(100%+16px)] md:right-auto md:top-0 md:w-[860px]">
                      <div className="overflow-hidden rounded-[28px] border border-emerald-700/60 bg-[linear-gradient(160deg,rgba(1,53,39,0.98),rgba(4,79,57,0.96))] shadow-[0_28px_80px_rgba(2,12,9,0.45)] backdrop-blur-xl">
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Modulo operativo</p>
                            <h3 className="mt-1 text-2xl font-semibold text-white">Operaciones agricolas</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/75">
                              Registro de labores, control de ejecucion y seguimiento operativo del frente agricola.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOperationsHubOpen(false)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-50 transition hover:bg-white/10"
                            aria-label="Cerrar panel de operaciones"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid gap-5 p-5 md:grid-cols-[1.15fr_0.85fr]">
                          <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                            <div className="mb-4 flex items-start gap-3">
                              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/15">
                                <OperationsHubIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-base font-semibold text-white">Frentes de trabajo</h4>
                                <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                                  Accesos directos a siembra, aplicaciones, cosecha y entregas.
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              {operationsHubGroup.items.map((item) => {
                                const Icon = item.icon;
                                const cls = `flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                                  item.active
                                    ? 'border-emerald-300/40 bg-emerald-300/12 text-white'
                                    : 'border-white/8 bg-black/10 text-emerald-50/88 hover:border-emerald-300/25 hover:bg-white/8'
                                }`;

                                if (item.disabled || !item.href) {
                                  return (
                                    <div key={`${operationsHubGroup.key}-${item.label}`} className={`${cls} cursor-not-allowed opacity-70`}>
                                      <Icon className="h-4 w-4" />
                                      <span className="flex-1">{item.label}</span>
                                      {item.badge && <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/75">{item.badge}</span>}
                                    </div>
                                  );
                                }

                                return (
                                  <Link
                                    key={`${operationsHubGroup.key}-${item.href}-${item.label}`}
                                    href={item.href}
                                    onClick={() => {
                                      setOperationsHubOpen(false);
                                      setMobileOpen(false);
                                    }}
                                    className={cls}
                                  >
                                    <Icon className="h-4 w-4" />
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/75">{item.badge}</span>}
                                  </Link>
                                );
                              })}
                            </div>
                          </section>

                          <aside className="rounded-[24px] border border-emerald-400/20 bg-white/[0.06] p-4">
                            <div className="mb-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">Indicadores</p>
                              <h4 className="mt-1 text-lg font-semibold text-white">Pulso del modulo</h4>
                              <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                                Resumen ejecutivo del frente operativo para priorizar la agenda diaria.
                              </p>
                            </div>

                            <div className="space-y-3">
                              {getOperationsIndicators().map((indicator) => (
                                <div key={indicator.label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                  <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/75">{indicator.label}</div>
                                  <div className="mt-2 text-3xl font-semibold text-white">{indicator.value}</div>
                                  <div className="mt-1 text-sm text-emerald-100/75">{indicator.detail}</div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50/85">
                              Ventana sugerida: priorizar labores de alto impacto operativo y consolidar entregas pendientes antes del cierre del dia.
                            </div>
                          </aside>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex w-full items-center justify-center rounded-md border border-transparent px-3 py-2.5 text-emerald-100/80 transition hover:border-emerald-800 hover:bg-emerald-900/50 hover:text-emerald-50"
                aria-label="Expandir operaciones agricolas"
              >
                <Tractor className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {hasActiveOrganization && grainsHubGroup && (
          <div className="relative px-3 pt-3">
            {!collapsed ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setGrainsHubOpen((prev) => !prev)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    grainsHubOpen || grainsHubGroup.active
                      ? 'border-emerald-500/70 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-lg shadow-emerald-950/20'
                      : 'border-emerald-800 bg-emerald-900/45 text-emerald-50 hover:border-emerald-700 hover:bg-emerald-900/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                      <Warehouse className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{grainsHubGroup.title}</div>
                      <div className="mt-0.5 text-xs text-emerald-100/75">
                        Silos, stock, entregas y cartas en un solo panel
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${grainsHubOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {grainsHubOpen && (
                  <>
                    <div className="fixed inset-0 z-[220] hidden md:block" onClick={() => setGrainsHubOpen(false)} />
                    <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-[230] md:left-[calc(100%+16px)] md:right-auto md:top-0 md:w-[860px]">
                      <div className="overflow-hidden rounded-[28px] border border-emerald-700/60 bg-[linear-gradient(160deg,rgba(1,53,39,0.98),rgba(4,79,57,0.96))] shadow-[0_28px_80px_rgba(2,12,9,0.45)] backdrop-blur-xl">
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Modulo logistico</p>
                            <h3 className="mt-1 text-2xl font-semibold text-white">Granos y silos</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/75">
                              Control de acopio, movimientos de grano y documentacion de salida.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setGrainsHubOpen(false)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-50 transition hover:bg-white/10"
                            aria-label="Cerrar panel de granos y silos"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid gap-5 p-5 md:grid-cols-[1.15fr_0.85fr]">
                          <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                            <div className="mb-4 flex items-start gap-3">
                              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/15">
                                <GrainsHubIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-base font-semibold text-white">Frente de granos</h4>
                                <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                                  Accesos directos a silos, stock, entregas y cartas de porte.
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              {grainsHubGroup.items.map((item) => {
                                const Icon = item.icon;
                                const cls = `flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                                  item.active
                                    ? 'border-emerald-300/40 bg-emerald-300/12 text-white'
                                    : 'border-white/8 bg-black/10 text-emerald-50/88 hover:border-emerald-300/25 hover:bg-white/8'
                                }`;

                                if (item.disabled || !item.href) {
                                  return (
                                    <div key={`${grainsHubGroup.key}-${item.label}`} className={`${cls} cursor-not-allowed opacity-70`}>
                                      <Icon className="h-4 w-4" />
                                      <span className="flex-1">{item.label}</span>
                                      {item.badge && <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/75">{item.badge}</span>}
                                    </div>
                                  );
                                }

                                return (
                                  <Link
                                    key={`${grainsHubGroup.key}-${item.href}-${item.label}`}
                                    href={item.href}
                                    onClick={() => {
                                      setGrainsHubOpen(false);
                                      setMobileOpen(false);
                                    }}
                                    className={cls}
                                  >
                                    <Icon className="h-4 w-4" />
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/75">{item.badge}</span>}
                                  </Link>
                                );
                              })}
                            </div>
                          </section>

                          <aside className="rounded-[24px] border border-emerald-400/20 bg-white/[0.06] p-4">
                            <div className="mb-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">Indicadores</p>
                              <h4 className="mt-1 text-lg font-semibold text-white">Pulso del modulo</h4>
                              <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                                Lectura rapida del frente logístico y del flujo de granos.
                              </p>
                            </div>

                            <div className="space-y-3">
                              {getGrainsIndicators().map((indicator) => (
                                <div key={indicator.label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                  <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/75">{indicator.label}</div>
                                  <div className="mt-2 text-3xl font-semibold text-white">{indicator.value}</div>
                                  <div className="mt-1 text-sm text-emerald-100/75">{indicator.detail}</div>
                                </div>
                              ))}
                            </div>
                          </aside>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex w-full items-center justify-center rounded-md border border-transparent px-3 py-2.5 text-emerald-100/80 transition hover:border-emerald-800 hover:bg-emerald-900/50 hover:text-emerald-50"
                aria-label="Expandir granos y silos"
              >
                <Warehouse className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {hasActiveOrganization && financeHubGroup && (
          <div className="relative px-3 pt-3">
            {!collapsed ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFinanceHubOpen((prev) => !prev)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    financeHubOpen || financeHubGroup.active
                      ? 'border-emerald-500/70 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-lg shadow-emerald-950/20'
                      : 'border-emerald-800 bg-emerald-900/45 text-emerald-50 hover:border-emerald-700 hover:bg-emerald-900/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{financeHubGroup.title}</div>
                      <div className="mt-0.5 text-xs text-emerald-100/75">
                        Ventas, cobranzas, pagos y control financiero unificado
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${financeHubOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {financeHubOpen && (
                  <>
                    <div className="fixed inset-0 z-[220] hidden md:block" onClick={() => setFinanceHubOpen(false)} />
                    <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-[230] md:left-[calc(100%+16px)] md:right-auto md:top-0 md:w-[860px]">
                      <div className="overflow-hidden rounded-[28px] border border-emerald-700/60 bg-[linear-gradient(160deg,rgba(1,53,39,0.98),rgba(4,79,57,0.96))] shadow-[0_28px_80px_rgba(2,12,9,0.45)] backdrop-blur-xl">
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">Modulo financiero</p>
                            <h3 className="mt-1 text-2xl font-semibold text-white">Finanzas</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/75">
                              Flujo comercial, libro diario, rentabilidad y relacion con terceros en un mismo panel.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFinanceHubOpen(false)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-50 transition hover:bg-white/10"
                            aria-label="Cerrar panel de finanzas"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid gap-5 p-5 md:grid-cols-[1.15fr_0.85fr]">
                          <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                            <div className="mb-4 flex items-start gap-3">
                              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/15">
                                <FinanceHubIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-base font-semibold text-white">Control financiero</h4>
                                <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                                  Accesos a cobranzas, pagos, libro diario, rentabilidad y terceros.
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              {financeHubGroup.items.map((item) => {
                                const Icon = item.icon;
                                const cls = `flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                                  item.active
                                    ? 'border-emerald-300/40 bg-emerald-300/12 text-white'
                                    : 'border-white/8 bg-black/10 text-emerald-50/88 hover:border-emerald-300/25 hover:bg-white/8'
                                }`;

                                if (item.disabled || !item.href) {
                                  return (
                                    <div key={`${financeHubGroup.key}-${item.label}`} className={`${cls} cursor-not-allowed opacity-70`}>
                                      <Icon className="h-4 w-4" />
                                      <span className="flex-1">{item.label}</span>
                                      {item.badge && <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/75">{item.badge}</span>}
                                    </div>
                                  );
                                }

                                return (
                                  <Link
                                    key={`${financeHubGroup.key}-${item.href}-${item.label}`}
                                    href={item.href}
                                    onClick={() => {
                                      setFinanceHubOpen(false);
                                      setMobileOpen(false);
                                    }}
                                    className={cls}
                                  >
                                    <Icon className="h-4 w-4" />
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/75">{item.badge}</span>}
                                  </Link>
                                );
                              })}
                            </div>
                          </section>

                          <aside className="rounded-[24px] border border-emerald-400/20 bg-white/[0.06] p-4">
                            <div className="mb-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">Indicadores</p>
                              <h4 className="mt-1 text-lg font-semibold text-white">Pulso del modulo</h4>
                              <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                                Resumen financiero para seguir liquidez, margen y relacion con terceros.
                              </p>
                            </div>

                            <div className="space-y-3">
                              {getFinanceIndicators().map((indicator) => (
                                <div key={indicator.label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                  <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/75">{indicator.label}</div>
                                  <div className="mt-2 text-3xl font-semibold text-white">{indicator.value}</div>
                                  <div className="mt-1 text-sm text-emerald-100/75">{indicator.detail}</div>
                                </div>
                              ))}
                            </div>
                          </aside>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex w-full items-center justify-center rounded-md border border-transparent px-3 py-2.5 text-emerald-100/80 transition hover:border-emerald-800 hover:bg-emerald-900/50 hover:text-emerald-50"
                aria-label="Expandir finanzas"
              >
                <Landmark className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          {!hasActiveOrganization && !collapsed && (
            <div className="rounded-xl bg-emerald-900/40 p-3 text-xs text-emerald-100/80 border border-emerald-800">
              Crea o selecciona una organizacion para habilitar campos, lotes y operaciones.
            </div>
          )}
          {hasActiveOrganization && (
            <>
              <div className="space-y-1.5">
                {!collapsed && <p className="px-2 text-[10px] uppercase tracking-[0.18em] text-emerald-300/70">Operacion</p>}
                {operationalGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const open = !!expandedGroups[group.key];
                  return (
                    <div key={group.key} className="space-y-1">
                      <button
                        onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border transition ${group.active ? 'bg-emerald-800/70 border-emerald-600 text-emerald-100' : 'border-transparent text-emerald-100/80 hover:bg-emerald-900/50 hover:border-emerald-800 hover:text-emerald-50'}`}
                      >
                        <GroupIcon className="w-4 h-4" />
                        {!collapsed && (
                          <>
                            <span className="text-sm font-medium flex-1 text-left">{group.title}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </button>

                      {open && !collapsed && (
                        <div className="ml-4 pl-3 border-l border-emerald-800 space-y-1">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const cls = `flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition ${item.active ? 'bg-emerald-800/70 border-emerald-600 text-emerald-100' : 'border-transparent text-emerald-100/80 hover:bg-emerald-900/50 hover:border-emerald-800 hover:text-emerald-50'}`;
                            if (item.disabled || !item.href) {
                              return (
                                <div key={`${group.key}-${item.label}`} className={`${cls} opacity-70 cursor-not-allowed`}>
                                  <Icon className="w-3.5 h-3.5" />
                                  <span className="flex-1">{item.label}</span>
                                  {item.badge && <span className="text-[10px] uppercase tracking-wide text-emerald-300/70">{item.badge}</span>}
                                </div>
                              );
                            }
                            return (
                              <Link key={`${group.key}-${item.href}-${item.label}`} href={item.href} onClick={() => setMobileOpen(false)} className={cls}>
                                <Icon className="w-3.5 h-3.5" />
                                <span className="flex-1">{item.label}</span>
                                {item.badge && <span className="text-[10px] uppercase tracking-wide text-emerald-300/70">{item.badge}</span>}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                {!collapsed && <p className="px-2 text-[10px] uppercase tracking-[0.18em] text-emerald-300/70">Control</p>}
                {controlGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const open = !!expandedGroups[group.key];
                  return (
                    <div key={group.key} className="space-y-1">
                      <button
                        onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border transition ${group.active ? 'bg-emerald-800/70 border-emerald-600 text-emerald-100' : 'border-transparent text-emerald-100/80 hover:bg-emerald-900/50 hover:border-emerald-800 hover:text-emerald-50'}`}
                      >
                        <GroupIcon className="w-4 h-4" />
                        {!collapsed && (
                          <>
                            <span className="text-sm font-medium flex-1 text-left">{group.title}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </button>

                      {open && !collapsed && (
                        <div className="ml-4 pl-3 border-l border-emerald-800 space-y-1">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const cls = `flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition ${item.active ? 'bg-emerald-800/70 border-emerald-600 text-emerald-100' : 'border-transparent text-emerald-100/80 hover:bg-emerald-900/50 hover:border-emerald-800 hover:text-emerald-50'}`;
                            if (item.disabled || !item.href) {
                              return (
                                <div key={`${group.key}-${item.label}`} className={`${cls} opacity-70 cursor-not-allowed`}>
                                  <Icon className="w-3.5 h-3.5" />
                                  <span className="flex-1">{item.label}</span>
                                  {item.badge && <span className="text-[10px] uppercase tracking-wide text-emerald-300/70">{item.badge}</span>}
                                </div>
                              );
                            }
                            return (
                              <Link key={`${group.key}-${item.href}-${item.label}`} href={item.href} onClick={() => setMobileOpen(false)} className={cls}>
                                <Icon className="w-3.5 h-3.5" />
                                <span className="flex-1">{item.label}</span>
                                {item.badge && <span className="text-[10px] uppercase tracking-wide text-emerald-300/70">{item.badge}</span>}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}

function describeGroup(groupKey: string) {
  switch (groupKey) {
    case 'panel':
      return 'Lectura ejecutiva del establecimiento, indicadores y foco inmediato.';
    case 'gis':
      return 'Territorio, cartografia, lotes y capas satelitales operativas.';
    case 'campanias':
      return 'Planificacion productiva, cuaderno y seguimiento de rendimientos.';
    default:
      return 'Accesos principales del sistema.';
  }
}

function getOperationsIndicators() {
  return [
    {
      label: 'Frentes activos',
      value: '07',
      detail: 'Siembra, aplicaciones y cosecha en seguimiento.',
    },
    {
      label: 'Ventanas criticas',
      value: '03',
      detail: 'Labores con prioridad alta durante las proximas 24 h.',
    },
    {
      label: 'Entregas por cerrar',
      value: '12',
      detail: 'Registros pendientes de consolidacion operativa.',
    },
  ];
}

function getGrainsIndicators() {
  return [
    {
      label: 'Silos operativos',
      value: '04',
      detail: 'Capacidad activa para recepcion y despacho de granos.',
    },
    {
      label: 'Stock consolidado',
      value: '820 t',
      detail: 'Volumen disponible entre silo bolsa y almacenamiento fijo.',
    },
    {
      label: 'Entregas abiertas',
      value: '06',
      detail: 'Remitos y salidas en seguimiento logistico.',
    },
  ];
}

function getFinanceIndicators() {
  return [
    {
      label: 'Cobros proyectados',
      value: '$ 14.2M',
      detail: 'Ingresos previstos para la proxima ventana operativa.',
    },
    {
      label: 'Pagos en agenda',
      value: '09',
      detail: 'Compromisos por ejecutar con proveedores y servicios.',
    },
    {
      label: 'Margen bajo control',
      value: '18.4%',
      detail: 'Balance preliminar del modulo financiero activo.',
    },
  ];
}
