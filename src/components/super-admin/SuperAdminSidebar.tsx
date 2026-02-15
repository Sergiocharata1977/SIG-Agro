'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  const menuItems = [
    {
      icon: '👨‍🌾',
      label: 'Productores',
      href: '/super-admin/productores',
      active: pathname?.startsWith('/super-admin/productores'),
    },
    {
      icon: '🏢',
      label: 'Organizaciones',
      href: '/super-admin/organizaciones',
      active: pathname?.startsWith('/super-admin/organizaciones'),
    },
    {
      icon: '🎨',
      label: 'Design System',
      href: '/super-admin/design-system',
      active: pathname?.startsWith('/super-admin/design-system'),
    },
    {
      icon: '⚙️',
      label: 'Configuracion',
      href: '/super-admin/config',
      active: pathname === '/super-admin/config',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col shadow-xl z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="font-bold text-lg tracking-tight flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <span>Super Admin</span>
        </div>
      </div>

      <div className="p-4 bg-slate-800/50 border-b border-slate-800">
        <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Usuario</div>
        <div className="font-medium truncate">{user?.displayName || 'Admin'}</div>
        <div className="text-xs text-slate-500 truncate">{user?.email}</div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              item.active
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg transition-colors text-sm font-medium"
        >
          🚪 Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
