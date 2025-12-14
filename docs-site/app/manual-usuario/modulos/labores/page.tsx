import { Sprout, Droplets, Bug, Tractor, Wheat } from 'lucide-react'

export default function LaboresModulo() {
    const tiposLabor = [
        { icon: '🌱', nombre: 'Siembra', color: 'green', descripcion: 'Implantación del cultivo' },
        { icon: '🧪', nombre: 'Fertilización', color: 'blue', descripcion: 'Aplicación de nutrientes' },
        { icon: '💨', nombre: 'Pulverización', color: 'purple', descripcion: 'Control de malezas y plagas' },
        { icon: '🚜', nombre: 'Laboreo', color: 'amber', descripcion: 'Preparación del suelo' },
        { icon: '💧', nombre: 'Riego', color: 'cyan', descripcion: 'Aporte de agua' },
        { icon: '🌾', nombre: 'Cosecha', color: 'yellow', descripcion: 'Recolección del cultivo' },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center">
                            <Sprout className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Labores Culturales
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Registra todas las actividades agrícolas de tus lotes
                            </p>
                        </div>
                    </div>
                </div>

                {/* Introducción */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🌾 ¿Qué son las Labores?
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Las <strong>labores culturales</strong> son todas las actividades que realizas en tus lotes durante una campaña. El sistema te permite registrar:
                        </p>
                        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">•</span>
                                <span><strong>Tipo de labor:</strong> Siembra, fertilización, pulverización, etc.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">•</span>
                                <span><strong>Productos aplicados:</strong> Insumos, dosis y costos</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">•</span>
                                <span><strong>Condiciones climáticas:</strong> Temperatura, humedad, viento</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">•</span>
                                <span><strong>Documentación:</strong> Fotos y observaciones</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Tipos de Labores */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📋 Tipos de Labores
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {tiposLabor.map((labor) => (
                            <div
                                key={labor.nombre}
                                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl">{labor.icon}</span>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {labor.nombre}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {labor.descripcion}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Registrar Labor */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ➕ Registrar una Labor
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <ol className="space-y-4 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="font-bold text-emerald-600 mr-3">1.</span>
                                <div>
                                    <p className="font-semibold mb-1">Accede a la campaña</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Ve a "Campañas" y selecciona la campaña activa del lote
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-emerald-600 mr-3">2.</span>
                                <div>
                                    <p className="font-semibold mb-1">Haz clic en "Nueva Labor"</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Se abrirá el formulario de registro
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-emerald-600 mr-3">3.</span>
                                <div>
                                    <p className="font-semibold mb-1">Selecciona el tipo de labor</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Elige entre siembra, fertilización, pulverización, etc.
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-emerald-600 mr-3">4.</span>
                                <div>
                                    <p className="font-semibold mb-1">Completa los datos</p>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1 ml-4">
                                        <li>• Fecha y hora de la labor</li>
                                        <li>• Superficie aplicada (ha)</li>
                                        <li>• Productos utilizados (si aplica)</li>
                                        <li>• Condiciones climáticas</li>
                                    </ul>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-emerald-600 mr-3">5.</span>
                                <div>
                                    <p className="font-semibold mb-1">Agrega documentación (opcional)</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Sube fotos y añade observaciones relevantes
                                    </p>
                                </div>
                            </li>
                        </ol>
                    </div>
                </section>

                {/* Productos Aplicados */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🧪 Registrar Productos Aplicados
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                <strong>📌 Importante:</strong> Para fertilizaciones y pulverizaciones, registra los productos aplicados para trazabilidad completa.
                            </p>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Para cada producto aplicado, registra:
                        </p>
                        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">•</span>
                                <span><strong>Nombre del producto:</strong> Ej: "Glifosato", "Urea Granulada"</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">•</span>
                                <span><strong>Marca comercial:</strong> (opcional)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">•</span>
                                <span><strong>Dosis:</strong> Cantidad aplicada</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">•</span>
                                <span><strong>Unidad:</strong> lt/ha, kg/ha, dosis/ha</span>
                            </li>
                        </ul>

                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Ejemplo: Aplicación de herbicida
                            </p>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• Producto: Glifosato 48%</li>
                                <li>• Dosis: 3 lt/ha</li>
                                <li>• Superficie: 50 ha</li>
                                <li>• Total aplicado: 150 litros</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Condiciones Climáticas */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🌤️ Condiciones Climáticas
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Registrar las condiciones climáticas es especialmente importante para aplicaciones:
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Temperatura</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Registra en °C para evaluar eficacia de productos
                                </p>
                            </div>
                            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Humedad</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Porcentaje de humedad relativa del ambiente
                                </p>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Viento</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Velocidad en km/h - crítico para pulverizaciones
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tips */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        💡 Mejores Prácticas
                    </h2>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
                        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">✓</span>
                                <span>Registra las labores el mismo día que las realizas</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">✓</span>
                                <span>Toma fotos antes y después de aplicaciones importantes</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">✓</span>
                                <span>Verifica condiciones climáticas antes de pulverizar (viento \u003c 15 km/h)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">✓</span>
                                <span>Registra dosis exactas para cálculo de costos y trazabilidad</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-emerald-600 mr-2">✓</span>
                                <span>Usa observaciones para notar problemas o resultados destacados</span>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    )
}
