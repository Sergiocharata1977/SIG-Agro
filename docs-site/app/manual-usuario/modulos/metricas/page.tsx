import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react'

export default function MetricasModulo() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Métricas y Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Visualiza indicadores y reportes de tu producción
                            </p>
                        </div>
                    </div>
                </div>

                {/* Introducción */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📊 Dashboard Principal
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            El dashboard de SIG Agro te proporciona una vista consolidada de:
                        </p>
                        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">•</span>
                                <span><strong>Superficie total:</strong> Hectáreas de campos y lotes</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">•</span>
                                <span><strong>Campañas activas:</strong> Cultivos en curso</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">•</span>
                                <span><strong>Rendimientos:</strong> Histórico de producción por cultivo</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">•</span>
                                <span><strong>Labores recientes:</strong> Últimas actividades registradas</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Indicadores Clave */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📈 Indicadores Clave (KPIs)
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Rendimiento Promedio
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Kg/ha promedio por cultivo en las últimas campañas. Permite comparar performance entre ciclos.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <PieChart className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Distribución de Cultivos
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Porcentaje de superficie por tipo de cultivo (Soja, Maíz, Algodón, etc.).
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Labores por Mes
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Cantidad de eventos registrados mensualmente. Identifica picos de actividad.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Producción Total
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Kilogramos totales cosechados por campaña y cultivo.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Reportes */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📋 Reportes Disponibles
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Reporte de Campañas
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Listado completo de campañas con fechas, cultivos, rendimientos y estados.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-700 dark:text-purple-300">
                                    Exportable a PDF
                                </span>
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs text-green-700 dark:text-green-300">
                                    Filtrable por fecha
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Reporte de Labores
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Historial de todas las labores realizadas con productos aplicados y condiciones.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-700 dark:text-purple-300">
                                    Exportable a Excel
                                </span>
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300">
                                    Filtrable por lote
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Análisis de Rendimientos
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Comparativa de rendimientos entre campañas, lotes y cultivos.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-700 dark:text-orange-300">
                                    Gráficos interactivos
                                </span>
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs text-green-700 dark:text-green-300">
                                    Histórico multi-año
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cómo Interpretar */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🎯 Cómo Interpretar las Métricas
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Rendimiento por Hectárea (kg/ha)
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Compara tus rendimientos con promedios regionales. Un rendimiento bajo puede indicar
                                    problemas de suelo, clima o manejo de cultivo.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Frecuencia de Labores
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Identifica si estás aplicando demasiadas o muy pocas labores. Una frecuencia alta
                                    de pulverizaciones puede indicar problemas de plagas.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Tendencias Históricas
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Observa cómo evolucionan tus rendimientos año a año. Tendencias negativas pueden
                                    requerir rotación de cultivos o mejoras en el suelo.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tips */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        💡 Consejos para Usar las Métricas
                    </h2>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Revisa el dashboard semanalmente para detectar problemas temprano</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Compara rendimientos entre lotes para identificar los más productivos</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Usa los reportes para planificar la próxima campaña</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Exporta datos para análisis más profundos en Excel</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Registra todas las labores para que las métricas sean precisas</span>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    )
}
