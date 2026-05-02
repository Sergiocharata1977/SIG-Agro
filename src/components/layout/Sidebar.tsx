'use client';

import { type CSSProperties, ComponentType, useEffect, useMemo, useState } from 'react';
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
  Palette,
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

type ModuleIndicator = {
  label: string;
  value: string;
  detail: string;
};

type DashboardTheme = 'green' | 'blue' | 'black';

const DASHBOARD_THEME_STORAGE_KEY = 'sigagro-dashboard-theme';

const DASHBOARD_THEME_OPTIONS: Array<{
  value: DashboardTheme;
  label: string;
  accent: string;
}> = [
  { value: 'green', label: 'Verde', accent: '#0d7a52' },
  { value: 'blue', label: 'Azul', accent: '#2563eb' },
  { value: 'black', label: 'Negro', accent: '#111827' },
];

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
  const [suppliesHubOpen, setSuppliesHubOpen] = useState(false);
  const [operationsHubOpen, setOperationsHubOpen] = useState(false);
  const [grainsHubOpen, setGrainsHubOpen] = useState(false);
  const [financeHubOpen, setFinanceHubOpen] = useState(false);
  const [controlHubOpen, setControlHubOpen] = useState(false);
  const [theme, setTheme] = useState<DashboardTheme>('green');
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
    setSuppliesHubOpen(false);
    setOperationsHubOpen(false);
    setGrainsHubOpen(false);
    setFinanceHubOpen(false);
    setControlHubOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedTheme = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY) as DashboardTheme | null;
    if (storedTheme === 'green' || storedTheme === 'blue' || storedTheme === 'black') {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    document.documentElement.dataset.dashboardTheme = theme;
    window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, theme);
  }, [theme]);

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
  ]);

  const megaMenuKeys = new Set(['panel', 'gis', 'campanias']);
  const popupMenuKeys = new Set(['insumos-stock', 'operaciones-agro', 'granos-silos', 'finanzas']);
  const megaMenuGroups = filteredGroups.filter((g) => megaMenuKeys.has(g.key));
  const suppliesHubGroup = filteredGroups.find((g) => g.key === 'insumos-stock');
  const SuppliesHubIcon = suppliesHubGroup?.icon ?? Package;
  const operationsHubGroup = filteredGroups.find((g) => g.key === 'operaciones-agro');
  const OperationsHubIcon = operationsHubGroup?.icon ?? Tractor;
  const grainsHubGroup = filteredGroups.find((g) => g.key === 'granos-silos');
  const GrainsHubIcon = grainsHubGroup?.icon ?? Warehouse;
  const financeHubGroup = filteredGroups.find((g) => g.key === 'finanzas');
  const FinanceHubIcon = financeHubGroup?.icon ?? Landmark;
  const operationalGroups = filteredGroups.filter((g) => opKeys.has(g.key));
  const controlGroups = filteredGroups.filter((g) => !opKeys.has(g.key) && !megaMenuKeys.has(g.key) && !popupMenuKeys.has(g.key));
  const controlHubGroup = controlGroups.length
    ? {
        key: 'control-hub',
        title: 'Configuraciones e informes',
        icon: Settings,
        active: controlGroups.some((group) => group.active),
        module: 'admin',
        items: controlGroups.flatMap((group) =>
          group.items.map((item) => ({
            ...item,
            badge: group.title,
          }))
        ),
      }
    : null;

  const renderHubPanel = ({
    open,
    onClose,
    widthClass,
    group,
    HubIcon,
    eyebrow,
    title,
    description,
    summaryTitle,
    summaryDescription,
    indicators,
  }: {
    open: boolean;
    onClose: () => void;
    widthClass: string;
    group: MenuGroup;
    HubIcon: ComponentType<{ className?: string }>;
    eyebrow: string;
    title: string;
    description: string;
    summaryTitle: string;
    summaryDescription: string;
    indicators: ModuleIndicator[];
  }) => {
    if (!open) return null;

    const accent = getHubAccentClasses(group.key);

    return (
      <>
        <div className="fixed inset-0 z-[540] hidden backdrop-blur-[3px] md:block" style={{ background: 'var(--dashboard-overlay)' }} onClick={onClose} />
        <div className={`absolute left-0 right-0 top-[calc(100%+12px)] z-[550] md:fixed md:left-[calc(20rem+16px)] md:right-auto md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto ${widthClass}`}>
          <div className="overflow-hidden rounded-[32px] shadow-[0_32px_96px_rgba(10,21,16,0.16)]" style={{ border: '1px solid var(--dashboard-sidebar-border)', background: 'var(--dashboard-popup-bg)' }}>
            <div className={`flex items-start justify-between gap-4 bg-gradient-to-br ${accent.header} px-7 py-6`} style={{ color: 'var(--dashboard-accent-contrast)' }}>
              <div className="max-w-3xl">
                <div className="flex items-center gap-3" style={{ color: 'color-mix(in srgb, var(--dashboard-accent-contrast) 82%, transparent)' }}>
                  <div className={`grid h-10 w-10 place-items-center rounded-2xl ${accent.headerChip}`}>
                    <HubIcon className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em]">{eyebrow}</p>
                </div>
                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">{title}</h3>
                <p className="mt-3 max-w-3xl text-base leading-8" style={{ color: 'color-mix(in srgb, var(--dashboard-accent-contrast) 76%, transparent)' }}>{description}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition hover:bg-white/60"
                style={{ borderColor: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.12)' }}
                aria-label={`Cerrar panel de ${title.toLowerCase()}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-[minmax(0,1.35fr)_320px]">
              <section className="px-6 py-6 md:px-7" style={{ background: 'var(--dashboard-popup-bg)' }}>
                <div className="mb-5">
                  <h4 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">{summaryTitle}</h4>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{summaryDescription}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const cardContent = (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className={`grid h-12 w-12 place-items-center rounded-2xl ${accent.cardChip}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <ChevronRight className="mt-1 h-5 w-5 text-slate-400" />
                        </div>
                        <div className="mt-6">
                          <h5 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-950">{item.label}</h5>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {describeModuleItem(group.key, item.label)}
                          </p>
                        </div>
                        {item.badge && (
                          <div className="mt-5 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                            {item.badge}
                          </div>
                        )}
                      </>
                    );

                    const cls = `group rounded-[26px] border p-5 transition ${
                      item.active
                        ? 'border-slate-900 bg-white shadow-[0_18px_34px_rgba(15,23,42,0.08)]'
                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]'
                    }`;

                    if (item.disabled || !item.href) {
                      return (
                        <div key={`${group.key}-${item.label}`} className={`${cls} cursor-not-allowed opacity-75`}>
                          {cardContent}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={`${group.key}-${item.href}-${item.label}`}
                        href={item.href}
                        onClick={() => {
                          onClose();
                          setMobileOpen(false);
                        }}
                        className={cls}
                      >
                        {cardContent}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--dashboard-accent)' }} />
                    <span>Sistema en linea</span>
                  </div>
                  <div className="text-slate-500">{getHubFooterCopy(group.key)}</div>
                </div>
              </section>

              <aside className={`border-l border-slate-200 px-6 py-6 md:px-7 ${accent.rail}`}>
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Indicadores clave</p>
                  <h4 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-950">Pulso del modulo</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Estado ejecutivo para ver el modulo antes de ejecutar acciones.
                  </p>
                </div>

                <div className="space-y-4">
                  {indicators.map((indicator, index) => (
                    <div key={indicator.label} className="rounded-[24px] border border-slate-200 bg-white/88 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{indicator.label}</div>
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <div className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">{indicator.value}</div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${accent.metricTag}`}>
                          {getIndicatorBadge(group.key, index)}
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className={`h-full rounded-full ${accent.progress}`} style={{ width: getIndicatorProgress(group.key, index) }} />
                      </div>
                      <div className="mt-3 text-sm leading-6 text-slate-600">{indicator.detail}</div>
                    </div>
                  ))}
                </div>

                <div className={`mt-5 rounded-[24px] border-l-4 bg-white/86 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.05)] ${accent.callout}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Lectura recomendada</div>
                  <div className="mt-3 text-base leading-8 text-slate-700">
                    {getHubInsightCopy(group.key)}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 md:hidden" style={{ background: 'var(--dashboard-overlay)' }} onClick={() => setMobileOpen(false)} />}

      <aside
        className={`fixed md:relative z-[360] flex h-screen flex-col transition-all duration-300 ${collapsed ? 'md:w-20' : 'md:w-80'} w-80 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          background: 'var(--dashboard-sidebar-bg)',
          color: 'var(--dashboard-sidebar-text)',
          borderRight: '1px solid var(--dashboard-sidebar-border)',
          boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.4)',
        }}
      >
        <div className="relative border-b p-4" style={{ borderColor: 'var(--dashboard-sidebar-border)' }}>
          <div className="flex items-center gap-3">
            <Image src="/logo-sig-agro.png" alt="Don Juan GIS" width={40} height={40} className="rounded-lg" />
            {!collapsed && (
              <div>
                <div className="font-semibold" style={{ color: 'var(--dashboard-text)' }}>Don Juan GIS</div>
                <div className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--dashboard-muted)' }}>Suite operativa</div>
              </div>
            )}
          </div>

          <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center md:hidden" style={{ color: 'var(--dashboard-muted)' }} aria-label="Cerrar menu">
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="absolute -right-3 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border md:flex"
            style={{
              background: 'var(--dashboard-sidebar-panel)',
              color: 'var(--dashboard-sidebar-text)',
              borderColor: 'var(--dashboard-sidebar-border)',
              boxShadow: '0 8px 20px rgba(15,23,42,0.12)',
            }}
            aria-label={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="space-y-2 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--dashboard-muted)' }}>Organizacion activa</div>

            <div className="space-y-2 rounded-[24px] p-3 shadow-[0_16px_36px_rgba(15,23,42,0.07)]" style={{ background: 'var(--dashboard-sidebar-panel)', border: '1px solid var(--dashboard-sidebar-border)' }}>
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl text-xs font-bold" style={{ background: 'var(--dashboard-accent-soft)', color: 'var(--dashboard-accent-strong)' }}>{(organization?.name || 'O').charAt(0).toUpperCase()}</div>
                <div className="truncate text-sm font-medium" style={{ color: 'var(--dashboard-text)' }}>{organization?.name || 'Sin organizacion'}</div>
              </div>

              {organizations.length > 1 && (
                <select
                  value={organizationId || ''}
                  onChange={(e) => void setActiveOrganization(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{
                    background: 'white',
                    color: 'var(--dashboard-text)',
                    border: '1px solid var(--dashboard-sidebar-border)',
                  }}
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              )}

              {organizations.length <= 1 && (
                <div className="px-1 text-xs" style={{ color: 'var(--dashboard-muted)' }}>
                  {organizations.length === 0 ? 'Todavia no tenes organizaciones creadas.' : 'Tenes 1 organizacion vinculada.'}
                </div>
              )}

              <Link
                href="/organizaciones"
                onClick={() => setMobileOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition"
                style={{ background: 'var(--dashboard-accent-soft)', color: 'var(--dashboard-accent-strong)' }}
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
                  className={`w-full rounded-[24px] border px-4 py-3 text-left transition ${
                    megaMenuOpen || megaMenuGroups.some((group) => group.active)
                      ? 'shadow-lg'
                      : 'hover:-translate-y-0.5'
                  }`}
                  style={{
                    borderColor: megaMenuOpen || megaMenuGroups.some((group) => group.active) ? 'var(--dashboard-accent)' : 'var(--dashboard-sidebar-border)',
                    background: megaMenuOpen || megaMenuGroups.some((group) => group.active)
                      ? 'linear-gradient(135deg, var(--dashboard-accent-strong), var(--dashboard-accent))'
                      : 'var(--dashboard-sidebar-panel)',
                    color: megaMenuOpen || megaMenuGroups.some((group) => group.active)
                      ? 'var(--dashboard-accent-contrast)'
                      : 'var(--dashboard-sidebar-text)',
                    boxShadow: megaMenuOpen || megaMenuGroups.some((group) => group.active)
                      ? '0 18px 32px rgba(15,23,42,0.16)'
                      : '0 10px 24px rgba(15,23,42,0.05)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: megaMenuOpen || megaMenuGroups.some((group) => group.active) ? 'rgba(255,255,255,0.14)' : 'var(--dashboard-accent-soft)', color: megaMenuOpen || megaMenuGroups.some((group) => group.active) ? 'white' : 'var(--dashboard-accent-strong)' }}>
                      <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">Explorar sistema</div>
                      <div className="mt-0.5 text-xs" style={{ color: megaMenuOpen || megaMenuGroups.some((group) => group.active) ? 'rgba(255,255,255,0.76)' : 'var(--dashboard-muted)' }}>
                        Inicio, campos y campanias en un solo panel
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${megaMenuOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {megaMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[540] hidden md:block" onClick={() => setMegaMenuOpen(false)} />
                    <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-[550] md:fixed md:left-[calc(20rem+16px)] md:right-auto md:top-24 md:max-h-[calc(100vh-7rem)] md:w-[780px] md:overflow-y-auto">
                      <div className="overflow-hidden rounded-[28px] shadow-[0_28px_80px_rgba(2,12,9,0.16)] backdrop-blur-xl" style={{ border: '1px solid var(--dashboard-sidebar-border)', background: 'linear-gradient(180deg, var(--dashboard-sidebar-panel), var(--dashboard-popup-bg))' }}>
                        <div className="flex items-start justify-between gap-4 border-b px-6 py-5" style={{ borderColor: 'var(--dashboard-sidebar-border)' }}>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--dashboard-accent)' }}>Mega menu</p>
                            <h3 className="mt-1 text-2xl font-semibold" style={{ color: 'var(--dashboard-text)' }}>Exploracion central</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--dashboard-muted)' }}>
                              Accesos principales para tablero, territorio operativo y seguimiento productivo.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMegaMenuOpen(false)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition hover:bg-slate-50"
                            style={{ borderColor: 'var(--dashboard-sidebar-border)', color: 'var(--dashboard-sidebar-text)' }}
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
                                    ? 'shadow-[0_14px_30px_rgba(15,23,42,0.08)]'
                                    : ''
                                }`}
                                style={{
                                  borderColor: group.active ? 'var(--dashboard-accent)' : 'var(--dashboard-sidebar-border)',
                                  background: 'var(--dashboard-sidebar-panel)',
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: 'var(--dashboard-accent-soft)', color: 'var(--dashboard-accent-strong)' }}>
                                    <GroupIcon className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-base font-semibold" style={{ color: 'var(--dashboard-text)' }}>{group.title}</h4>
                                    <p className="mt-1 text-xs leading-5" style={{ color: 'var(--dashboard-muted)' }}>
                                      {describeGroup(group.key)}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                  {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const cls = `flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                                      item.active
                                        ? 'shadow-sm'
                                        : 'hover:-translate-y-0.5'
                                    }`;

                                    if (item.disabled || !item.href) {
                                      return (
                                        <div
                                          key={`${group.key}-${item.label}`}
                                          className={`${cls} cursor-not-allowed opacity-70`}
                                          style={{
                                            borderColor: 'var(--dashboard-sidebar-border)',
                                            background: 'white',
                                            color: 'var(--dashboard-sidebar-text)',
                                          }}
                                        >
                                          <Icon className="h-4 w-4" />
                                          <span className="flex-1">{item.label}</span>
                                          {item.badge && <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--dashboard-muted)' }}>{item.badge}</span>}
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
                                        style={{
                                          borderColor: item.active ? 'var(--dashboard-accent)' : 'var(--dashboard-sidebar-border)',
                                          background: item.active ? 'var(--dashboard-accent-soft)' : 'white',
                                          color: 'var(--dashboard-sidebar-text)',
                                        }}
                                      >
                                        <Icon className="h-4 w-4" />
                                        <span className="flex-1">{item.label}</span>
                                        {item.badge && <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--dashboard-muted)' }}>{item.badge}</span>}
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
                className="flex w-full items-center justify-center rounded-2xl border px-3 py-2.5 transition"
                style={{ borderColor: 'var(--dashboard-sidebar-border)', color: 'var(--dashboard-sidebar-text)', background: 'var(--dashboard-sidebar-panel)' }}
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
                  className={`w-full rounded-[24px] border px-4 py-3 text-left transition ${operationsHubOpen || operationsHubGroup.active ? 'shadow-lg' : 'hover:-translate-y-0.5'}`}
                  style={getHubButtonStyle(operationsHubOpen || operationsHubGroup.active)}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl" style={getHubChipStyle(operationsHubOpen || operationsHubGroup.active)}>
                      <Tractor className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{operationsHubGroup.title}</div>
                      <div className="mt-0.5 text-xs" style={{ color: operationsHubOpen || operationsHubGroup.active ? 'rgba(255,255,255,0.76)' : 'var(--dashboard-muted)' }}>
                        Labores, ejecucion y trazabilidad en un solo panel
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${operationsHubOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {operationsHubOpen &&
                  renderHubPanel({
                    open: operationsHubOpen,
                    onClose: () => setOperationsHubOpen(false),
                    widthClass: 'md:w-[980px]',
                    group: operationsHubGroup,
                    HubIcon: OperationsHubIcon,
                    eyebrow: 'Modulo operativo',
                    title: 'Operaciones agricolas',
                    description: 'Registro de labores, control de ejecucion y seguimiento operativo del frente agricola.',
                    summaryTitle: 'Resumen de operaciones',
                    summaryDescription: 'Accesos directos a siembra, aplicaciones, cosecha, mano de obra y entregas con trazabilidad operativa.',
                    indicators: getOperationsIndicators(),
                  })}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex w-full items-center justify-center rounded-2xl border px-3 py-2.5 transition"
                style={{ borderColor: 'var(--dashboard-sidebar-border)', color: 'var(--dashboard-sidebar-text)', background: 'var(--dashboard-sidebar-panel)' }}
                aria-label="Expandir operaciones agricolas"
              >
                <Tractor className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {hasActiveOrganization && suppliesHubGroup && (
          <div className="relative px-3 pt-3">
            {!collapsed ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSuppliesHubOpen((prev) => !prev)}
                  className={`w-full rounded-[24px] border px-4 py-3 text-left transition ${suppliesHubOpen || suppliesHubGroup.active ? 'shadow-lg' : 'hover:-translate-y-0.5'}`}
                  style={getHubButtonStyle(suppliesHubOpen || suppliesHubGroup.active)}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl" style={getHubChipStyle(suppliesHubOpen || suppliesHubGroup.active)}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{suppliesHubGroup.title}</div>
                      <div className="mt-0.5 text-xs" style={{ color: suppliesHubOpen || suppliesHubGroup.active ? 'rgba(255,255,255,0.76)' : 'var(--dashboard-muted)' }}>
                        Insumos, depositos, compras y stock en un solo panel
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${suppliesHubOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {suppliesHubOpen &&
                  renderHubPanel({
                    open: suppliesHubOpen,
                    onClose: () => setSuppliesHubOpen(false),
                    widthClass: 'md:w-[980px]',
                    group: suppliesHubGroup,
                    HubIcon: SuppliesHubIcon,
                    eyebrow: 'Modulo de abastecimiento',
                    title: 'Insumos y stock',
                    description: 'Gestion de abastecimiento, almacenamiento, compras y movimientos de stock del establecimiento.',
                    summaryTitle: 'Control de abastecimiento',
                    summaryDescription: 'Vista integrada de inventario, depositos, compras y movimientos para sostener el ritmo operativo.',
                    indicators: getSuppliesIndicators(),
                  })}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex w-full items-center justify-center rounded-2xl border px-3 py-2.5 transition"
                style={{ borderColor: 'var(--dashboard-sidebar-border)', color: 'var(--dashboard-sidebar-text)', background: 'var(--dashboard-sidebar-panel)' }}
                aria-label="Expandir insumos y stock"
              >
                <Package className="h-4 w-4" />
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
                  className={`w-full rounded-[24px] border px-4 py-3 text-left transition ${grainsHubOpen || grainsHubGroup.active ? 'shadow-lg' : 'hover:-translate-y-0.5'}`}
                  style={getHubButtonStyle(grainsHubOpen || grainsHubGroup.active)}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl" style={getHubChipStyle(grainsHubOpen || grainsHubGroup.active)}>
                      <Warehouse className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{grainsHubGroup.title}</div>
                      <div className="mt-0.5 text-xs" style={{ color: grainsHubOpen || grainsHubGroup.active ? 'rgba(255,255,255,0.76)' : 'var(--dashboard-muted)' }}>
                        Silos, stock, entregas y cartas en un solo panel
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${grainsHubOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {grainsHubOpen &&
                  renderHubPanel({
                    open: grainsHubOpen,
                    onClose: () => setGrainsHubOpen(false),
                    widthClass: 'md:w-[980px]',
                    group: grainsHubGroup,
                    HubIcon: GrainsHubIcon,
                    eyebrow: 'Modulo logistico',
                    title: 'Granos y silos',
                    description: 'Control de acopio, movimientos de grano y documentacion de salida.',
                    summaryTitle: 'Frente logistico',
                    summaryDescription: 'Silos, stock, entregas y cartas de porte reunidos en una sola vista operativa para despachos y conservacion.',
                    indicators: getGrainsIndicators(),
                  })}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex w-full items-center justify-center rounded-2xl border px-3 py-2.5 transition"
                style={{ borderColor: 'var(--dashboard-sidebar-border)', color: 'var(--dashboard-sidebar-text)', background: 'var(--dashboard-sidebar-panel)' }}
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
                  className={`w-full rounded-[24px] border px-4 py-3 text-left transition ${financeHubOpen || financeHubGroup.active ? 'shadow-lg' : 'hover:-translate-y-0.5'}`}
                  style={getHubButtonStyle(financeHubOpen || financeHubGroup.active)}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl" style={getHubChipStyle(financeHubOpen || financeHubGroup.active)}>
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{financeHubGroup.title}</div>
                      <div className="mt-0.5 text-xs" style={{ color: financeHubOpen || financeHubGroup.active ? 'rgba(255,255,255,0.76)' : 'var(--dashboard-muted)' }}>
                        Ventas, cobranzas, pagos y control financiero unificado
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-transform ${financeHubOpen ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {financeHubOpen &&
                  renderHubPanel({
                    open: financeHubOpen,
                    onClose: () => setFinanceHubOpen(false),
                    widthClass: 'md:w-[1040px]',
                    group: financeHubGroup,
                    HubIcon: FinanceHubIcon,
                    eyebrow: 'Modulo financiero',
                    title: 'Finanzas',
                    description: 'Flujo comercial, libro diario, rentabilidad y relacion con terceros en un mismo panel.',
                    summaryTitle: 'Control financiero',
                    summaryDescription: 'Ventas, cobranzas, pagos, libro diario, balance y terceros agrupados para lectura ejecutiva y accion inmediata.',
                    indicators: getFinanceIndicators(),
                  })}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex w-full items-center justify-center rounded-2xl border px-3 py-2.5 transition"
                style={{ borderColor: 'var(--dashboard-sidebar-border)', color: 'var(--dashboard-sidebar-text)', background: 'var(--dashboard-sidebar-panel)' }}
                aria-label="Expandir finanzas"
              >
                <Landmark className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {!hasActiveOrganization && !collapsed && (
            <div className="rounded-[20px] border p-3 text-xs" style={{ background: 'var(--dashboard-sidebar-panel)', borderColor: 'var(--dashboard-sidebar-border)', color: 'var(--dashboard-muted)' }}>
              Crea o selecciona una organizacion para habilitar campos, lotes y operaciones.
            </div>
          )}
          {hasActiveOrganization && (
            <>
              <div className="space-y-1.5">
                {!collapsed && <p className="px-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--dashboard-muted)' }}>Operacion</p>}
                {operationalGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const open = !!expandedGroups[group.key];
                  return (
                    <div key={group.key} className="space-y-1">
                      <button
                        onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                        className="flex w-full items-center gap-3 rounded-[18px] border px-3 py-3 transition hover:-translate-y-0.5"
                        style={{
                          background: group.active ? 'var(--dashboard-accent-soft)' : 'transparent',
                          borderColor: group.active ? 'var(--dashboard-accent)' : 'transparent',
                          color: group.active ? 'var(--dashboard-accent-strong)' : 'var(--dashboard-sidebar-text)',
                        }}
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
                        <div className="ml-4 space-y-1 border-l pl-3" style={{ borderColor: 'var(--dashboard-sidebar-border)' }}>
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const cls = 'flex items-center gap-2 rounded-[16px] border px-3 py-2 text-sm transition hover:-translate-y-0.5';
                            if (item.disabled || !item.href) {
                              return (
                                <div key={`${group.key}-${item.label}`} className={`${cls} opacity-70 cursor-not-allowed`} style={{ borderColor: 'transparent', color: 'var(--dashboard-muted)' }}>
                                  <Icon className="w-3.5 h-3.5" />
                                  <span className="flex-1">{item.label}</span>
                                  {item.badge && <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--dashboard-muted)' }}>{item.badge}</span>}
                                </div>
                              );
                            }
                            return (
                              <Link
                                key={`${group.key}-${item.href}-${item.label}`}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cls}
                                style={{
                                  background: item.active ? 'white' : 'transparent',
                                  borderColor: item.active ? 'var(--dashboard-sidebar-border)' : 'transparent',
                                  color: item.active ? 'var(--dashboard-accent-strong)' : 'var(--dashboard-sidebar-text)',
                                }}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="flex-1">{item.label}</span>
                                {item.badge && <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--dashboard-muted)' }}>{item.badge}</span>}
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
                {!collapsed && <p className="px-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--dashboard-muted)' }}>Control</p>}
                {controlHubGroup && (
                  <div className="relative space-y-1">
                    {!collapsed ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setControlHubOpen((prev) => !prev)}
                          className={`w-full rounded-[24px] border px-4 py-3 text-left transition ${controlHubOpen || controlHubGroup.active ? 'shadow-lg' : 'hover:-translate-y-0.5'}`}
                          style={getHubButtonStyle(controlHubOpen || controlHubGroup.active)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl" style={getHubChipStyle(controlHubOpen || controlHubGroup.active)}>
                              <Settings className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold">{controlHubGroup.title}</div>
                              <div className="mt-0.5 text-xs" style={{ color: controlHubOpen || controlHubGroup.active ? 'rgba(255,255,255,0.76)' : 'var(--dashboard-muted)' }}>
                                Reportes, documentacion y configuracion dentro de un mismo popup
                              </div>
                            </div>
                            <ChevronRight className={`h-5 w-5 transition-transform ${controlHubOpen ? 'rotate-90' : ''}`} />
                          </div>
                        </button>

                        {controlHubOpen &&
                          renderHubPanel({
                            open: controlHubOpen,
                            onClose: () => setControlHubOpen(false),
                            widthClass: 'md:w-[1040px]',
                            group: controlHubGroup,
                            HubIcon: Settings,
                            eyebrow: 'Centro de control',
                            title: 'Configuraciones e informes',
                            description: 'Unifica reportes, documentacion ISO y ajustes operativos en una sola vista de acceso rapido.',
                            summaryTitle: 'Gestion centralizada',
                            summaryDescription: 'Todos los accesos de reportes, documentacion y configuracion quedaron reunidos en un unico popup, sin desplegables intermedios.',
                            indicators: getControlIndicators(),
                          })}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCollapsed(false)}
                        className="flex w-full items-center justify-center rounded-2xl border px-3 py-2.5 transition"
                        style={{ borderColor: 'var(--dashboard-sidebar-border)', color: 'var(--dashboard-sidebar-text)', background: 'var(--dashboard-sidebar-panel)' }}
                        aria-label="Expandir configuraciones e informes"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        {!collapsed && (
          <div className="border-t px-4 py-4" style={{ borderColor: 'var(--dashboard-sidebar-border)' }}>
            <div className="rounded-[24px] p-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)]" style={{ background: 'var(--dashboard-sidebar-panel)', border: '1px solid var(--dashboard-sidebar-border)' }}>
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-2xl" style={{ background: 'var(--dashboard-accent-soft)', color: 'var(--dashboard-accent-strong)' }}>
                  <Palette className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--dashboard-text)' }}>Temas Don Juan GIS</div>
                  <div className="text-xs" style={{ color: 'var(--dashboard-muted)' }}>Verde, azul y negro</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DASHBOARD_THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className="rounded-2xl border px-2 py-2 text-xs font-semibold transition hover:-translate-y-0.5"
                    style={{
                      borderColor: theme === option.value ? option.accent : 'var(--dashboard-sidebar-border)',
                      background: theme === option.value ? option.accent : 'white',
                      color: theme === option.value ? '#ffffff' : 'var(--dashboard-sidebar-text)',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
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

function getControlIndicators() {
  return [
    {
      label: 'Reportes',
      value: '03',
      detail: 'Accesos ejecutivos y analiticos consolidados en un solo panel.',
    },
    {
      label: 'Documentos ISO',
      value: '02',
      detail: 'Documentacion y auditoria disponibles sin cambiar de menu.',
    },
    {
      label: 'Configuraciones',
      value: '05',
      detail: 'Parametros, WhatsApp, plugins y ajustes operativos centralizados.',
    },
  ];
}

function getHubButtonStyle(active: boolean) {
  return {
    borderColor: active ? 'var(--dashboard-accent)' : 'var(--dashboard-sidebar-border)',
    background: active
      ? 'linear-gradient(135deg, var(--dashboard-accent-strong), var(--dashboard-accent))'
      : 'var(--dashboard-sidebar-panel)',
    color: active ? 'var(--dashboard-accent-contrast)' : 'var(--dashboard-sidebar-text)',
    boxShadow: active
      ? '0 18px 32px rgba(15,23,42,0.16)'
      : '0 10px 24px rgba(15,23,42,0.05)',
  } satisfies CSSProperties;
}

function getHubChipStyle(active: boolean) {
  return {
    background: active ? 'rgba(255,255,255,0.14)' : 'var(--dashboard-accent-soft)',
    color: active ? '#ffffff' : 'var(--dashboard-accent-strong)',
  } satisfies CSSProperties;
}

function getHubAccentClasses(groupKey: string) {
  switch (groupKey) {
    case 'granos-silos':
      return {
        header: 'from-[#082f24] via-[#0e4a33] to-[#173e33]',
        headerChip: 'bg-lime-300/14 text-lime-100 ring-1 ring-lime-200/20',
        cardChip: 'bg-lime-100 text-lime-800',
        rail: 'bg-[#eef2e7]',
        metricTag: 'bg-lime-100 text-lime-800',
        progress: 'bg-lime-700',
        callout: 'border-lime-700',
      };
    case 'finanzas':
      return {
        header: 'from-[#0a3b2c] via-[#0c4631] to-[#16493a]',
        headerChip: 'bg-emerald-200/14 text-emerald-50 ring-1 ring-emerald-100/20',
        cardChip: 'bg-emerald-50 text-emerald-800',
        rail: 'bg-[#f1f3ed]',
        metricTag: 'bg-emerald-100 text-emerald-800',
        progress: 'bg-emerald-700',
        callout: 'border-emerald-800',
      };
    case 'insumos-stock':
      return {
        header: 'from-[#0b3d30] via-[#11513c] to-[#1d5d46]',
        headerChip: 'bg-teal-200/14 text-teal-50 ring-1 ring-teal-100/20',
        cardChip: 'bg-teal-50 text-teal-800',
        rail: 'bg-[#eef4ef]',
        metricTag: 'bg-teal-100 text-teal-800',
        progress: 'bg-teal-700',
        callout: 'border-teal-800',
      };
    default:
      return {
        header: 'from-[#0a3529] via-[#104633] to-[#1c5740]',
        headerChip: 'bg-emerald-200/14 text-emerald-50 ring-1 ring-emerald-100/20',
        cardChip: 'bg-emerald-50 text-emerald-800',
        rail: 'bg-[#eef4ee]',
        metricTag: 'bg-emerald-100 text-emerald-800',
        progress: 'bg-emerald-700',
        callout: 'border-emerald-800',
      };
  }
}

function describeModuleItem(groupKey: string, itemLabel: string) {
  const descriptions: Record<string, Record<string, string>> = {
    'operaciones-agro': {
      'Siembra': 'Gestion de implantacion, densidades y arranque operativo por lote.',
      'Fertilizacion': 'Control de aplicaciones de nutrientes, dosis y ventanas de uso.',
      'Aplicaciones': 'Fitosanitarios, recetas y ordenes de pulverizacion con seguimiento.',
      'Combustible': 'Despachos, consumo y control por unidad o frente operativo.',
      'Mano de obra': 'Partes diarios, cuadrillas y asignacion de tareas de campo.',
      'Cosecha': 'Rendimiento, logistica de tolvas y cierre de jornada productiva.',
      'Entrega a acopiador': 'Despachos, cartas y trazabilidad de salida hacia destino.',
    },
    'insumos-stock': {
      'Insumos': 'Catalogo operativo de semillas, fitosanitarios y consumibles criticos.',
      'Depositos': 'Ubicaciones, disponibilidad y control fisico del inventario activo.',
      'Compras de insumos': 'Ordenes, proveedores y recepcion pendiente de imputacion.',
      'Stock y movimientos': 'Entradas, salidas y trazabilidad completa del inventario.',
    },
    'granos-silos': {
      'Silos': 'Gestion de almacenamiento, conservacion y disponibilidad por unidad.',
      'Stock de granos': 'Inventario consolidado por calidad, variedad y ubicacion.',
      'Entregas': 'Despachos y recepciones logisticas en seguimiento operativo.',
      'Cartas de porte': 'Emision y control documental para transporte y salida oficial.',
    },
    finanzas: {
      'Ventas': 'Facturacion, notas de credito y seguimiento de pedidos comerciales.',
      'Cobranzas': 'Control de ingresos, cuentas a cobrar y recupero programado.',
      'Pagos': 'Proveedores, vencimientos y agenda financiera de corto plazo.',
      'Libro diario': 'Registro cronologico, asientos y exportacion contable operativa.',
      'Balance y rentabilidad': 'Margen, costos directos e informes ejecutivos del negocio.',
      'Terceros': 'Maestro de clientes, proveedores, socios y contratistas vinculados.',
    },
    'control-hub': {
      'Rentabilidad por lote': 'Lectura rapida del margen por lote para seguimiento economico productivo.',
      'Panel de metricas': 'Indicadores consolidados para monitorear desvio, avance y performance.',
      'Reportes GIS': 'Consultas geograficas y salidas cartograficas desde una sola entrada.',
      'Documentos ISO': 'Repositorio principal de documentacion ISO para consulta operativa.',
      'Auditoria': 'Accesos de control y seguimiento para revisiones internas y externas.',
      'Parametros': 'Ajustes generales de organizaciones y reglas maestras del sistema.',
      'WhatsApp': 'Configuracion del canal WhatsApp y sus automatizaciones asociadas.',
      'Plugins': 'Habilitacion y administracion de extensiones activas en Don Juan GIS.',
      'Tipos de insumos': 'Catalogos base para estandarizar insumos y su clasificacion.',
      'Parametros GIS': 'Variables de mapa, capas y ajustes espaciales operativos.',
    },
  };

  return descriptions[groupKey]?.[itemLabel] ?? 'Acceso directo al modulo seleccionado.';
}

function getHubFooterCopy(groupKey: string) {
  switch (groupKey) {
    case 'operaciones-agro':
      return 'Ultima actualizacion: hace 2 min';
    case 'insumos-stock':
      return 'Inventario conciliado al cierre de hoy';
    case 'granos-silos':
      return 'Seguimiento logistico sincronizado';
    case 'finanzas':
      return 'Conciliacion financiera al dia';
    default:
      return 'Actualizacion continua';
  }
}

function getIndicatorBadge(groupKey: string, index: number) {
  const badges: Record<string, string[]> = {
    'operaciones-agro': ['activo', 'alerta', 'seguimiento'],
    'insumos-stock': ['reposicion', 'abierto', 'balance'],
    'granos-silos': ['capacidad', 'flujo', 'transito'],
    finanzas: ['proyeccion', 'agenda', 'margen'],
  };

  return badges[groupKey]?.[index] ?? 'estado';
}

function getIndicatorProgress(groupKey: string, index: number) {
  const progress: Record<string, string[]> = {
    'operaciones-agro': ['72%', '34%', '68%'],
    'insumos-stock': ['48%', '63%', '84%'],
    'granos-silos': ['61%', '74%', '46%'],
    finanzas: ['79%', '38%', '65%'],
  };

  return progress[groupKey]?.[index] ?? '60%';
}

function getHubInsightCopy(groupKey: string) {
  switch (groupKey) {
    case 'operaciones-agro':
      return 'Conviene priorizar labores con mayor sensibilidad climatica y cerrar entregas abiertas antes del cambio de ventana.';
    case 'insumos-stock':
      return 'Hay margen para reordenar compras abiertas y adelantar reposicion de insumos criticos sin tensionar el inventario.';
    case 'granos-silos':
      return 'El frente logistico muestra buena capacidad disponible, pero conviene acelerar entregas abiertas para evitar cuello de salida.';
    case 'finanzas':
      return 'La lectura financiera es estable; el siguiente foco deberia estar en pagos proximos y seguimiento del margen ponderado.';
    default:
      return 'El modulo presenta informacion suficiente para una accion operativa inmediata.';
  }
}

function getSuppliesIndicators() {
  return [
    {
      label: 'Items criticos',
      value: '05',
      detail: 'Insumos con reposicion prioritaria para no frenar operaciones.',
    },
    {
      label: 'Compras abiertas',
      value: '08',
      detail: 'Ordenes y adquisiciones pendientes de recepcion o imputacion.',
    },
    {
      label: 'Stock valorizado',
      value: '$ 9.6M',
      detail: 'Valuacion consolidada del inventario activo del modulo.',
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
