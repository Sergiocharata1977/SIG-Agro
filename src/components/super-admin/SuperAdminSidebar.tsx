'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
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
    <aside className="w-72 bg-emerald-950 text-emerald-50 h-screen flex flex-col border-r border-emerald-900 z-50">
      <div className="h-16 flex items-center px-6 border-b border-emerald-900">
        <div className="font-semibold text-base tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-300" />
          <span>Control Central</span>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-emerald-900">
        <div className="text-[11px] text-emerald-300/70 uppercase tracking-[0.15em] mb-2">Sesion</div>
        <div className="text-sm font-semibold truncate">{user?.displayName || 'Admin'}</div>
        <div className="text-xs text-emerald-100/70 truncate mt-0.5">{user?.email}</div>
      </div>

      <nav className="flex-1 p-3 space-y-1.5">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md border transition-colors ${
              item.active
                ? 'bg-emerald-800/70 border-emerald-600 text-emerald-100'
                : 'border-transparent text-emerald-100/80 hover:bg-emerald-900/50 hover:border-emerald-800 hover:text-emerald-50'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-emerald-900">
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

