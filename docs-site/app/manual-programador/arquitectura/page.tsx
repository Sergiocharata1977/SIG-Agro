import { Layers, FolderTree, Code2, Database } from 'lucide-react'

export default function ArquitecturaPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Arquitectura del Sistema
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Estructura técnica de SIG Agro
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stack Tecnológico */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🛠️ Stack Tecnológico
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Code2 className="w-5 h-5 mr-2 text-blue-600" />
                                Frontend
                            </h3>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <div>
                                        <strong>Next.js 15</strong> - Framework React con App Router
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <div>
                                        <strong>React 18</strong> - Biblioteca UI con TypeScript
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <div>
                                        <strong>Tailwind CSS</strong> - Estilos utility-first
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <div>
                                        <strong>Leaflet</strong> - Mapas interactivos GIS
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Database className="w-5 h-5 mr-2 text-orange-600" />
                                Backend
                            </h3>
                            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                                <li className="flex items-start">
                                    <span className="text-orange-600 mr-2">•</span>
                                    <div>
                                        <strong>Firebase Auth</strong> - Autenticación de usuarios
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-orange-600 mr-2">•</span>
                                    <div>
                                        <strong>Cloud Firestore</strong> - Base de datos NoSQL
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-orange-600 mr-2">•</span>
                                    <div>
                                        <strong>Firebase Storage</strong> - Almacenamiento de archivos
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-orange-600 mr-2">•</span>
                                    <div>
                                        <strong>Multi-tenant</strong> - Arquitectura por organizaciones
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Estructura de Carpetas */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📁 Estructura de Carpetas
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                            {`sig-agro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Autenticación (login, registro)
│   │   ├── campos/            # Gestión de campos
│   │   ├── campanias/         # Campañas agrícolas
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── admin/             # Administración
│   │   └── api/               # API Routes
│   │
│   ├── components/            # Componentes React
│   │   ├── campos/           # Componentes de campos
│   │   ├── labores/          # Componentes de labores
│   │   ├── mapa/             # Componentes GIS
│   │   └── ui/               # Componentes UI base
│   │
│   ├── services/             # Servicios de negocio
│   │   ├── campos.ts         # CRUD de campos
│   │   ├── lotes.ts          # CRUD de lotes
│   │   ├── campanias.ts      # CRUD de campañas
│   │   ├── labores.ts        # CRUD de labores
│   │   └── organizations.ts  # Multi-tenancy
│   │
│   ├── types/                # Definiciones TypeScript
│   │   ├── agro.ts           # Tipos agrícolas
│   │   ├── campania.ts       # Tipos de campañas
│   │   └── organization.ts   # Tipos de org
│   │
│   ├── lib/                  # Utilidades
│   │   ├── firebase/         # Config Firebase
│   │   └── utils/            # Helpers
│   │
│   └── contexts/             # React Contexts
│       └── AuthContext.tsx   # Contexto de auth
│
├── public/                   # Archivos estáticos
├── firestore.rules          # Reglas de seguridad
└── package.json`}
                        </pre>
                    </div>
                </section>

                {/* Patrones de Diseño */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🎯 Patrones de Diseño
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                1. Service Layer Pattern
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                Toda la lógica de negocio está encapsulada en servicios reutilizables:
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                <code className="text-sm text-gray-700 dark:text-gray-300">
                                    {`// services/campos.ts
export const crearCampo = async (orgId, data) => { ... }
export const obtenerCampos = async (orgId) => { ... }
export const actualizarCampo = async (orgId, id, data) => { ... }`}
                                </code>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                2. Multi-tenant Architecture
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                Cada organización tiene sus propios datos aislados:
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                <code className="text-sm text-gray-700 dark:text-gray-300">
                                    {`organizations/{orgId}/campos/{campoId}
organizations/{orgId}/campos/{campoId}/lotes/{loteId}`}
                                </code>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                3. Component Composition
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300">
                                Componentes pequeños y reutilizables que se componen para formar interfaces complejas.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Flujo de Datos */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🔄 Flujo de Datos
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-32 text-center py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg font-semibold text-blue-700 dark:text-blue-300">
                                    Usuario
                                </div>
                                <span className="text-gray-400">→</span>
                                <div className="w-32 text-center py-2 bg-green-100 dark:bg-green-900/30 rounded-lg font-semibold text-green-700 dark:text-green-300">
                                    Componente
                                </div>
                                <span className="text-gray-400">→</span>
                                <div className="w-32 text-center py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg font-semibold text-purple-700 dark:text-purple-300">
                                    Servicio
                                </div>
                                <span className="text-gray-400">→</span>
                                <div className="w-32 text-center py-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg font-semibold text-orange-700 dark:text-orange-300">
                                    Firestore
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                                Los componentes React llaman a servicios que interactúan con Firebase.
                                Los datos fluyen de vuelta a través de hooks y estados.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Seguridad */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🔒 Seguridad
                    </h2>
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-red-600 mr-2">🛡️</span>
                                <span><strong>Firestore Rules:</strong> Validación a nivel de base de datos</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-red-600 mr-2">🛡️</span>
                                <span><strong>Multi-tenant:</strong> Aislamiento total entre organizaciones</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-red-600 mr-2">🛡️</span>
                                <span><strong>Auth Context:</strong> Verificación de permisos en cliente</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-red-600 mr-2">🛡️</span>
                                <span><strong>TypeScript:</strong> Validación de tipos en tiempo de desarrollo</span>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    )
}
