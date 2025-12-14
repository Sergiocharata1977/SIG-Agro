import { Code, Database, Layers, GitBranch } from 'lucide-react'
import Link from 'next/link'

export default function ManualProgramador() {
    const sections = [
        {
            icon: Layers,
            title: 'Arquitectura',
            description: 'Estructura del proyecto, tecnologías y patrones de diseño',
            href: '/manual-programador/arquitectura',
            color: 'blue',
        },
        {
            icon: Database,
            title: 'Firebase y Multi-tenancy',
            description: 'Configuración de Firestore, reglas de seguridad y estructura de datos',
            href: '/manual-programador/firebase',
            color: 'orange',
        },
        {
            icon: Code,
            title: 'Servicios y APIs',
            description: 'Servicios de campos, lotes, campañas y labores agrícolas',
            href: '/manual-programador/servicios',
            color: 'purple',
        },
        {
            icon: GitBranch,
            title: 'Componentes',
            description: 'Componentes React, mapas GIS y formularios',
            href: '/manual-programador/componentes',
            color: 'green',
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                            <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                            Manual de Programadores
                        </h1>
                    </div>

                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                        Documentación técnica completa para desarrolladores que trabajan con SIG Agro.
                        Aprende sobre la arquitectura, servicios, componentes y mejores prácticas.
                    </p>
                </div>

                {/* Tech Stack */}
                <div className="max-w-4xl mx-auto mb-12">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            🛠️ Stack Tecnológico
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Frontend</h3>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                        Next.js 15 (App Router)
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                        React 18 + TypeScript
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                        Tailwind CSS
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                        Leaflet (Mapas GIS)
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Backend</h3>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                                        Firebase Authentication
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                                        Cloud Firestore
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                                        Firebase Storage
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                                        Multi-tenant Architecture
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sections Grid */}
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                        Secciones Técnicas
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {sections.map((section) => {
                            const Icon = section.icon
                            return (
                                <Link
                                    key={section.title}
                                    href={section.href}
                                    className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
                                >
                                    <div className={`w-14 h-14 bg-${section.color}-100 dark:bg-${section.color}-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-7 h-7 text-${section.color}-600 dark:text-${section.color}-400`} />
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {section.title}
                                    </h3>

                                    <p className="text-gray-600 dark:text-gray-400">
                                        {section.description}
                                    </p>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="max-w-4xl mx-auto mt-12">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Enlaces Rápidos
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Link
                                href="/manual-programador/arquitectura"
                                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all"
                            >
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Arquitectura del Sistema →
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Estructura de carpetas y componentes
                                </p>
                            </Link>

                            <Link
                                href="/manual-programador/firebase"
                                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all"
                            >
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Configuración Firebase →
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Reglas de seguridad y colecciones
                                </p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
