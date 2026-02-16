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
  LogOut,
  Map,
  MapPin,
  Package,
  Pin,
  Receipt,
  Settings,
  Sprout,
  Tractor,
  Truck,
  Warehouse,
  Wheat,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';
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
    setActiveOrganization,
    signOut,
    hasModuleAccess,
    canPerformAction,
  } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const contextualPlotId = searchParams.get('plotId');

  useEffect(() => {
    mobileToggleFn = () => setMobileOpen((prev) => !prev);
    mobileCloseFn = () => setMobileOpen(false);
    return () => {
      mobileToggleFn = null;
      mobileCloseFn = null;
    };
  }, []);

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
        key: 'organizacion',
        title: 'Organizacion',
        icon: Building2,
        active: pathname?.startsWith('/organizaciones') || false,
        module: 'admin',
        items: [
          {
            icon: Building2,
            label: 'ABM Organizaciones',
            href: '/organizaciones',
            active: pathname?.startsWith('/organizaciones') || false,
            module: 'admin',
          },
          {
            icon: Pin,
            label: 'Usuarios y roles',
            module: 'admin',
            active: false,
            disabled: true,
            badge: 'proximamente',
          },
          {
            icon: Settings,
            label: 'Permisos',
            module: 'admin',
            active: false,
            disabled: true,
            badge: 'proximamente',
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
        active: pathname?.startsWith('/organizaciones') || false,
        module: 'admin',
        items: [
          { icon: Settings, label: 'Parametros', href: '/organizaciones', active: pathname?.startsWith('/organizaciones') || false, module: 'admin' },
          { icon: Package, label: 'Tipos de insumos', href: '/operaciones', active: false, module: 'contabilidad' },
          { icon: MapPin, label: 'Parametros GIS', href: '/dashboard', active: false, module: 'mapa_gis' },
        ],
      },
    ];

    return [...ops, ...control];
  }, [pathname]);

  useEffect(() => {
    const defaults: Record<string, boolean> = {};
    for (const g of groups) defaults[g.key] = g.active;
    setExpandedGroups((prev) => ({ ...defaults, ...prev }));
  }, [groups]);

  const isSuperAdmin = user?.role === 'super_admin' || isSuperAdminEmail(firebaseUser?.email);
  if (isSuperAdmin) return null;

  const userEmail = user?.email || firebaseUser?.email || '';
  const userName = user?.displayName || firebaseUser?.displayName || userEmail.split('@')[0] || 'Usuario';
  const userInitial = userName.charAt(0).toUpperCase();

  const filteredGroups = groups
    .filter((group) => {
      if (group.module === 'admin' && !canPerformAction('admin')) return false;
      if (group.feature && organization) {
        const enabled = organization.features[group.feature as keyof typeof organization.features];
        if (!enabled) return false;
      }
      return hasModuleAccess(group.module);
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.module === 'admin' && !canPerformAction('admin')) return false;
        if (item.feature && organization) {
          const enabled = organization.features[item.feature as keyof typeof organization.features];
          if (!enabled) return false;
        }
        return hasModuleAccess(item.module);
      }),
    }))
    .filter((group) => group.items.length > 0);

  if (pathname === '/dashboard' && contextualPlotId) {
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
    'panel',
    'organizacion',
    'gis',
    'campanias',
    'insumos-stock',
    'operaciones-agro',
    'granos-silos',
    'finanzas',
  ]);

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-slate-950/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed md:relative z-50 h-screen bg-slate-950 text-slate-100 flex flex-col transition-all duration-300 border-r border-slate-800 ${collapsed ? 'md:w-20' : 'md:w-80'} w-80 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-800 relative">
          <div className="flex items-center gap-3">
            <Image src="/logo-sig-agro.png" alt="SIG Agro" width={40} height={40} className="rounded-lg" />
            {!collapsed && (
              <div>
                <div className="font-semibold text-slate-100">Don Candido IA</div>
                <div className="text-xs text-slate-500">SIG Agro</div>
              </div>
            )}
          </div>

          <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-100 md:hidden" aria-label="Cerrar menu">
            <X className="w-4 h-4" />
          </button>

          <button onClick={() => setCollapsed((prev) => !prev)} className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3 w-7 h-7 bg-slate-900 rounded-full items-center justify-center text-slate-300 hover:text-slate-100 border border-slate-700 z-10" aria-label={collapsed ? 'Expandir' : 'Colapsar'}>
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/40 space-y-2">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Organizacion activa</div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-sky-700 text-white grid place-items-center text-xs font-bold">{(organization?.name || 'O').charAt(0).toUpperCase()}</div>
              <div className="text-sm font-medium text-slate-200 truncate">{organization?.name || 'Sin organizacion'}</div>
            </div>
            <select value={organizationId || ''} onChange={(e) => void setActiveOrganization(e.target.value)} className="w-full text-sm rounded-md bg-slate-900 border border-slate-700 text-slate-100 px-2 py-1.5" disabled={organizations.length === 0}>
              {organizations.length === 0 && <option value="">Sin organizaciones</option>}
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            {organizations.length === 0 && canPerformAction('admin') && (
              <Link
                href="/organizaciones"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center w-full rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
              >
                Crear organizacion
              </Link>
            )}
          </div>
        )}

        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          <div className="space-y-1.5">
            {!collapsed && <p className="px-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Operacion</p>}
            {filteredGroups.filter((g) => opKeys.has(g.key)).map((group) => {
              const GroupIcon = group.icon;
              const open = !!expandedGroups[group.key];
              return (
                <div key={group.key} className="space-y-1">
                  <button
                    onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border transition ${group.active ? 'bg-slate-800 border-slate-700 text-sky-300' : 'border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-800 hover:text-slate-100'}`}
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
                    <div className="ml-4 pl-3 border-l border-slate-800 space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const cls = `flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition ${item.active ? 'bg-slate-800 border-slate-700 text-sky-300' : 'border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-800 hover:text-slate-100'}`;
                        if (item.disabled || !item.href) {
                          return (
                            <div key={`${group.key}-${item.label}`} className={`${cls} opacity-70 cursor-not-allowed`}>
                              <Icon className="w-3.5 h-3.5" />
                              <span className="flex-1">{item.label}</span>
                              {item.badge && <span className="text-[10px] uppercase tracking-wide text-slate-400">{item.badge}</span>}
                            </div>
                          );
                        }
                        return (
                          <Link key={`${group.key}-${item.href}-${item.label}`} href={item.href} onClick={() => setMobileOpen(false)} className={cls}>
                            <Icon className="w-3.5 h-3.5" />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && <span className="text-[10px] uppercase tracking-wide text-slate-400">{item.badge}</span>}
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
            {!collapsed && <p className="px-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Control</p>}
            {filteredGroups.filter((g) => !opKeys.has(g.key)).map((group) => {
              const GroupIcon = group.icon;
              const open = !!expandedGroups[group.key];
              return (
                <div key={group.key} className="space-y-1">
                  <button
                    onClick={() => setExpandedGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border transition ${group.active ? 'bg-slate-800 border-slate-700 text-sky-300' : 'border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-800 hover:text-slate-100'}`}
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
                    <div className="ml-4 pl-3 border-l border-slate-800 space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const cls = `flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition ${item.active ? 'bg-slate-800 border-slate-700 text-sky-300' : 'border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-800 hover:text-slate-100'}`;
                        if (item.disabled || !item.href) {
                          return (
                            <div key={`${group.key}-${item.label}`} className={`${cls} opacity-70 cursor-not-allowed`}>
                              <Icon className="w-3.5 h-3.5" />
                              <span className="flex-1">{item.label}</span>
                              {item.badge && <span className="text-[10px] uppercase tracking-wide text-slate-400">{item.badge}</span>}
                            </div>
                          );
                        }
                        return (
                          <Link key={`${group.key}-${item.href}-${item.label}`} href={item.href} onClick={() => setMobileOpen(false)} className={cls}>
                            <Icon className="w-3.5 h-3.5" />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && <span className="text-[10px] uppercase tracking-wide text-slate-400">{item.badge}</span>}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className={`flex items-center gap-3 p-2 rounded-md bg-slate-900 border border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-sm font-semibold text-white">{userInitial}</div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{userName}</div>
                <div className="text-xs text-slate-400 truncate">{userEmail}</div>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="mt-2 flex justify-center">
              <LanguageSelector />
            </div>
          )}

          <button
            onClick={signOut}
            className={`w-full mt-2 px-3 py-2.5 bg-rose-950/20 border border-rose-900/60 text-rose-300 hover:bg-rose-950/40 rounded-md transition flex items-center justify-center gap-2 ${collapsed ? 'px-2' : ''}`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="text-sm font-medium">Cerrar sesion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
