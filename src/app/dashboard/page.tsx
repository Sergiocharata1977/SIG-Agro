'use client';

/**
 * Dashboard Principal - SIG Agro
 * Sidebar + Mapa + Panel de Alertas/KPIs
 * Integrado con nuevas colecciones fields/plots/crops
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import type { Field, Plot, Crop } from '@/types/sig-agro';
import type { Alert } from '@/types/sig-agro-advanced';
import { obtenerFields } from '@/services/fields';
import { obtenerPlots } from '@/services/plots';
import { obtenerCrops, getCampaniaActual } from '@/services/crops';
import { obtenerAlertas, obtenerConteoNoLeidas } from '@/services/alerts';
import { CULTIVOS_CONFIG, ESTADOS_LOTE_CONFIG } from '@/types/sig-agro';
import { TIPOS_ALERTA_CONFIG, SEVERIDAD_CONFIG } from '@/types/sig-agro-advanced';

// Importar mapa dinámicamente
const MapaGeneral = dynamic(
    () => import('@/components/mapa/MapaGeneral'),
    {
        ssr: false,
        loading: () => (
            <div className="h-full bg-gray-200 animate-pulse flex items-center justify-center">
                <span className="text-gray-500">Cargando mapa...</span>
            </div>
        )
    }
);

// KPI Card
function KPICard({ icon, label, value, subvalue, color }: {
    icon: string;
    label: string;
    value: string | number;
    subvalue?: string;
    color?: string;
}) {
    return (
        <div className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${color || 'border-green-500'}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{icon}</span>
                <span className="text-sm text-gray-600">{label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {subvalue && <div className="text-xs text-gray-500 mt-1">{subvalue}</div>}
        </div>
    );
}

// Panel de Alertas
function AlertasPanel({ alertas, onVerTodas }: {
    alertas: Alert[];
    onVerTodas: () => void;
}) {
    if (alertas.length === 0) {
        return (
            <div className="bg-green-50 rounded-lg p-4 text-center">
                <span className="text-3xl">✅</span>
                <p className="text-green-700 mt-2 text-sm">Sin alertas activas</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm">
            <div className="p-3 border-b flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Alertas Recientes</h3>
                <button
                    onClick={onVerTodas}
                    className="text-sm text-green-600 hover:underline"
                >
                    Ver todas
                </button>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto">
                {alertas.slice(0, 5).map(alerta => {
                    const config = TIPOS_ALERTA_CONFIG[alerta.tipo];
                    const severidad = SEVERIDAD_CONFIG[alerta.severidad];
                    return (
                        <div key={alerta.id} className={`p-3 ${severidad.bgColor}`}>
                            <div className="flex items-start gap-2">
                                <span className="text-lg">{config.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">
                                        {alerta.titulo}
                                    </p>
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                        {alerta.descripcion}
                                    </p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded ${severidad.color} ${severidad.bgColor}`}>
                                    {severidad.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Cultivos Activos Card
function CultivosActivosCard({ crops }: { crops: Crop[] }) {
    const porCultivo: Record<string, number> = {};
    crops.forEach(c => {
        porCultivo[c.cultivo] = (porCultivo[c.cultivo] || 0) + 1;
    });

    return (
        <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-3">Cultivos Campaña {getCampaniaActual()}</h3>
            <div className="space-y-2">
                {Object.entries(porCultivo).map(([cultivo, cantidad]) => {
                    const config = CULTIVOS_CONFIG[cultivo as keyof typeof CULTIVOS_CONFIG] || CULTIVOS_CONFIG.otro;
                    return (
                        <div key={cultivo} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span>{config.icon}</span>
                                <span className="text-sm">{config.label}</span>
                            </div>
                            <span className={`text-sm px-2 py-0.5 rounded ${config.color}`}>
                                {cantidad} lote{cantidad > 1 ? 's' : ''}
                            </span>
                        </div>
                    );
                })}
                {Object.keys(porCultivo).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                        Sin cultivos registrados
                    </p>
                )}
            </div>
        </div>
    );
}

// Header
function DashboardHeader({
    field,
    fields,
    onFieldChange,
    alertasNoLeidas
}: {
    field: Field | null;
    fields: Field[];
    onFieldChange: (id: string) => void;
    alertasNoLeidas: number;
}) {
    const { user } = useAuth();

    return (
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-green-600">📍</span>
                    <div>
                        <span className="font-semibold text-gray-900">
                            {field?.nombre || 'Sin campo seleccionado'}
                        </span>
                        {field && (
                            <span className="text-sm text-gray-500 ml-2">
                                {field.departamento}, {field.provincia} • {field.superficieTotal} ha
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Badge de alertas */}
                {alertasNoLeidas > 0 && (
                    <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded">
                        <span>🔔</span>
                        <span className="text-sm font-medium">{alertasNoLeidas}</span>
                    </div>
                )}

                {/* Selector de campo */}
                <select
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
                    value={field?.id || ''}
                    onChange={(e) => onFieldChange(e.target.value)}
                >
                    <option value="" disabled>Seleccionar campo</option>
                    {fields.map(f => (
                        <option key={f.id} value={f.id}>{f.nombre}</option>
                    ))}
                </select>

                {/* Usuario */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
}

// Dashboard Page
export default function DashboardPage() {
    const { firebaseUser, user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Estados
    const [fields, setFields] = useState<Field[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [crops, setCrops] = useState<Crop[]>([]);
    const [alertas, setAlertas] = useState<Alert[]>([]);
    const [alertasNoLeidas, setAlertasNoLeidas] = useState(0);

    const [fieldActual, setFieldActual] = useState<Field | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    // Redirección
    useEffect(() => {
        if (authLoading) return;
        if (!firebaseUser) {
            router.push('/auth/login');
            return;
        }
        if (user?.role === 'super_admin') {
            router.push('/super-admin/organizaciones');
        }
    }, [firebaseUser, user, authLoading, router]);

    // Cargar datos
    useEffect(() => {
        const loadData = async () => {
            if (!user?.organizationId) return;

            try {
                setLoadingData(true);
                const orgId = user.organizationId;

                // Cargar en paralelo
                const [fieldsData, plotsData, cropsData, alertasData] = await Promise.all([
                    obtenerFields(orgId, { activo: true }),
                    obtenerPlots(orgId, { activo: true }),
                    obtenerCrops(orgId, { campania: getCampaniaActual() }),
                    obtenerAlertas(orgId, { soloNoResueltas: true, limite: 10 })
                ]);

                setFields(fieldsData);
                setPlots(plotsData);
                setCrops(cropsData);
                setAlertas(alertasData);

                // Contar no leídas
                const noLeidas = await obtenerConteoNoLeidas(orgId);
                setAlertasNoLeidas(noLeidas);

                // Seleccionar primer campo
                if (fieldsData.length > 0) {
                    setFieldActual(fieldsData[0]);
                }
            } catch (error) {
                console.error('Error cargando datos:', error);
            } finally {
                setLoadingData(false);
            }
        };

        if (!authLoading && user?.organizationId) {
            loadData();
        }
    }, [authLoading, user?.organizationId]);

    // Handler cambio de campo
    const handleFieldChange = (fieldId: string) => {
        const selected = fields.find(f => f.id === fieldId);
        if (selected) setFieldActual(selected);
    };

    // Filtrar plots del campo actual
    const plotsDelCampo = fieldActual
        ? plots.filter(p => p.fieldId === fieldActual.id)
        : plots;

    // Loading
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center animate-pulse">
                        <span className="text-2xl">🌾</span>
                    </div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!firebaseUser) return null;

    // Calcular KPIs
    const superficieTotal = fields.reduce((acc, f) => acc + (f.superficieTotal || 0), 0);
    const lotesSembrados = plots.filter(p => ['sembrado', 'desarrollo', 'floracion'].includes(p.estado)).length;

    return (
        <div className="h-screen flex overflow-hidden bg-gray-100">
            {/* Sidebar */}
            <Sidebar />

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <DashboardHeader
                    field={fieldActual}
                    fields={fields}
                    onFieldChange={handleFieldChange}
                    alertasNoLeidas={alertasNoLeidas}
                />

                {/* Contenido: Mapa + Panel lateral */}
                <div className="flex-1 flex overflow-hidden p-4 gap-4">
                    {/* Mapa (70%) */}
                    <div className="flex-[7] rounded-xl overflow-hidden shadow-lg border border-gray-200">
                        {loadingData ? (
                            <div className="h-full bg-gray-200 animate-pulse flex items-center justify-center">
                                <span className="text-gray-500">Cargando mapa...</span>
                            </div>
                        ) : (
                            <MapaGeneral
                                campos={fields as any}
                                lotes={plotsDelCampo as any}
                                onCampoClick={(c) => console.log('Campo:', c)}
                                onLoteClick={(l) => router.push(`/campos/${fieldActual?.id}/lotes/${l.id}`)}
                            />
                        )}
                    </div>

                    {/* Panel lateral (30%) */}
                    <div className="flex-[3] flex flex-col gap-4 overflow-y-auto">
                        {/* KPIs */}
                        <div className="grid grid-cols-2 gap-3">
                            <KPICard
                                icon="🏞️"
                                label="Campos"
                                value={fields.length}
                                subvalue={`${superficieTotal.toLocaleString()} ha`}
                                color="border-green-500"
                            />
                            <KPICard
                                icon="📍"
                                label="Lotes"
                                value={plots.length}
                                subvalue={`${lotesSembrados} sembrados`}
                                color="border-blue-500"
                            />
                            <KPICard
                                icon="🌱"
                                label="Cultivos"
                                value={crops.length}
                                subvalue={getCampaniaActual()}
                                color="border-amber-500"
                            />
                            <KPICard
                                icon="🔔"
                                label="Alertas"
                                value={alertasNoLeidas}
                                subvalue={alertasNoLeidas > 0 ? 'Sin leer' : 'Todo OK'}
                                color={alertasNoLeidas > 0 ? 'border-red-500' : 'border-green-500'}
                            />
                        </div>

                        {/* Cultivos activos */}
                        <CultivosActivosCard crops={crops} />

                        {/* Alertas */}
                        <AlertasPanel
                            alertas={alertas}
                            onVerTodas={() => router.push('/alertas')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
