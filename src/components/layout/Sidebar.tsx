'use client';

import { ComponentType, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FileText,
  Landmark,
  LogOut,
  MapPinned,
  Pin,
  Sprout,
  Users,
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

interface MenuItem {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active: boolean;
  feature?: string;
  module: string;
  subItems?: { icon: ComponentType<{ className?: string }>; label: string; href: string }[];
}

export default function Sidebar() {
  const pathname = usePathname();
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
  const [financeOpen, setFinanceOpen] = useState(false);

  useEffect(() => {
    if (
      pathname?.startsWith('/contabilidad') ||
      pathname?.startsWith('/terceros') ||
      pathname?.startsWith('/operaciones') ||
      pathname?.startsWith('/rentabilidad')
    ) {
      setFinanceOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    mobileToggleFn = () => setMobileOpen((prev) => !prev);
    mobileCloseFn = () => setMobileOpen(false);
    return () => {
      mobileToggleFn = null;
      mobileCloseFn = null;
    };
  }, []);

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        icon: BarChart3,
        label: 'Dashboard',
        href: '/metricas',
        active: pathname === '/metricas',
        feature: 'metricas',
        module: 'metricas',
      },
      {
        icon: MapPinned,
        label: 'Mapa GIS',
        href: '/dashboard',
        active: pathname === '/dashboard',
        feature: 'mapa_gis',
        module: 'mapa_gis',
      },
      {
        icon: Pin,
        label: 'Mis Campos',
        href: '/campos',
        active: pathname?.startsWith('/campos') || false,
        feature: 'mapa_gis',
        module: 'campos',
      },
      {
        icon: Pin,
        label: 'Lotes GIS',
        href: '/lotes',
        active: pathname?.startsWith('/lotes') || false,
        feature: 'mapa_gis',
        module: 'campos',
      },
      {
        icon: Sprout,
        label: 'Campanas',
        href: '/campanias',
        active: pathname?.startsWith('/campanias') || false,
        feature: 'campanias',
        module: 'campanias',
      },
      {
        icon: BookOpen,
        label: 'Cuaderno',
        href: '/cuaderno',
        active: pathname?.startsWith('/cuaderno') || false,
        feature: 'campanias',
        module: 'campanias',
      },
      {
        icon: Droplets,
        label: 'Riego',
        href: '/riego',
        active: pathname?.startsWith('/riego') || false,
        feature: 'campanias',
        module: 'campanias',
      },
      {
        icon: Landmark,
        label: 'Contabilidad',
        href: '/contabilidad',
        active:
          pathname?.startsWith('/contabilidad') ||
          pathname?.startsWith('/terceros') ||
          pathname?.startsWith('/operaciones') ||
          pathname?.startsWith('/rentabilidad') ||
          false,
        feature: 'contabilidad',
        module: 'contabilidad',
        subItems: [
          { icon: Users, label: 'Terceros', href: '/terceros' },
          { icon: BookOpen, label: 'Operaciones y Registros', href: '/operaciones' },
          { icon: BarChart3, label: 'Saldos', href: '/contabilidad' },
          { icon: ChartNoAxesCombined, label: 'Rentabilidad', href: '/rentabilidad' },
        ],
      },
      {
        icon: Bot,
        label: 'Analisis IA',
        href: '/analisis-ia',
        active: pathname?.startsWith('/analisis-ia') || false,
        feature: 'analisis_ia',
        module: 'analisis_ia',
      },
      {
        icon: FileText,
        label: 'Documentos',
        href: '/documentos',
        active: pathname?.startsWith('/documentos') || false,
        feature: 'documentos',
        module: 'documentos',
      },
      {
        icon: Building2,
        label: 'Organizaciones',
        href: '/organizaciones',
        active: pathname?.startsWith('/organizaciones') || false,
        module: 'admin',
      },
    ],
    [pathname]
  );

  const filteredItems = menuItems.filter((item) => {
    if (item.label === 'Organizaciones' && !canPerformAction('admin')) return false;

    if (organization && item.feature) {
      const enabled = organization.features[item.feature as keyof typeof organization.features];
      if (!enabled) return false;
    }

    return hasModuleAccess(item.module);
  });

  const userEmail = user?.email || firebaseUser?.email || '';
  const userName = user?.displayName || firebaseUser?.displayName || userEmail.split('@')[0] || 'Usuario';
  const userInitial = userName.charAt(0).toUpperCase();
  const isSuperAdmin = user?.role === 'super_admin' || isSuperAdminEmail(firebaseUser?.email);
  if (isSuperAdmin) return null;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed md:relative z-50 h-screen bg-slate-950 text-slate-100 flex flex-col transition-all duration-300 border-r border-slate-800 ${collapsed ? 'md:w-20' : 'md:w-72'} w-72 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-4 border-b border-slate-800 relative">
          <div className="flex items-center gap-3">
            <Image src="/logo-sig-agro.png" alt="SIG Agro" width={42} height={42} className="rounded-lg" />
            {!collapsed && (
              <div>
                <div className="font-semibold text-slate-100">Don Candido IA</div>
                <div className="text-xs text-slate-500">SIG Agro</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white md:hidden"
            aria-label="Cerrar menu"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-3 w-7 h-7 bg-slate-900 rounded-full items-center justify-center text-slate-300 hover:text-slate-100 border border-slate-700 z-10"
            aria-label={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/40 space-y-2">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Organizacion activa</div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-sky-700 text-white grid place-items-center text-xs font-bold">
                {(organization?.name || 'O').charAt(0).toUpperCase()}
              </div>
              <div className="text-sm font-medium text-slate-200 truncate">{organization?.name || 'Sin organizacion'}</div>
            </div>
            <select
              value={organizationId || ''}
              onChange={(e) => void setActiveOrganization(e.target.value)}
              className="w-full text-sm rounded-md bg-slate-900 border border-slate-700 text-slate-100 px-2 py-1.5"
              disabled={organizations.length === 0}
            >
              {organizations.length === 0 && <option value="">Sin organizaciones</option>}
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            if (!item.subItems) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md border transition ${
                    item.active
                      ? 'bg-slate-800 border-slate-700 text-sky-300'
                      : 'border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-800 hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            }

            return (
              <div key={item.href}>
                <button
                  onClick={() => setFinanceOpen((prev) => !prev)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border transition ${
                    item.active
                      ? 'bg-slate-800 border-slate-700 text-sky-300'
                      : 'border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-800 hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${financeOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {financeOpen && !collapsed && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-3">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const active = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border transition ${
                            active
                              ? 'bg-slate-800 border-slate-700 text-sky-300'
                              : 'border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-800 hover:text-slate-100'
                          }`}
                        >
                          <SubIcon className="w-3.5 h-3.5" />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className={`flex items-center gap-3 p-2 rounded-md bg-slate-900 border border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-sm font-semibold text-white">
              {userInitial}
            </div>
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
