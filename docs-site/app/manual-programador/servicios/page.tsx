import { Code, FileCode, Database, Zap } from 'lucide-react'

export default function ServiciosPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                            <Code className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Servicios y APIs
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Capa de servicios para interacción con Firebase
                            </p>
                        </div>
                    </div>
                </div>

                {/* Introducción */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📦 Servicios Disponibles
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Todos los servicios siguen el patrón CRUD y están ubicados en <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">src/services/</code>:
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { nombre: 'campos.ts', descripcion: 'Gestión de campos/establecimientos' },
                                { nombre: 'lotes.ts', descripcion: 'Gestión de lotes productivos' },
                                { nombre: 'campanias.ts', descripcion: 'Gestión de campañas agrícolas' },
                                { nombre: 'labores.ts', descripcion: 'Gestión de eventos/labores' },
                                { nombre: 'organizations.ts', descripcion: 'Gestión de organizaciones' },
                                { nombre: 'contabilidad.ts', descripcion: 'Costos e ingresos' }
                            ].map((servicio) => (
                                <div key={servicio.nombre} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                    <FileCode className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{servicio.nombre}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{servicio.descripcion}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Servicio de Campos */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🏞️ CamposService
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Servicio para gestionar campos (establecimientos agrícolas):
                        </p>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Crear Campo</h3>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                    <code className="text-sm text-gray-700 dark:text-gray-300">
                                        {`export const crearCampo = async (
  orgId: string,
  data: Omit<Campo, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Campo> => {
  const collectionRef = collection(db, \`organizations/\${orgId}/campos\`);
  const now = new Date();
  
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: now,
    updatedAt: now
  });
  
  return { id: docRef.id, ...data, createdAt: now, updatedAt: now };
}`}
                                    </code>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Obtener Campos</h3>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                    <code className="text-sm text-gray-700 dark:text-gray-300">
                                        {`export const obtenerCampos = async (orgId: string): Promise<Campo[]> => {
  const collectionRef = collection(db, \`organizations/\${orgId}/campos\`);
  const q = query(collectionRef, orderBy('nombre'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
  } as Campo));
}`}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Servicio de Labores */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🌾 LaboresService
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Servicio para registrar eventos agrícolas (labores culturales):
                        </p>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Crear Evento</h3>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                    <code className="text-sm text-gray-700 dark:text-gray-300">
                                        {`export const crearEventoLote = async (
  orgId: string,
  campoId: string,
  loteId: string,
  evento: Omit<EventoLote, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const collectionRef = collection(
    db,
    \`organizations/\${orgId}/campos/\${campoId}/lotes/\${loteId}/eventos\`
  );
  
  const docRef = await addDoc(collectionRef, {
    ...evento,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return { id: docRef.id, ...evento };
}`}
                                    </code>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tipos de Eventos</h3>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                    <code className="text-sm text-gray-700 dark:text-gray-300">
                                        {`export const TIPOS_LABOR = {
  siembra: { label: 'Siembra', icon: '🌱', color: 'green' },
  fertilizacion: { label: 'Fertilización', icon: '🧪', color: 'blue' },
  pulverizacion: { label: 'Pulverización', icon: '💨', color: 'purple' },
  laboreo: { label: 'Laboreo', icon: '🚜', color: 'amber' },
  riego: { label: 'Riego', icon: '💧', color: 'cyan' },
  cosecha: { label: 'Cosecha', icon: '🌾', color: 'yellow' }
}`}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Manejo de Errores */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ⚠️ Manejo de Errores
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Todos los servicios implementan manejo de errores consistente:
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                            <code className="text-sm text-gray-700 dark:text-gray-300">
                                {`export const obtenerCampo = async (
  orgId: string,
  campoId: string
): Promise<Campo | null> => {
  try {
    const docRef = doc(db, \`organizations/\${orgId}/campos/\${campoId}\`);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as Campo;
  } catch (error) {
    console.error('Error al obtener campo:', error);
    throw error; // Re-lanzar para que el componente lo maneje
  }
}`}
                            </code>
                        </div>
                    </div>
                </section>

                {/* Uso en Componentes */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ⚛️ Uso en Componentes React
                    </h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Ejemplo de cómo usar los servicios en un componente:
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                            <code className="text-sm text-gray-700 dark:text-gray-300">
                                {`'use client'

import { useState, useEffect } from 'react';
import { obtenerCampos } from '@/services/campos';
import { useAuth } from '@/contexts/AuthContext';

export default function CamposPage() {
  const { currentOrg } = useAuth();
  const [campos, setCampos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const cargarCampos = async () => {
      if (!currentOrg?.id) return;
      
      try {
        const data = await obtenerCampos(currentOrg.id);
        setCampos(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarCampos();
  }, [currentOrg]);
  
  return (
    <div>
      {loading ? 'Cargando...' : campos.map(campo => (
        <div key={campo.id}>{campo.nombre}</div>
      ))}
    </div>
  );
}`}
                            </code>
                        </div>
                    </div>
                </section>

                {/* Mejores Prácticas */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ✨ Mejores Prácticas
                    </h2>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Siempre valida que <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">orgId</code> exista antes de hacer queries</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Convierte Timestamps de Firestore a Date usando <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">.toDate()</code></span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Usa try-catch en todos los servicios para manejo de errores</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Implementa loading states en componentes que usan servicios</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Usa TypeScript para validar tipos de datos antes de escribir</span>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    )
}
