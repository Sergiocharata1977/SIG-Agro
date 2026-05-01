'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ComponentType, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  ChevronDown,
  Droplets,
  Landmark,
  LayoutGrid,
  Leaf,
  LogOut,
  Menu,
  Settings,
  Sprout,
  UserCircle2,
  X,
} from 'lucide-react';
import { AGRO_PLUGINS } from '@/config/plugins';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSelector } from '@/components/i18n/LanguageSelector';

type MegaItem = {
  title: string;
  description: string;
  href: string;
};

type MegaSection = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: MegaItem[];
};

const sections: MegaSection[] = [
  {
    id: 'produccion',
    label: 'Produccion',
    icon: Sprout,
    items: [
      { title: 'Campos y lotes', description: 'Ficha de establecimientos y lotes productivos.', href: '/campos' },
      { title: 'Cuaderno de campo', description: 'Bitacora de labores y trazabilidad por lote.', href: '/cuaderno' },
      { title: 'Operaciones', description: 'Ordenes de trabajo y recursos operativos.', href: '/operaciones' },
    ],
  },
  {
    id: 'campanias',
    label: 'Campanias',
    icon: Leaf,
    items: [
      { title: 'Campanias', description: 'Gestion del ciclo agricola por campo y lote.', href: '/campanias' },
      { title: 'Nueva campania', description: 'Wizard para alta de campania productiva.', href: '/campanias/nueva' },
      { title: 'Metricas', description: 'Rendimiento, comparativas e indicadores.', href: '/metricas' },
    ],
  },
  {
    id: 'riego',
    label: 'Riego',
    icon: Droplets,
    items: [
      { title: 'Programacion', description: 'Planes por pivot, goteo y sector.', href: '/riego' },
      { title: 'Rentabilidad', description: 'Impacto economico y eficiencia operativa.', href: '/rentabilidad' },
      { title: 'Dashboard', description: 'Vista general con accesos rapidos.', href: '/dashboard' },
    ],
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad',
    icon: Landmark,
    items: [
      { title: 'Libro diario', description: 'Ingresos, egresos y movimientos contables.', href: '/contabilidad' },
      { title: 'Nuevo asiento', description: 'Carga guiada de asiento contable agro.', href: '/contabilidad/asiento' },
      { title: 'Terceros', description: 'Contratistas, proveedores y asesores.', href: '/terceros' },
    ],
  },
  {
    id: 'organizacion',
    label: 'Organizacion',
    icon: Building2,
    items: [
      { title: 'Organizaciones', description: 'Switch de org activa, roles y datos base.', href: '/organizaciones' },
      { title: 'Plugins', description: 'Marketplace interno y activacion por organizacion.', href: '/configuracion/plugins' },
      { title: 'Analisis IA', description: 'Mapas, observaciones y soporte inteligente.', href: '/analisis-ia' },
    ],
  },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const { organization, organizationId, organizations, setActiveOrganization, enabledPlugins, user, signOut } = useAuth();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const userRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenSection(null);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const activeSection = useMemo(() => {
    return sections.find((section) => section.items.some((item) => pathname.startsWith(item.href)));
  }, [pathname]);

  const pluginShortcuts = useMemo(() => {
    const enabledSet = new Set(enabledPlugins);

    return AGRO_PLUGINS
      .filter((plugin) => plugin.identity.tier !== 'base' && enabledSet.has(plugin.identity.slug))
      .map((plugin) => ({
        slug: plugin.identity.slug,
        label: plugin.identity.display_name,
        href: plugin.routes.navigation[0]?.path ?? plugin.routes.pages[0]?.path ?? '#',
      }))
      .filter((plugin) => plugin.href !== '#');
  }, [enabledPlugins]);

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(193,200,194,0.7)] bg-[rgba(248,249,255,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-[1500px] flex-col justify-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden"
              aria-label="Abrir menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#012d1d] text-white shadow-lg shadow-emerald-950/20">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#446900]">SIG Agro</p>
                <p className="font-semibold text-[#0b1c30]">Operacion de campo</p>
              </div>
            </Link>
          </div>

          <div ref={navRef} className="hidden flex-1 items-center justify-center lg:flex">
            <nav className="flex items-center gap-2 rounded-full border border-white/70 bg-white/85 p-2 shadow-sm">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection?.id === section.id || openSection === section.id;
                return (
                  <div key={section.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenSection((value) => (value === section.id ? null : section.id))}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                        isActive ? 'bg-[#012d1d] text-white shadow-lg shadow-emerald-950/20' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                      <ChevronDown className={`h-4 w-4 transition ${openSection === section.id ? 'rotate-180' : ''}`} />
                    </button>

                    {openSection === section.id ? (
                      <div className="absolute left-1/2 top-[calc(100%+16px)] z-50 w-[720px] -translate-x-1/2 rounded-[28px] border border-[rgba(193,200,194,0.9)] bg-white/98 p-6 shadow-2xl shadow-slate-900/10">
                        <div className="mb-5 flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#446900]">{section.label}</p>
                            <p className="mt-1 text-sm text-slate-500">Accesos principales y tareas frecuentes.</p>
                          </div>
                          <Link
                            href={section.items[0].href}
                            onClick={() => setOpenSection(null)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <LayoutGrid className="h-4 w-4" />
                            Abrir modulo
                          </Link>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          {section.items.map((item) => {
                            const selected = pathname.startsWith(item.href);
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpenSection(null)}
                                className={`rounded-3xl border p-5 transition ${
                                  selected
                                    ? 'border-[#1b4332] bg-[#eff7f1] shadow-sm'
                                    : 'border-slate-200 bg-[#fbfcff] hover:-translate-y-0.5 hover:border-[#a5d0b9] hover:shadow-sm'
                                }`}
                              >
                                <p className="font-semibold text-[#0b1c30]">{item.title}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden min-w-[240px] rounded-2xl border border-white/70 bg-white/85 p-2 shadow-sm md:block">
              <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Organizacion activa</label>
              <select
                data-testid="active-organization-select"
                value={organizationId || ''}
                onChange={(event) => void setActiveOrganization(event.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-medium text-[#0b1c30] outline-none"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div ref={userRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((value) => !value)}
                className="inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-3 py-2 shadow-sm"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e5eeff] text-[#012d1d]">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-semibold text-[#0b1c30]">{user?.displayName || organization?.name || 'SIG Agro'}</p>
                  <p className="text-xs text-slate-500">{user?.email || 'Usuario'}</p>
                </div>
              </button>

              {userMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-80 rounded-[28px] border border-[rgba(193,200,194,0.9)] bg-white p-5 shadow-2xl shadow-slate-900/10">
                  <div className="rounded-3xl bg-[#f4f8f5] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#446900]">Sesion</p>
                    <p className="mt-2 font-semibold text-[#0b1c30]">{user?.displayName || 'Usuario SIG Agro'}</p>
                    <p className="text-sm text-slate-500">{user?.email || ''}</p>
                  </div>

                  <div className="my-4 flex justify-center rounded-3xl border border-slate-200 px-3 py-3">
                    <LanguageSelector />
                  </div>

                  <div className="space-y-2">
                    <Link
                      href="/organizaciones"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4" />
                      Administrar organizacion
                    </Link>
                    <Link
                      href="/configuracion/plugins"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Administrar plugins
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await signOut();
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesion
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {pluginShortcuts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Plugins activos
            </span>
            {pluginShortcuts.map((plugin) => (
              <Link
                key={plugin.slug}
                href={plugin.href}
                data-testid={`sidebar-plugin-${plugin.slug}`}
                className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100"
              >
                {plugin.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {mobileOpen ? (
        <div className="border-t border-[rgba(193,200,194,0.7)] bg-white px-4 py-4 lg:hidden">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-[#f4f8f5] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#446900]">Organizacion activa</p>
              <select
                data-testid="active-organization-select"
                value={organizationId || ''}
                onChange={(event) => void setActiveOrganization(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-[#0b1c30] outline-none"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2 text-[#0b1c30]">
                    <Icon className="h-4 w-4" />
                    <p className="font-semibold">{section.label}</p>
                  </div>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-2xl bg-slate-50 px-4 py-3"
                      >
                        <p className="text-sm font-medium text-[#0b1c30]">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
