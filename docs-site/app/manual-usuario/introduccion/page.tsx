import { Leaf, Users, MapPin, Calendar } from 'lucide-react'

export default function IntroduccionPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                            <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Introducción a SIG Agro
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Bienvenido al Sistema de Información y Gestión Agropecuaria
                            </p>
                        </div>
                    </div>
                </div>

                {/* ¿Qué es SIG Agro? */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🌾 ¿Qué es SIG Agro?
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            <strong>SIG Agro</strong> es una plataforma web integral para la gestión de establecimientos
                            agropecuarios que te permite:
                        </p>
                        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span><strong>Organizar tus campos y lotes</strong> con mapas interactivos y datos geográficos</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span><strong>Planificar campañas agrícolas</strong> por cultivo y ciclo productivo</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span><strong>Registrar todas las labores</strong> (siembra, fertilización, pulverización, cosecha)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span><strong>Visualizar métricas</strong> de rendimiento, producción y actividad</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span><strong>Mantener trazabilidad completa</strong> de productos aplicados y condiciones</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Conceptos Clave */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🔑 Conceptos Clave
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Campo
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Establecimiento agrícola completo. Puede contener múltiples lotes.
                                Ejemplo: "Campo Los Algarrobos" de 500 hectáreas.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Lote
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Subdivisión productiva de un campo con polígono GIS definido.
                                Ejemplo: "Lote 1" de 50 hectáreas dentro del campo.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Campaña
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Ciclo productivo completo de un cultivo en un lote.
                                Ejemplo: "Soja 2024/2025" desde siembra hasta cosecha.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                    <Leaf className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Labor
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Evento o actividad agrícola registrada (siembra, fertilización, etc.).
                                Incluye productos, dosis y condiciones climáticas.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Flujo de Trabajo */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🔄 Flujo de Trabajo Típico
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Crear Campo
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Define tu establecimiento con nombre, ubicación y superficie total.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Subdividir en Lotes
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Crea lotes productivos con polígonos en el mapa. Define características del suelo.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Planificar Campaña
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Crea una campaña para cada lote: define cultivo, variedad y fechas estimadas.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    4
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Registrar Labores
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        A medida que trabajas, registra siembras, aplicaciones, riegos y cosechas.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    5
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        Analizar Resultados
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Usa el dashboard para ver rendimientos, comparar campañas y tomar decisiones.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Beneficios */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ✨ Beneficios de Usar SIG Agro
                    </h2>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <div className="grid md:grid-cols-2 gap-4">
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">📊</span>
                                    <span>Toma decisiones basadas en datos históricos</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">🗺️</span>
                                    <span>Visualiza tus lotes en mapas interactivos</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">📝</span>
                                    <span>Mantén trazabilidad completa de insumos</span>
                                </li>
                            </ul>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">⏱️</span>
                                    <span>Ahorra tiempo con registros digitales</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">📈</span>
                                    <span>Compara rendimientos entre campañas</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-600 mr-2">☁️</span>
                                    <span>Accede desde cualquier dispositivo</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Próximos Pasos */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🚀 Próximos Pasos
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Ahora que conoces los conceptos básicos, explora los módulos:
                        </p>
                        <div className="grid md:grid-cols-2 gap-3">
                            <a href="/manual-usuario/modulos/campos" className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                                <h3 className="font-semibold text-green-700 dark:text-green-400 mb-1">
                                    Campos y Lotes →
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Aprende a crear y gestionar tus establecimientos
                                </p>
                            </a>
                            <a href="/manual-usuario/modulos/campanias" className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                    Campañas →
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Planifica tus ciclos productivos
                                </p>
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
