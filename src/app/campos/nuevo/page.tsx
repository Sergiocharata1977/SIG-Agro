'use client';

/**
 * Página para crear un nuevo campo
 * Incluye formulario de datos y mapa para dibujar el polígono
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { crearCampo } from '@/services/campos';
import type { GeoJSONPolygon, GeoJSONPoint } from '@/types';

// Importar editor de mapa dinámicamente
const MapaEditor = dynamic(
    () => import('@/components/mapa/MapaEditor'),
    {
        ssr: false,
        loading: () => (
            <div className="h-[400px] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Cargando editor de mapa...</span>
            </div>
        )
    }
);

// Departamentos del Chaco
const DEPARTAMENTOS_CHACO = [
    'Almirante Brown',
    'Bermejo',
    'Chacabuco',
    'Comandante Fernández',
    'Doce de Octubre',
    'Dos de Abril',
    'Fray Justo Santa María de Oro',
    'General Belgrano',
    'General Donovan',
    'General Güemes',
    'Independencia',
    'Libertad',
    'Libertador General San Martín',
    'Maipú',
    'Mayor Luis J. Fontana',
    'Nueve de Julio',
    'O\'Higgins',
    'Presidente de la Plaza',
    'Primero de Mayo',
    'Quitilipi',
    'San Fernando',
    'San Lorenzo',
    'Sargento Cabral',
    'Tapenagá',
    'Veinticinco de Mayo',
];

export default function NuevoCampoPage() {
    const router = useRouter();
    const { firebaseUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<1 | 2>(1); // 1: datos, 2: mapa

    const [formData, setFormData] = useState({
        nombre: '',
        departamento: '',
        localidad: '',
        superficieTotal: 0,
    });

    const [poligono, setPoligono] = useState<GeoJSONPolygon | null>(null);
    const [areaCalculada, setAreaCalculada] = useState<number>(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handlePolygonCreated = (polygon: GeoJSONPolygon, areaHa: number) => {
        setPoligono(polygon);
        setAreaCalculada(areaHa);
        setFormData(prev => ({
            ...prev,
            superficieTotal: Math.round(areaHa * 100) / 100,
        }));
    };

    const handleNextStep = () => {
        if (!formData.nombre || !formData.departamento) {
            setError('Completa el nombre y departamento del campo');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSubmit = async () => {
        if (!firebaseUser) {
            setError('Debes iniciar sesión');
            return;
        }

        if (!poligono) {
            setError('Dibuja el perímetro del campo en el mapa');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Calcular centroide
            const coords = poligono.coordinates[0];
            const numPoints = coords.length - 1;
            let sumLng = 0, sumLat = 0;
            for (let i = 0; i < numPoints; i++) {
                sumLng += coords[i][0];
                sumLat += coords[i][1];
            }
            const ubicacion: GeoJSONPoint = {
                type: 'Point',
                coordinates: [sumLng / numPoints, sumLat / numPoints],
            };

            await crearCampo(firebaseUser.uid, {
                nombre: formData.nombre,
                provincia: 'Chaco',
                departamento: formData.departamento,
                localidad: formData.localidad || undefined,
                superficieTotal: formData.superficieTotal || areaCalculada,
                perimetro: poligono,
                ubicacion,
                activo: true,
            });

            router.push('/dashboard');
        } catch (err) {
            console.error('Error al crear campo:', err);
            setError('Error al guardar el campo. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-green-200">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ← Volver
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Nuevo Campo
                            </h1>
                            <p className="text-sm text-gray-500">
                                Paso {step} de 2: {step === 1 ? 'Datos del campo' : 'Dibujar perímetro'}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* Indicador de pasos */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 ${step === 1 ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-green-500 text-white' : 'bg-gray-200'
                            }`}>
                            1
                        </div>
                        <span className="hidden sm:inline">Datos</span>
                    </div>
                    <div className="w-16 h-1 bg-gray-200 rounded">
                        <div className={`h-full bg-green-500 rounded transition-all ${step === 2 ? 'w-full' : 'w-0'}`} />
                    </div>
                    <div className={`flex items-center gap-2 ${step === 2 ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-green-500 text-white' : 'bg-gray-200'
                            }`}>
                            2
                        </div>
                        <span className="hidden sm:inline">Mapa</span>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Paso 1: Formulario de datos */}
                {step === 1 && (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            📝 Información del Campo
                        </h2>

                        <div className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Campo *
                                </label>
                                <input
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Ej: Campo Los Algarrobos"
                                />
                            </div>

                            {/* Departamento */}
                            <div>
                                <label htmlFor="departamento" className="block text-sm font-medium text-gray-700 mb-1">
                                    Departamento *
                                </label>
                                <select
                                    id="departamento"
                                    name="departamento"
                                    value={formData.departamento}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="">Seleccionar departamento</option>
                                    {DEPARTAMENTOS_CHACO.map((dep) => (
                                        <option key={dep} value={dep}>{dep}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Localidad */}
                            <div>
                                <label htmlFor="localidad" className="block text-sm font-medium text-gray-700 mb-1">
                                    Localidad (opcional)
                                </label>
                                <input
                                    id="localidad"
                                    name="localidad"
                                    type="text"
                                    value={formData.localidad}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Ej: Pampa del Indio"
                                />
                            </div>

                            {/* Botón siguiente */}
                            <div className="pt-4">
                                <button
                                    onClick={handleNextStep}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition"
                                >
                                    Siguiente: Dibujar en Mapa →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Paso 2: Mapa para dibujar */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        🗺️ Dibujar Perímetro del Campo
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Campo: <span className="font-medium">{formData.nombre}</span> - {formData.departamento}
                                    </p>
                                </div>
                                {areaCalculada > 0 && (
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Superficie calculada</p>
                                        <p className="text-xl font-bold text-green-600">{areaCalculada.toFixed(2)} ha</p>
                                    </div>
                                )}
                            </div>

                            <MapaEditor
                                onPolygonCreated={handlePolygonCreated}
                                onPolygonEdited={handlePolygonCreated}
                                altura="450px"
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition"
                            >
                                ← Volver
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !poligono}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Guardando...' : '✓ Guardar Campo'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
