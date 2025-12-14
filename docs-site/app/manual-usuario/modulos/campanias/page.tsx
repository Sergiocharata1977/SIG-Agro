import { Calendar, Sprout, TrendingUp } from 'lucide-react'

export default function CampaniasModulo() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Campañas Agrícolas
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Planifica y gestiona tus ciclos productivos
                            </p>
                        </div>
                    </div>
                </div>

                {/* Introducción */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🌱 ¿Qué es una Campaña?
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Una <strong>campaña agrícola</strong> representa un ciclo productivo completo de un cultivo en un lote específico. Incluye:
                        </p>
                        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span><strong>Cultivo y variedad:</strong> Qué vas a sembrar (ej: Soja DM 46i17)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span><strong>Fechas:</strong> Inicio, siembra, cosecha prevista</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span><strong>Datos productivos:</strong> Densidad, rendimiento, producción</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span><strong>Seguimiento:</strong> Estado actual y observaciones</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Crear Campaña */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ➕ Crear una Campaña
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <ol className="space-y-4 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="font-bold text-blue-600 mr-3">1.</span>
                                <div>
                                    <p className="font-semibold mb-1">Selecciona el lote</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Ve a "Campos" y selecciona el lote donde quieres crear la campaña
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-blue-600 mr-3">2.</span>
                                <div>
                                    <p className="font-semibold mb-1">Haz clic en "Nueva Campaña"</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Se abrirá el formulario de creación
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-blue-600 mr-3">3.</span>
                                <div>
                                    <p className="font-semibold mb-1">Define el cultivo</p>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1 ml-4">
                                        <li>• Nombre de la campaña (ej: "Soja 2024/2025")</li>
                                        <li>• Cultivo (Soja, Maíz, Algodón, etc.)</li>
                                        <li>• Variedad y tecnología (RR, Bt, Convencional)</li>
                                    </ul>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-blue-600 mr-3">4.</span>
                                <div>
                                    <p className="font-semibold mb-1">Establece fechas</p>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1 ml-4">
                                        <li>• Fecha de inicio de campaña</li>
                                        <li>• Fecha prevista de siembra</li>
                                        <li>• Fecha estimada de cosecha</li>
                                    </ul>
                                </div>
                            </li>
                        </ol>
                    </div>
                </section>

                {/* Estados de Campaña */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📊 Estados de una Campaña
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1 mr-3"></div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Planificada</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Campaña creada pero aún no iniciada
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 mr-3"></div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">En Curso</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Cultivo sembrado y en desarrollo
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3"></div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Finalizada</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Cosecha completada y registrada
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1 mr-3"></div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Cancelada</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Campaña interrumpida o no realizada
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Datos de Siembra y Cosecha */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📈 Registrar Siembra y Cosecha
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                    <Sprout className="w-5 h-5 mr-2 text-green-600" />
                                    Datos de Siembra
                                </h3>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li>• Fecha de siembra real</li>
                                    <li>• Densidad (semillas/m² o kg/ha)</li>
                                    <li>• Distancia entre surcos (cm)</li>
                                    <li>• Superficie sembrada (ha)</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                                    Datos de Cosecha
                                </h3>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li>• Fecha de cosecha</li>
                                    <li>• Rendimiento (kg/ha)</li>
                                    <li>• Producción total (kg)</li>
                                    <li>• Humedad del grano (%)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tips */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        💡 Mejores Prácticas
                    </h2>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">✓</span>
                                <span>Crea campañas al inicio de cada ciclo para mejor planificación</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">✓</span>
                                <span>Actualiza el estado conforme avanza el cultivo</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">✓</span>
                                <span>Registra datos de siembra y cosecha para análisis histórico</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-blue-600 mr-2">✓</span>
                                <span>Usa nombres descriptivos que incluyan cultivo y año (ej: "Soja 2024/2025")</span>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    )
}
