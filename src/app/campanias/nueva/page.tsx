'use client';

/**
 * Página para crear una nueva campaña
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { crearCampania } from '@/services/campanias';
import { obtenerCampos } from '@/services/campos';
import { obtenerLotes } from '@/services/lotes';
import type { Campo, Lote } from '@/types';

const CULTIVOS = [
    'Soja',
    'Maíz',
    'Algodón',
    'Girasol',
    'Sorgo',
    'Trigo',
    'Arroz',
    'Poroto',
    'Otro',
];

export default function NuevaCampaniaPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [campos, setCampos] = useState<Campo[]>([]);
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [formData, setFormData] = useState({
        campoId: '',
        loteId: '',
        nombre: '',
        cultivo: '',
        variedad: '',
        tecnologia: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        superficieSembrada: '',
        observaciones: '',
    });

    // Cargar campos
    useEffect(() => {
        if (!user) return;

        const cargarCampos = async () => {
            try {
                const data = await obtenerCampos(user.uid);
                setCampos(data);
            } catch (err) {
                console.error('Error al cargar campos:', err);
            } finally {
                setLoadingData(false);
            }
        };

        cargarCampos();
    }, [user]);

    // Cargar lotes cuando cambia el campo
    useEffect(() => {
        if (!user || !formData.campoId) {
            setLotes([]);
            return;
        }

        const cargarLotes = async () => {
            try {
                const data = await obtenerLotes(user.uid, formData.campoId);
                setLotes(data);
            } catch (err) {
                console.error('Error al cargar lotes:', err);
            }
        };

        cargarLotes();
    }, [user, formData.campoId]);

    // Generar nombre automático
    useEffect(() => {
        if (formData.cultivo && formData.loteId) {
            const lote = lotes.find(l => l.id === formData.loteId);
            const año = new Date(formData.fechaInicio).getFullYear();
            const nombreAuto = `${formData.cultivo} ${lote?.nombre || ''} ${año}/${año + 1}`;
            setFormData(prev => ({ ...prev, nombre: nombreAuto }));
        }
    }, [formData.cultivo, formData.loteId, formData.fechaInicio, lotes]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        if (!formData.campoId || !formData.loteId || !formData.cultivo) {
            setError('Completa los campos obligatorios');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const lote = lotes.find(l => l.id === formData.loteId);

            await crearCampania(user.uid, {
                campoId: formData.campoId,
                loteId: formData.loteId,
                nombre: formData.nombre,
                cultivo: formData.cultivo,
                variedad: formData.variedad || undefined,
                tecnologia: formData.tecnologia || undefined,
                fechaInicio: new Date(formData.fechaInicio),
                superficieSembrada: formData.superficieSembrada ? parseFloat(formData.superficieSembrada) : lote?.superficie,
                observaciones: formData.observaciones || undefined,
                estado: 'planificada',
            });

            router.push('/campanias');
        } catch (err) {
            console.error('Error al crear campaña:', err);
            setError('Error al crear la campaña');
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-green-200">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/campanias" className="text-gray-500 hover:text-gray-700">
                            ← Volver
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">Nueva Campaña</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {campos.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">
                                Primero debes crear un campo con lotes
                            </p>
                            <Link
                                href="/campos/nuevo"
                                className="inline-block px-4 py-2 bg-green-500 text-white rounded-lg"
                            >
                                Crear Campo
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Campo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Campo *
                                </label>
                                <select
                                    name="campoId"
                                    value={formData.campoId}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Seleccionar campo</option>
                                    {campos.map((campo) => (
                                        <option key={campo.id} value={campo.id}>{campo.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Lote */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lote *
                                </label>
                                <select
                                    name="loteId"
                                    value={formData.loteId}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.campoId}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                                >
                                    <option value="">Seleccionar lote</option>
                                    {lotes.map((lote) => (
                                        <option key={lote.id} value={lote.id}>
                                            {lote.nombre} ({lote.superficie} ha)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Cultivo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cultivo *
                                </label>
                                <select
                                    name="cultivo"
                                    value={formData.cultivo}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Seleccionar cultivo</option>
                                    {CULTIVOS.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Variedad y Tecnología */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Variedad
                                    </label>
                                    <input
                                        type="text"
                                        name="variedad"
                                        value={formData.variedad}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                                        placeholder="Ej: DM 46i17"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tecnología
                                    </label>
                                    <input
                                        type="text"
                                        name="tecnologia"
                                        value={formData.tecnologia}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                                        placeholder="Ej: RR, Bt"
                                    />
                                </div>
                            </div>

                            {/* Fecha inicio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha de Inicio *
                                </label>
                                <input
                                    type="date"
                                    name="fechaInicio"
                                    value={formData.fechaInicio}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la Campaña
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                                    placeholder="Se genera automáticamente"
                                />
                            </div>

                            {/* Observaciones */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observaciones
                                </label>
                                <textarea
                                    name="observaciones"
                                    value={formData.observaciones}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                                    placeholder="Notas adicionales..."
                                />
                            </div>

                            {/* Botón */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50"
                            >
                                {loading ? 'Creando...' : '✓ Crear Campaña'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
