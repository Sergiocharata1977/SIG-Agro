import { Leaf, MapPin, Calendar, Sprout, TrendingUp, FileText } from 'lucide-react'
import Link from 'next/link'

export default function ManualUsuario() {
    const modules = [
        {
            icon: MapPin,
            title: 'Campos y Lotes',
            description: 'Gestión de establecimientos agrícolas y subdivisión en lotes productivos',
            href: '/manual-usuario/modulos/campos',
            color: 'green',
        },
        {
            icon: Calendar,
            title: 'Campañas Agrícolas',
            description: 'Planificación y seguimiento de ciclos productivos por cultivo',
            href: '/manual-usuario/modulos/campanias',
            color: 'blue',
        },
        {
            icon: Sprout,
            title: 'Labores Culturales',
            description: 'Registro de siembras, aplicaciones, fertilizaciones y cosechas',
            href: '/manual-usuario/modulos/labores',
            color: 'emerald',
        },
        {
            icon: TrendingUp,
            title: 'Métricas y Dashboard',
            description: 'Indicadores productivos, rendimientos y análisis de gestión',
            href: '/manual-usuario/modulos/metricas',
            color: 'purple',
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                            <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                            Manual de Usuario
                        </h1>
                    </div>

                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                        Aprende a utilizar todas las funcionalidades de SIG Agro para gestionar
                        tu producción agrícola de manera eficiente y profesional.
                    </p>
                </div>

                {/* Quick Start */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            🚀 Inicio Rápido
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <Link
                                href="/manual-usuario/introduccion"
                                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group"
                            >
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400">
                                    Introducción →
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    ¿Qué es SIG Agro y cómo empezar?
                                </p>
                            </Link>

                            <Link
                                href="/manual-usuario/primeros-pasos"
                                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group"
                            >
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400">
                                    Primeros Pasos →
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Configura tu primer campo y campaña
                                </p>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                        Módulos del Sistema
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {modules.map((module) => {
                            const Icon = module.icon
                            return (
                                <Link
                                    key={module.title}
                                    href={module.href}
                                    className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500"
                                >
                                    <div className={`w-14 h-14 bg-${module.color}-100 dark:bg-${module.color}-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-7 h-7 text-${module.color}-600 dark:text-${module.color}-400`} />
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                        {module.title}
                                    </h3>

                                    <p className="text-gray-600 dark:text-gray-400">
                                        {module.description}
                                    </p>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Additional Resources */}
                <div className="max-w-4xl mx-auto mt-12">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-800">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            ¿Necesitas ayuda?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Consulta nuestras guías paso a paso y casos de uso prácticos
                            para resolver dudas comunes sobre gestión agrícola.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/manual-usuario/casos-uso"
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Casos de Uso
                            </Link>
                            <Link
                                href="/manual-usuario/faq"
                                className="px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
                            >
                                Preguntas Frecuentes
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
