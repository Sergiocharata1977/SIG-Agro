/**
 * Servicio de Labores Agrícolas
 * CRUD para eventos de lote (siembra, fertilización, pulverización, cosecha, etc.)
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    orderBy
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { EventoLote, TipoEvento, ProductoAplicado } from '@/types';

// ============================================
// EVENTOS DE LOTE (Labores Agrícolas)
// ============================================

/**
 * Crear un nuevo evento/labor en un lote
 */
export const crearEventoLote = async (
    orgId: string,
    campoId: string,
    loteId: string,
    evento: Omit<EventoLote, 'id' | 'createdAt' | 'updatedAt'>
) => {
    try {
        const collectionRef = collection(
            db,
            `organizations/${orgId}/campos/${campoId}/lotes/${loteId}/eventos`
        );
        const now = new Date();

        const docRef = await addDoc(collectionRef, {
            ...evento,
            createdAt: now,
            updatedAt: now
        });

        return { id: docRef.id, ...evento, createdAt: now, updatedAt: now };
    } catch (error) {
        console.error('Error al crear evento:', error);
        throw error;
    }
};

/**
 * Obtener todos los eventos de un lote
 */
export const obtenerEventosLote = async (
    orgId: string,
    campoId: string,
    loteId: string,
    filtros?: {
        tipo?: TipoEvento;
        desde?: Date;
        hasta?: Date;
    }
): Promise<EventoLote[]> => {
    try {
        const collectionRef = collection(
            db,
            `organizations/${orgId}/campos/${campoId}/lotes/${loteId}/eventos`
        );

        const q = query(collectionRef, orderBy('fecha', 'desc'));

        const snapshot = await getDocs(q);

        let eventos = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fecha: data.fecha?.toDate?.() || data.fecha,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
            } as EventoLote;
        });

        // Filtrar en memoria si hay filtros
        if (filtros?.tipo) {
            eventos = eventos.filter(e => e.tipo === filtros.tipo);
        }
        if (filtros?.desde) {
            eventos = eventos.filter(e => new Date(e.fecha) >= filtros.desde!);
        }
        if (filtros?.hasta) {
            eventos = eventos.filter(e => new Date(e.fecha) <= filtros.hasta!);
        }

        return eventos;
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        throw error;
    }
};

/**
 * Obtener un evento específico
 */
export const obtenerEvento = async (
    orgId: string,
    campoId: string,
    loteId: string,
    eventoId: string
): Promise<EventoLote | null> => {
    try {
        const docRef = doc(
            db,
            `organizations/${orgId}/campos/${campoId}/lotes/${loteId}/eventos/${eventoId}`
        );
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.data();
        return {
            id: snapshot.id,
            ...data,
            fecha: data.fecha?.toDate?.() || data.fecha,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as EventoLote;
    } catch (error) {
        console.error('Error al obtener evento:', error);
        throw error;
    }
};

/**
 * Actualizar un evento
 */
export const actualizarEvento = async (
    orgId: string,
    campoId: string,
    loteId: string,
    eventoId: string,
    data: Partial<EventoLote>
) => {
    try {
        const docRef = doc(
            db,
            `organizations/${orgId}/campos/${campoId}/lotes/${loteId}/eventos/${eventoId}`
        );
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        throw error;
    }
};

/**
 * Eliminar un evento
 */
export const eliminarEvento = async (
    orgId: string,
    campoId: string,
    loteId: string,
    eventoId: string
) => {
    try {
        const docRef = doc(
            db,
            `organizations/${orgId}/campos/${campoId}/lotes/${loteId}/eventos/${eventoId}`
        );
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        throw error;
    }
};

// ============================================
// TIPOS DE LABORES CON CONFIGURACIÓN
// ============================================

export const TIPOS_LABOR: Record<TipoEvento, {
    label: string;
    icon: string;
    color: string;
    requiereProductos: boolean;
}> = {
    siembra: {
        label: 'Siembra',
        icon: '🌱',
        color: 'bg-green-100 text-green-700',
        requiereProductos: false
    },
    fertilizacion: {
        label: 'Fertilización',
        icon: '🧪',
        color: 'bg-blue-100 text-blue-700',
        requiereProductos: true
    },
    pulverizacion: {
        label: 'Pulverización',
        icon: '💨',
        color: 'bg-purple-100 text-purple-700',
        requiereProductos: true
    },
    laboreo: {
        label: 'Laboreo',
        icon: '🚜',
        color: 'bg-amber-100 text-amber-700',
        requiereProductos: false
    },
    riego: {
        label: 'Riego',
        icon: '💧',
        color: 'bg-cyan-100 text-cyan-700',
        requiereProductos: false
    },
    cosecha: {
        label: 'Cosecha',
        icon: '🌾',
        color: 'bg-yellow-100 text-yellow-700',
        requiereProductos: false
    },
    observacion: {
        label: 'Observación',
        icon: '👁️',
        color: 'bg-gray-100 text-gray-700',
        requiereProductos: false
    },
    analisis_suelo: {
        label: 'Análisis de Suelo',
        icon: '🔬',
        color: 'bg-orange-100 text-orange-700',
        requiereProductos: false
    },
    otro: {
        label: 'Otro',
        icon: '📝',
        color: 'bg-slate-100 text-slate-700',
        requiereProductos: false
    }
};

// ============================================
// PRODUCTOS COMUNES (para autocompletado)
// ============================================

export const PRODUCTOS_COMUNES: ProductoAplicado[] = [
    // Herbicidas
    { nombre: 'Glifosato', dosis: 3, unidad: 'lt/ha', ingredienteActivo: 'Glifosato' },
    { nombre: '2,4-D', dosis: 0.8, unidad: 'lt/ha', ingredienteActivo: '2,4-D' },
    { nombre: 'Atrazina', dosis: 2, unidad: 'lt/ha', ingredienteActivo: 'Atrazina' },

    // Insecticidas
    { nombre: 'Cipermetrina', dosis: 0.15, unidad: 'lt/ha', ingredienteActivo: 'Cipermetrina' },
    { nombre: 'Clorpirifos', dosis: 1, unidad: 'lt/ha', ingredienteActivo: 'Clorpirifos' },

    // Fungicidas
    { nombre: 'Carbendazim', dosis: 0.5, unidad: 'lt/ha', ingredienteActivo: 'Carbendazim' },

    // Fertilizantes
    { nombre: 'Urea Granulada', dosis: 100, unidad: 'kg/ha' },
    { nombre: 'Fosfato Diamónico (DAP)', dosis: 80, unidad: 'kg/ha' },
    { nombre: 'Superfosfato Triple', dosis: 60, unidad: 'kg/ha' },
    { nombre: 'Cloruro de Potasio', dosis: 50, unidad: 'kg/ha' },
];

// ============================================
// ESTADÍSTICAS
// ============================================

/**
 * Obtener resumen de labores de un lote
 */
export const obtenerResumenLabores = async (
    orgId: string,
    campoId: string,
    loteId: string
): Promise<{
    total: number;
    porTipo: Record<TipoEvento, number>;
    ultimaLabor: EventoLote | null;
}> => {
    const eventos = await obtenerEventosLote(orgId, campoId, loteId);

    const porTipo: Record<string, number> = {};
    for (const tipo of Object.keys(TIPOS_LABOR)) {
        porTipo[tipo] = eventos.filter(e => e.tipo === tipo).length;
    }

    return {
        total: eventos.length,
        porTipo: porTipo as Record<TipoEvento, number>,
        ultimaLabor: eventos[0] || null
    };
};
