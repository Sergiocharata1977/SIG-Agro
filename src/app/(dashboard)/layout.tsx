'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Bell,
    ChevronRight,
    CircleUserRound,
    LayoutDashboard,
    LogOut,
    Menu,
    Radar,
    Search,
    Settings2,
    Sparkles,
    Users,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar, { toggleMobileSidebar } from '@/components/layout/Sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminEmail } from '@/lib/auth-utils';

type QuickSearchItem = {
    label: string;
    href: string;
    keywords: string[];
};

const QUICK_SEARCH_ITEMS: QuickSearchItem[] = [
    { label: 'Panel', href: '/dashboard', keywords: ['dashboard', 'panel', 'inicio', 'resumen'] },
    { label: 'Mapa GIS', href: '/campos', keywords: ['gis', 'mapa', 'campos', 'territorio'] },
    { label: 'Lotes', href: '/lotes', keywords: ['lotes', 'parcelas', 'lote'] },
    { label: 'Operaciones', href: '/operaciones', keywords: ['operaciones', 'labores', 'siembra', 'cosecha'] },
    { label: 'Riego', href: '/riego', keywords: ['riego', 'agua', 'irrigacion'] },
    { label: 'Campañas', href: '/campanias', keywords: ['campanas', 'campaña', 'cultivos'] },
    { label: 'Scouting', href: '/scouting', keywords: ['scouting', 'observaciones', 'monitoreo'] },
    { label: 'Análisis IA', href: '/analisis-ia', keywords: ['ia', 'analisis', 'alertas', 'radar'] },
    { label: 'Contabilidad', href: '/contabilidad', keywords: ['contabilidad', 'asientos', 'libro diario'] },
    { label: 'Rentabilidad', href: '/rentabilidad', keywords: ['rentabilidad', 'margen', 'roi', 'finanzas'] },
    { label: 'Terceros', href: '/terceros', keywords: ['terceros', 'clientes', 'proveedores'] },
    { label: 'Organizaciones', href: '/organizaciones', keywords: ['usuarios', 'organizaciones', 'workspace', 'permisos'] },
    { label: 'Plugins', href: '/configuracion/plugins', keywords: ['plugins', 'configuracion', 'marketplace'] },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { firebaseUser, user, loading, organization, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isSuperAdmin = user?.role === 'super_admin' || isSuperAdminEmail(firebaseUser?.email);
    const userName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
    const userEmail = firebaseUser?.email || user?.email || 'sin-email';

    useEffect(() => {
        if (!loading && !firebaseUser) {
            router.replace('/auth/login');
            return;
        }
        if (!loading && isSuperAdmin) {
            router.replace('/super-admin/productores');
            return;
        }
        if (!loading && firebaseUser && !isSuperAdmin && !user?.organizationId && pathname !== '/organizaciones') {
            router.replace('/organizaciones');
        }
    }, [firebaseUser, isSuperAdmin, loading, pathname, router, user?.organizationId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando autenticacion...</p>
                </div>
            </div>
        );
    }

    if (!firebaseUser || isSuperAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirigiendo al login...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen md:flex"
            style={{
                background:
                    'radial-gradient(circle at top left, var(--dashboard-bg-accent), transparent 18%), linear-gradient(180deg, var(--dashboard-bg) 0%, color-mix(in srgb, var(--dashboard-bg) 72%, white 28%) 44%, var(--dashboard-bg) 100%)',
            }}
        >
            <Sidebar />

            <div className="min-w-0 flex-1">
                <DesktopWorkspaceBar
                    pathname={pathname}
                    organizationName={organization?.name || 'Workspace activo'}
                    userName={userName}
                    userEmail={userEmail}
                    onSignOut={() => void signOut()}
                />

                <MobileWorkspaceBar
                    organizationName={organization?.name || getMobileTitle(user?.organizationId)}
                    userName={userName}
                    userEmail={userEmail}
                    onSignOut={() => void signOut()}
                />

                <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function DesktopWorkspaceBar({
    pathname,
    organizationName,
    userName,
    userEmail,
    onSignOut,
}: {
    pathname: string;
    organizationName: string;
    userName: string;
    userEmail: string;
    onSignOut: () => void;
}) {
    const section = getDesktopSection(pathname);
    const initials = getInitials(userName);

    return (
        <header
            className="sticky top-0 z-20 hidden px-6 py-4 backdrop-blur-xl md:block"
            style={{
                borderBottom: '1px solid var(--dashboard-border)',
                background: 'color-mix(in srgb, var(--dashboard-surface) 92%, white 8%)',
            }}
        >
            <div className="flex items-center justify-between gap-6">
                <div className="flex min-w-0 items-center gap-4">
                    <div
                        className="flex items-center gap-4 rounded-[28px] px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                        style={{
                            border: '1px solid var(--dashboard-sidebar-border)',
                            background: 'linear-gradient(135deg, white, color-mix(in srgb, var(--dashboard-popup-bg) 86%, white 14%))',
                        }}
                    >
                        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white p-2 shadow-sm">
                            <Image src="/logo-sig-agro.png" alt="SIG Agro" width={42} height={42} className="rounded-xl" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: 'var(--dashboard-accent)' }}>
                                Workspace operativo
                            </div>
                            <div className="truncate text-xl font-semibold" style={{ color: 'var(--dashboard-text)' }}>
                                {section.title}
                            </div>
                            <div className="truncate text-xs" style={{ color: 'var(--dashboard-muted)' }}>
                                {section.subtitle}
                            </div>
                        </div>
                    </div>

                    <div className="hidden min-w-0 items-center gap-2 xl:flex">
                        <HeaderPill icon={Sparkles} label={organizationName} />
                        <HeaderPill icon={Settings2} label={section.badge} />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <HeaderSearchBar className="hidden lg:flex xl:min-w-[280px]" listId="sigagro-desktop-search" />

                    <HeaderActionLink href="/dashboard" label="Mi Panel" icon={LayoutDashboard} />
                    <HeaderActionLink href="/analisis-ia" label="Radar de Campo" icon={Radar} />
                    <HeaderActionLink href="/organizaciones" label="Usuarios" icon={Users} />

                    <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                        style={{
                            border: '1px solid var(--dashboard-sidebar-border)',
                            background: 'var(--dashboard-sidebar-panel)',
                            color: 'var(--dashboard-sidebar-text)',
                        }}
                        aria-label="Notificaciones"
                    >
                        <Bell className="h-4.5 w-4.5" />
                    </button>

                    <div className="hidden text-sm font-medium xl:block" style={{ color: 'var(--dashboard-text)' }}>
                        {userEmail}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition"
                                style={{
                                    border: '1px solid var(--dashboard-sidebar-border)',
                                    background: 'var(--dashboard-sidebar-panel)',
                                    color: 'var(--dashboard-sidebar-text)',
                                }}
                                aria-label="Abrir menu de usuario"
                            >
                                <div
                                    className="grid h-11 w-11 place-items-center rounded-full text-sm font-semibold"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--dashboard-accent), var(--dashboard-accent-strong))',
                                        color: 'var(--dashboard-accent-contrast)',
                                    }}
                                >
                                    {initials}
                                </div>
                                <div className="hidden text-left lg:block">
                                    <div className="max-w-[180px] truncate text-sm font-semibold" style={{ color: 'var(--dashboard-text)' }}>
                                        {userName}
                                    </div>
                                    <div className="text-[11px]" style={{ color: 'var(--dashboard-muted)' }}>
                                        Usuario activo
                                    </div>
                                </div>
                                <ChevronRight className="hidden h-4 w-4 lg:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <UserMenuContent userName={userName} userEmail={userEmail} onSignOut={onSignOut} />
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}

function MobileWorkspaceBar({
    organizationName,
    userName,
    userEmail,
    onSignOut,
}: {
    organizationName: string;
    userName: string;
    userEmail: string;
    onSignOut: () => void;
}) {
    return (
        <header
            className="sticky top-0 z-30 px-4 py-3 backdrop-blur-xl md:hidden"
            style={{
                borderBottom: '1px solid var(--dashboard-border)',
                background: 'var(--dashboard-surface)',
            }}
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => toggleMobileSidebar()}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm"
                        style={{
                            border: '1px solid var(--dashboard-sidebar-border)',
                            background: 'var(--dashboard-sidebar-panel)',
                            color: 'var(--dashboard-sidebar-text)',
                        }}
                        aria-label="Abrir menu lateral"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--dashboard-accent)' }}>
                            SIG Agro
                        </p>
                        <p className="truncate text-sm font-semibold" style={{ color: 'var(--dashboard-text)' }}>
                            {organizationName}
                        </p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                                style={{
                                    border: '1px solid var(--dashboard-sidebar-border)',
                                    background: 'linear-gradient(135deg, var(--dashboard-accent), var(--dashboard-accent-strong))',
                                    color: 'var(--dashboard-accent-contrast)',
                                }}
                                aria-label="Abrir menu de usuario"
                            >
                                <span className="text-xs font-semibold">{getInitials(userName)}</span>
                            </button>
                        </DropdownMenuTrigger>
                        <UserMenuContent userName={userName} userEmail={userEmail} onSignOut={onSignOut} />
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                    <HeaderSearchBar className="flex min-w-0 flex-1" listId="sigagro-mobile-search" />

                    <HeaderActionLink href="/organizaciones" label="Usuarios" icon={Users} compact />
                </div>
            </div>
        </header>
    );
}

function UserMenuContent({
    userName,
    userEmail,
    onSignOut,
}: {
    userName: string;
    userEmail: string;
    onSignOut: () => void;
}) {
    return (
        <DropdownMenuContent align="end" className="w-64 p-2">
            <DropdownMenuLabel className="px-3 py-2">
                <div className="text-sm font-semibold" style={{ color: 'var(--dashboard-text)' }}>{userName}</div>
                <div className="mt-1 text-xs font-normal" style={{ color: 'var(--dashboard-muted)' }}>{userEmail}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer rounded-xl px-3 py-2.5">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Mi Panel
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/organizaciones" className="cursor-pointer rounded-xl px-3 py-2.5">
                    <CircleUserRound className="mr-2 h-4 w-4" />
                    Usuarios y espacios
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/configuracion/plugins" className="cursor-pointer rounded-xl px-3 py-2.5">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Configuracion
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                onClick={onSignOut}
                className="cursor-pointer rounded-xl px-3 py-2.5 text-red-600 focus:text-red-700"
            >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesion
            </DropdownMenuItem>
        </DropdownMenuContent>
    );
}

function HeaderPill({
    icon: Icon,
    label,
}: {
    icon: typeof Sparkles;
    label: string;
}) {
    return (
        <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium"
            style={{
                border: '1px solid var(--dashboard-sidebar-border)',
                background: 'var(--dashboard-sidebar-panel)',
                color: 'var(--dashboard-sidebar-text)',
            }}
        >
            <Icon className="h-3.5 w-3.5" style={{ color: 'var(--dashboard-accent)' }} />
            {label}
        </div>
    );
}

function HeaderSearchBar({
    className,
    listId,
}: {
    className?: string;
    listId: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [query, setQuery] = useState('');

    const suggestions = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return QUICK_SEARCH_ITEMS.slice(0, 6);
        }

        return QUICK_SEARCH_ITEMS.filter((item) => {
            const haystack = [item.label, item.href, ...item.keywords].join(' ').toLowerCase();
            return haystack.includes(normalized);
        }).slice(0, 6);
    }, [query]);

    const submitSearch = () => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return;

        const directMatch = QUICK_SEARCH_ITEMS.find(
            (item) =>
                item.label.toLowerCase() === normalized ||
                item.href.toLowerCase() === normalized ||
                item.keywords.some((keyword) => keyword.toLowerCase() === normalized)
        );

        const partialMatch = QUICK_SEARCH_ITEMS.find((item) => {
            const haystack = [item.label, item.href, ...item.keywords].join(' ').toLowerCase();
            return haystack.includes(normalized);
        });

        const target = directMatch ?? partialMatch;
        if (!target) return;
        if (target.href !== pathname) {
            router.push(target.href);
        }
        setQuery('');
    };

    return (
        <form
            className={`items-center gap-2 rounded-full px-3 py-2.5 ${className || ''}`}
            style={{
                border: '1px solid var(--dashboard-sidebar-border)',
                background: 'var(--dashboard-sidebar-panel)',
                color: 'var(--dashboard-sidebar-text)',
            }}
            onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
            }}
        >
            <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--dashboard-muted)' }} />
            <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                list={listId}
                placeholder="Buscar modulo, lote o accion..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                aria-label="Buscar en SIG Agro"
            />
            <datalist id={listId}>
                {suggestions.map((item) => (
                    <option key={`${listId}-${item.href}`} value={item.label} />
                ))}
            </datalist>
        </form>
    );
}

function HeaderActionLink({
    href,
    label,
    icon: Icon,
    compact = false,
}: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    compact?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`items-center gap-2 rounded-full text-sm font-medium ${compact ? 'inline-flex px-3 py-2.5' : 'hidden px-4 py-2 lg:inline-flex'}`}
            style={{
                border: '1px solid var(--dashboard-sidebar-border)',
                background: 'var(--dashboard-sidebar-panel)',
                color: 'var(--dashboard-sidebar-text)',
            }}
        >
            <Icon className="h-4 w-4" style={{ color: 'var(--dashboard-accent)' }} />
            {!compact ? label : null}
            {compact ? <span className="sr-only">{label}</span> : null}
        </Link>
    );
}

function getInitials(value: string) {
    return value
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((chunk) => chunk[0]?.toUpperCase())
        .join('') || 'SG';
}

function getMobileTitle(organizationId?: string | null) {
    return organizationId ? 'Organizacion activa' : 'Panel de gestion';
}

function getDesktopSection(pathname: string) {
    if (pathname.startsWith('/configuracion')) {
        return {
            title: 'Configuracion',
            subtitle: 'Navegacion contextual del sistema y sus conectores.',
            badge: 'Parametros y accesos',
        };
    }
    if (pathname.startsWith('/organizaciones')) {
        return {
            title: 'Organizaciones',
            subtitle: 'Gestion de espacios de trabajo, equipos y permisos.',
            badge: 'Workspace activo',
        };
    }
    if (pathname.startsWith('/analisis-ia')) {
        return {
            title: 'Radar IA',
            subtitle: 'Alertas, recomendaciones y seguimiento predictivo.',
            badge: 'Monitoreo inteligente',
        };
    }
    if (pathname.startsWith('/campos') || pathname.startsWith('/lotes')) {
        return {
            title: 'GIS y Territorio',
            subtitle: 'Campos, lotes y capas productivas en una sola vista.',
            badge: 'Cartografia productiva',
        };
    }
    if (pathname.startsWith('/operaciones')) {
        return {
            title: 'Operaciones',
            subtitle: 'Registro operativo, trazabilidad y ejecucion de campo.',
            badge: 'Flujo operativo',
        };
    }
    if (pathname.startsWith('/contabilidad') || pathname.startsWith('/rentabilidad') || pathname.startsWith('/terceros')) {
        return {
            title: 'Finanzas',
            subtitle: 'Control comercial, contable y rentabilidad productiva.',
            badge: 'Tablero financiero',
        };
    }
    if (pathname.startsWith('/riego')) {
        return {
            title: 'Planificacion de Riego',
            subtitle: 'KPIs, alertas y ejecucion hidrica por lote.',
            badge: 'Riego inteligente',
        };
    }
    if (pathname.startsWith('/scouting')) {
        return {
            title: 'Scouting',
            subtitle: 'Observaciones de campo y seguimiento georreferenciado.',
            badge: 'Campo + IA',
        };
    }
    return {
        title: 'Panel SIG Agro',
        subtitle: 'Workspace operativo con accesos y contexto unificado.',
        badge: 'Vista ejecutiva',
    };
}
