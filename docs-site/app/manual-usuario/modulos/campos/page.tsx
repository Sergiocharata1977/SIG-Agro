import { MapPin, Plus, Edit, Trash2, Map } from 'lucide-react'

export default function CamposModulo() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Gestión de Campos y Lotes
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Administra tus establecimientos agrícolas y lotes productivos
                            </p>
                        </div>
                    </div>
                </div>

                {/* Introducción */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📍 Introducción
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            El módulo de <strong>Campos y Lotes</strong> es la base del sistema SIG Agro. Aquí defines:
                        </p>
                        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">•</span>
                                <span><strong>Campos (Establecimientos):</strong> Propiedades agrícolas completas con ubicación geográfica</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">•</span>
                                <span><strong>Lotes:</strong> Subdivisiones productivas dentro de cada campo con polígonos GIS</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">•</span>
                                <span><strong>Características del suelo:</strong> Tipo, capacidad de uso y estado actual</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Crear Campo */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ➕ Crear un Campo
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <ol className="space-y-4 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="font-bold text-green-600 mr-3">1.</span>
                                <div>
                                    <p className="font-semibold mb-1">Accede al módulo Campos</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Desde el menú principal, haz clic en "Campos"
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-green-600 mr-3">2.</span>
                                <div>
                                    <p className="font-semibold mb-1">Haz clic en "Nuevo Campo"</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Se abrirá un formulario modal
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-green-600 mr-3">3.</span>
                                <div>
                                    <p className="font-semibold mb-1">Completa los datos básicos</p>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1 ml-4">
                                        <li>• Nombre del campo (ej: "Campo Los Algarrobos")</li>
                                        <li>• Provincia y departamento</li>
                                        <li>• Superficie total en hectáreas</li>
                                    </ul>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-green-600 mr-3">4.</span>
                                <div>
                                    <p className="font-semibold mb-1">Marca la ubicación en el mapa (opcional)</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Puedes definir el perímetro del campo usando el mapa interactivo
                                    </p>
                                </div>
                            </li>
                        </ol>
                    </div>
                </section>

                {/* Crear Lote */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🗺️ Crear un Lote
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>💡 Importante:</strong> Los lotes requieren un polígono GIS para poder crear campañas y registrar labores.
                            </p>
                        </div>

                        <ol className="space-y-4 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="font-bold text-green-600 mr-3">1.</span>
                                <div>
                                    <p className="font-semibold mb-1">Selecciona un campo existente</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Haz clic en el campo donde quieres crear el lote
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-green-600 mr-3">2.</span>
                                <div>
                                    <p className="font-semibold mb-1">Haz clic en "Nuevo Lote"</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Se abrirá el editor de lotes con mapa
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-green-600 mr-3">3.</span>
                                <div>
                                    <p className="font-semibold mb-1">Define el polígono del lote</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Usa las herramientas de dibujo para marcar los límites del lote en el mapa
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="font-bold text-green-600 mr-3">4.</span>
                                <div>
                                    <p className="font-semibold mb-1">Completa información adicional</p>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1 ml-4">
                                        <li>• Nombre del lote (ej: "Lote 1", "Norte")</li>
                                        <li>• Tipo de suelo (arcilloso, franco, etc.)</li>
                                        <li>• Estado actual (barbecho, sembrado, etc.)</li>
                                    </ul>
                                </div>
                            </li>
                        </ol>
                    </div>
                </section>

                {/* Características del Lote */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📊 Características del Lote
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tipos de Suelo</h3>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li>• <strong>Arcilloso:</strong> Retiene agua, pesado</li>
                                    <li>• <strong>Arenoso:</strong> Buen drenaje, ligero</li>
                                    <li>• <strong>Franco:</strong> Equilibrado, ideal</li>
                                    <li>• <strong>Humífero:</strong> Rico en materia orgánica</li>
                                    <li>• <strong>Mixto:</strong> Combinación de tipos</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Estados del Lote</h3>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li>• <strong>Barbecho:</strong> En descanso</li>
                                    <li>• <strong>Sembrado:</strong> Cultivo implantado</li>
                                    <li>• <strong>Desarrollo:</strong> Cultivo en crecimiento</li>
                                    <li>• <strong>Cosecha:</strong> Listo para cosechar</li>
                                    <li>• <strong>Descanso:</strong> Post-cosecha</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tips */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        💡 Consejos Útiles
                    </h2>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Usa nombres descriptivos para tus lotes (ej: "Lote Norte", "Bajo Riego")</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Define polígonos precisos para cálculos exactos de superficie</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Actualiza el estado del lote después de cada campaña</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Registra características del suelo para mejores recomendaciones</span>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    )
}
