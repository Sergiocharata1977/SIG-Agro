import { Database, Shield, Key, FileCode } from 'lucide-react'

export default function FirebasePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                            <Database className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Firebase y Multi-tenancy
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Configuración de Firestore y arquitectura multi-tenant
                            </p>
                        </div>
                    </div>
                </div>

                {/* Configuración Firebase */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🔧 Configuración de Firebase
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            SIG Agro utiliza Firebase como backend principal. La configuración se encuentra en:
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
                            <code className="text-sm text-gray-700 dark:text-gray-300">
                                {`// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);`}
                            </code>
                        </div>
                    </div>
                </section>

                {/* Arquitectura Multi-tenant */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🏢 Arquitectura Multi-tenant
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Cada organización tiene sus propios datos completamente aislados:
                        </p>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>💡 Concepto:</strong> Multi-tenancy significa que múltiples organizaciones (tenants)
                                comparten la misma aplicación pero sus datos están completamente separados.
                            </p>
                        </div>

                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Estructura de Colecciones
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                                {`organizations/{orgId}
  ├── name: "Establecimiento Los Algarrobos"
  ├── cuit: "20-12345678-9"
  └── createdAt: Timestamp

organizations/{orgId}/campos/{campoId}
  ├── nombre: "Campo Norte"
  ├── superficie: 500
  └── provincia: "Chaco"

organizations/{orgId}/campos/{campoId}/lotes/{loteId}
  ├── nombre: "Lote 1"
  ├── superficie: 50
  ├── poligono: GeoJSON
  └── estado: "sembrado"

organizations/{orgId}/campos/{campoId}/lotes/{loteId}/eventos/{eventoId}
  ├── tipo: "pulverizacion"
  ├── fecha: Timestamp
  └── productos: Array`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Reglas de Seguridad */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Shield className="w-6 h-6 mr-2 text-red-600" />
                        Reglas de Seguridad
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Las reglas de Firestore garantizan que cada usuario solo acceda a los datos de su organización:
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                            <code className="text-sm text-gray-700 dark:text-gray-300">
                                {`// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: verificar si el usuario pertenece a la org
    function belongsToOrg(orgId) {
      return request.auth != null && 
             get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role != null;
    }
    
    // Organizaciones
    match /organizations/{orgId} {
      allow read: if belongsToOrg(orgId);
      allow write: if belongsToOrg(orgId) && 
                      get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role == 'admin';
      
      // Campos
      match /campos/{campoId} {
        allow read, write: if belongsToOrg(orgId);
        
        // Lotes
        match /lotes/{loteId} {
          allow read, write: if belongsToOrg(orgId);
          
          // Eventos
          match /eventos/{eventoId} {
            allow read, write: if belongsToOrg(orgId);
          }
        }
      }
    }
  }
}`}
                            </code>
                        </div>
                    </div>
                </section>

                {/* Colecciones Principales */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📚 Colecciones Principales
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                nombre: 'organizations',
                                descripcion: 'Datos de la organización (establecimiento)',
                                campos: ['name', 'cuit', 'provincia', 'createdAt']
                            },
                            {
                                nombre: 'campos',
                                descripcion: 'Establecimientos agrícolas',
                                campos: ['nombre', 'superficie', 'provincia', 'departamento', 'perimetro']
                            },
                            {
                                nombre: 'lotes',
                                descripcion: 'Subdivisiones productivas de campos',
                                campos: ['nombre', 'superficie', 'poligono', 'tipoSuelo', 'estado']
                            },
                            {
                                nombre: 'campanias',
                                descripcion: 'Ciclos productivos por cultivo',
                                campos: ['nombre', 'cultivo', 'variedad', 'fechaSiembra', 'rendimiento']
                            },
                            {
                                nombre: 'eventos',
                                descripcion: 'Labores agrícolas (siembra, fertilización, etc.)',
                                campos: ['tipo', 'fecha', 'productos', 'superficieAplicada']
                            }
                        ].map((coleccion) => (
                            <div key={coleccion.nombre} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {coleccion.nombre}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {coleccion.descripcion}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {coleccion.campos.map((campo) => (
                                        <span key={campo} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                                            {campo}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Tipos GeoJSON */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🗺️ Datos Geoespaciales
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Los lotes y campos almacenan geometrías en formato GeoJSON:
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Point (Punto)</h3>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                    <code className="text-xs text-gray-700 dark:text-gray-300">
                                        {`{
  type: "Point",
  coordinates: [-60.123, -27.456]
  // [longitud, latitud]
}`}
                                    </code>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Polygon (Polígono)</h3>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                    <code className="text-xs text-gray-700 dark:text-gray-300">
                                        {`{
  type: "Polygon",
  coordinates: [
    [
      [-60.1, -27.4],
      [-60.2, -27.4],
      [-60.2, -27.5],
      [-60.1, -27.5],
      [-60.1, -27.4]
    ]
  ]
}`}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mejores Prácticas */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ✨ Mejores Prácticas
                    </h2>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Siempre incluye <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">orgId</code> en las consultas</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Usa índices compuestos para queries complejas</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Convierte Timestamps de Firestore a Date en el cliente</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Valida datos con TypeScript antes de escribir en Firestore</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Usa transacciones para operaciones que afectan múltiples documentos</span>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    )
}
