'use client';

import { useState, useEffect } from 'react';
import { dashboardIAService } from '@/services/dashboard-ia';
import type { DashboardIAData, AlertaIA, RecomendacionIA } from '@/types/dashboard-ia';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/layout/PageShell';
import { BaseButton } from '@/components/design-system';

// Iconos usando emojis para simplicidad
const ICONS = {
    alerta: '⚠️',
    recomendacion: '💡',
    prediccion: '📊',
    ndvi: '🌿',
    plaga: '🐛',
    clima: '🌤️',
    estres: '💧',
    fertilizacion: '🌱',
    cosecha: '🌾',
};

export default function DashboardIAPage() {
    const [data, setData] = useState<DashboardIAData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'resumen' | 'alertas' | 'recomendaciones' | 'predicciones'>('resumen');
    const { organization } = useAuth();

    useEffect(() => {
        loadData();
    }, [organization]);

    const loadData = async () => {
        try {
            setLoading(true);
            const result = await dashboardIAService.getDashboardData(organization?.id || '');
            setData(result);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No hay datos disponibles</p>
            </div>
        );
    }

    return (
        <PageShell
            title="Dashboard de Analisis IA"
            subtitle="Analisis inteligente de tus cultivos"
            rightSlot={<BaseButton onClick={loadData}>Actualizar</BaseButton>}
        >

            {/* Resumen Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                    title="Análisis Totales"
                    value={data.resumen.totalAnalisis}
                    icon="📊"
                    color="blue"
                />
                <SummaryCard
                    title="Alertas Activas"
                    value={data.resumen.alertasActivas}
                    icon="⚠️"
                    color="red"
                />
                <SummaryCard
                    title="Predicciones"
                    value={data.resumen.prediccionesRecientes}
                    icon="🎯"
                    color="green"
                />
                <SummaryCard
                    title="Confianza Promedio"
                    value={`${(data.resumen.confianzaPromedio * 100).toFixed(0)}%`}
                    icon="✅"
                    color="purple"
                />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                    {[
                        { key: 'resumen', label: 'Resumen' },
                        { key: 'alertas', label: `Alertas (${data.alertas.length})` },
                        { key: 'recomendaciones', label: `Recomendaciones (${data.recomendaciones.length})` },
                        { key: 'predicciones', label: `Predicciones (${data.predicciones.length})` },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={`py-3 px-4 border-b-2 font-medium text-sm transition ${activeTab === tab.key
                                    ? 'border-green-600 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'resumen' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Tendencia NDVI */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">🌿 Tendencia NDVI (30 días)</h3>
                            <div className="h-48 flex items-end gap-1">
                                {data.tendenciasNDVI.map((point, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-green-500 rounded-t transition-all hover:bg-green-600"
                                        style={{ height: `${point.promedio * 100}%` }}
                                        title={`${point.fecha}: ${point.promedio.toFixed(2)}`}
                                    />
                                ))}
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-gray-500">
                                <span>{data.tendenciasNDVI[0]?.fecha}</span>
                                <span>{data.tendenciasNDVI[data.tendenciasNDVI.length - 1]?.fecha}</span>
                            </div>
                        </div>

                        {/* Actividad Reciente */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">📋 Actividad Reciente</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {data.analisisRecientes.slice(0, 5).map((item) => (
                                    <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <span className="text-xl">{ICONS[item.type]}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {item.loteName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(item.timestamp).toLocaleString('es-AR')}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${item.confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                                                item.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {(item.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'alertas' && (
                    <div className="space-y-4">
                        {data.alertas.map((alerta) => (
                            <AlertCard key={alerta.id} alerta={alerta} />
                        ))}
                    </div>
                )}

                {activeTab === 'recomendaciones' && (
                    <div className="space-y-4">
                        {data.recomendaciones.map((rec) => (
                            <RecommendationCard key={rec.id} recomendacion={rec} />
                        ))}
                    </div>
                )}

                {activeTab === 'predicciones' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.predicciones.map((pred) => (
                            <div key={pred.id} className="bg-white rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-900">{pred.loteName}</h4>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        {pred.data.cultivo}
                                    </span>
                                </div>
                                <div className="text-center py-4">
                                    <p className="text-4xl font-bold text-green-600">
                                        {pred.data.rendimientoEstimado.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-500">kg/ha estimado</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Rango: {pred.data.rendimientoMinimo.toLocaleString()} - {pred.data.rendimientoMaximo.toLocaleString()}
                                    </p>
                                </div>
                                <div className="border-t pt-4 mt-4">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Cosecha estimada:</span> {pred.data.fechaEstimada}
                                    </p>
                                    {pred.data.factoresRiesgo.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs text-red-600">⚠️ Factores de riesgo:</p>
                                            <ul className="text-xs text-gray-500 mt-1">
                                                {pred.data.factoresRiesgo.map((f, i) => (
                                                    <li key={i}>• {f}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageShell>
    );
}

// Componentes auxiliares
function SummaryCard({ title, value, icon, color }: {
    title: string;
    value: string | number;
    icon: string;
    color: 'blue' | 'red' | 'green' | 'purple';
}) {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200',
        red: 'bg-red-50 border-red-200',
        green: 'bg-green-50 border-green-200',
        purple: 'bg-purple-50 border-purple-200',
    };

    return (
        <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-600">{title}</p>
                </div>
            </div>
        </div>
    );
}

function AlertCard({ alerta }: { alerta: AlertaIA }) {
    const severityColors = {
        critica: 'bg-red-50 border-red-300',
        alta: 'bg-orange-50 border-orange-300',
        media: 'bg-yellow-50 border-yellow-300',
        baja: 'bg-blue-50 border-blue-300',
    };

    return (
        <div className={`rounded-xl border p-4 ${severityColors[alerta.data.severidad]}`}>
            <div className="flex items-start gap-4">
                <span className="text-2xl">{ICONS[alerta.data.tipoAlerta] || '⚠️'}</span>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">{alerta.loteName}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full uppercase font-medium ${alerta.data.severidad === 'critica' ? 'bg-red-200 text-red-800' :
                                alerta.data.severidad === 'alta' ? 'bg-orange-200 text-orange-800' :
                                    alerta.data.severidad === 'media' ? 'bg-yellow-200 text-yellow-800' :
                                        'bg-blue-200 text-blue-800'
                            }`}>
                            {alerta.data.severidad}
                        </span>
                    </div>
                    <p className="text-gray-700 mt-1">{alerta.data.descripcion}</p>
                    {alerta.data.areaAfectada && (
                        <p className="text-sm text-gray-500 mt-1">
                            Área afectada: {alerta.data.areaAfectada} ha
                        </p>
                    )}
                    <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Acciones recomendadas:</p>
                        <ul className="mt-1 space-y-1">
                            {alerta.data.accionesRecomendadas.map((accion, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-green-500">→</span> {accion}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RecommendationCard({ recomendacion }: { recomendacion: RecomendacionIA }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-start gap-4">
                <span className="text-2xl">{ICONS[recomendacion.data.categoria] || '💡'}</span>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">{recomendacion.data.titulo}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${recomendacion.data.urgencia === 'alta' ? 'bg-red-100 text-red-700' :
                                recomendacion.data.urgencia === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                            }`}>
                            Urgencia: {recomendacion.data.urgencia}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{recomendacion.loteName}</p>
                    <p className="text-gray-700 mt-2">{recomendacion.data.descripcion}</p>
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Acciones:</p>
                        <ul className="mt-1 space-y-1">
                            {recomendacion.data.acciones.map((accion, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-green-500">✓</span> {accion}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {recomendacion.data.impactoEstimado && (
                        <p className="text-sm text-green-600 mt-2 font-medium">
                            📈 {recomendacion.data.impactoEstimado}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
