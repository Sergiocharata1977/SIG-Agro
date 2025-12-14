import { ArrowRight, Book, Code, FileText, Github, Leaf, MapPin, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 md:py-32">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-block mb-6 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full">
                        <span className="text-green-700 dark:text-green-300 font-semibold text-sm">
                            Documentación Oficial
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
                        SIG Agro
                        <span className="block text-green-600 dark:text-green-400 mt-2">
                            Documentación
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
                        Todo lo que necesitas saber para usar y desarrollar con SIG Agro,
                        el Sistema de Información y Gestión Agropecuaria.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/manual-usuario"
                            className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
                        >
                            <Book className="w-5 h-5 mr-2" />
                            Manual de Usuario
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            href="/manual-programador"
                            className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
                        >
                            <Code className="w-5 h-5 mr-2" />
                            Manual de Programadores
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="container mx-auto px-4 py-20">
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Manual de Usuario */}
                    <Link href="/manual-usuario" className="group">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500">
                            <div className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Book className="w-7 h-7 text-green-600 dark:text-green-400" />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Manual de Usuario
                            </h3>

                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Aprende a gestionar campos, lotes, campañas agrícolas y labores culturales.
                            </p>

                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                                    Gestión de campos y lotes
                                </li>
                                <li className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                                    Campañas y ciclos agrícolas
                                </li>
                                <li className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                                    Labores y eventos
                                </li>
                                <li className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                                    Métricas y reportes
                                </li>
                            </ul>
                        </div>
                    </Link>

                    {/* Manual de Programadores */}
                    <Link href="/manual-programador" className="group">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500">
                            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Code className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Manual de Programadores
                            </h3>

                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Documentación técnica completa para desarrolladores que trabajan con SIG Agro.
                            </p>

                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                    Arquitectura del sistema
                                </li>
                                <li className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                    Multi-tenancy con Firebase
                                </li>
                                <li className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                    Servicios y APIs
                                </li>
                                <li className="flex items-center">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                    Componentes GIS
                                </li>
                            </ul>
                        </div>
                    </Link>

                    {/* Recursos Adicionales */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 shadow-lg border border-green-200 dark:border-green-800">
                        <div className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-6">
                            <Leaf className="w-7 h-7 text-green-600 dark:text-green-400" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Recursos
                        </h3>

                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Recursos adicionales y enlaces útiles para aprovechar al máximo SIG Agro.
                        </p>

                        <div className="space-y-3">
                            <a
                                href="https://github.com/Sergiocharata1977/SIG-Agro"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                            >
                                <Github className="w-4 h-4 mr-2" />
                                Repositorio GitHub
                            </a>

                            <Link
                                href="/manual-usuario/introduccion"
                                className="flex items-center text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Primeros Pasos
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Links */}
            <section className="container mx-auto px-4 py-20 border-t border-gray-200 dark:border-gray-700">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                        Accesos Rápidos
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <Link
                            href="/manual-usuario/modulos/campos"
                            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-all group"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400">
                                Gestión de Campos →
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Administra establecimientos y lotes agrícolas
                            </p>
                        </Link>

                        <Link
                            href="/manual-usuario/modulos/campanias"
                            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-all group"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400">
                                Campañas Agrícolas →
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Planifica y gestiona ciclos productivos
                            </p>
                        </Link>

                        <Link
                            href="/manual-usuario/modulos/labores"
                            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-all group"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400">
                                Labores Culturales →
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Registra siembras, aplicaciones y cosechas
                            </p>
                        </Link>

                        <Link
                            href="/manual-programador/arquitectura"
                            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
                        >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                Arquitectura del Sistema →
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Entiende cómo está construido SIG Agro
                            </p>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
