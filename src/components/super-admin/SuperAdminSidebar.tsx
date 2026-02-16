'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  LogOut,
  Palette,
  Settings,
  ShieldCheck,
  Users2,
} from 'lucide-react';

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  const menuItems = [
    {
      icon: Users2,
      label: 'Productores',
      href: '/super-admin/productores',
      active: pathname?.startsWith('/super-admin/productores'),
    },
    {
      icon: Building2,
      label: 'Organizaciones',
      href: '/super-admin/organizaciones',
      active: pathname?.startsWith('/super-admin/organizaciones'),
    },
    {
      icon: Palette,
      label: 'Design System',
      href: '/super-admin/design-system',
      active: pathname?.startsWith('/super-admin/design-system'),
    },
    {
      icon: Settings,
      label: 'Configuracion',
      href: '/super-admin/config',
      active: pathname === '/super-admin/config',
    },
  ];

  return (
    <aside className="w-72 bg-slate-950 text-slate-100 h-screen flex flex-col border-r border-slate-800 z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="font-semibold text-base tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-400" />
          <span>Control Central</span>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-slate-800">
        <div className="text-[11px] text-slate-500 uppercase tracking-[0.15em] mb-2">Sesion</div>
        <div className="text-sm font-semibold truncate">{user?.displayName || 'Admin'}</div>
        <div className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</div>
      </div>

      <nav className="flex-1 p-3 space-y-1.5">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md border transition-colors ${
              item.active
                ? 'bg-slate-800 border-slate-700 text-sky-300'
                : 'border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-800 hover:text-slate-100'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-rose-900/60 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 rounded-md transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}

