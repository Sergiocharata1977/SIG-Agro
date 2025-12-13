/**
 * Servicio de Lotes (Plots)
 * CRUD para la colección /organizations/{orgId}/plots
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    QueryConstraint
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Plot, EstadoLote } from '@/types/sig-agro';

const COLLECTION = 'plots';

/**
 * Crear un nuevo lote
 */
export const crearPlot = async (
    orgId: string,
    plot: Omit<Plot, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    userId: string
): Promise<Plot> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${COLLECTION}`);
        const now = new Date();

        const docData = {
            ...plot,
            organizationId: orgId,
            createdAt: now,
            updatedAt: now,
            createdBy: userId
        };

        const docRef = await addDoc(collectionRef, docData);
        return { id: docRef.id, ...docData } as Plot;
    } catch (error) {
        console.error('Error al crear plot:', error);
        throw error;
    }
};

/**
 * Obtener todos los lotes de una organización
 */
export const obtenerPlots = async (
    orgId: string,
    filtros?: {
        fieldId?: string;
        estado?: EstadoLote;
        activo?: boolean;
    }
): Promise<Plot[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${COLLECTION}`);
        let constraints: QueryConstraint[] = [orderBy('nombre', 'asc')];

        if (filtros?.fieldId) {
            constraints = [where('fieldId', '==', filtros.fieldId), ...constraints];
        }
        if (filtros?.activo !== undefined) {
            constraints = [where('activo', '==', filtros.activo), ...constraints];
        }

        const q = query(collectionRef, ...constraints);
        const snapshot = await getDocs(q);

        let plots = snapshot.docs.map(doc => {
            const data = doc.data();
            // Deserializar poligono si es string
            let poligono = data.poligono;
            if (typeof poligono === 'string' && poligono) {
                try {
                    poligono = JSON.parse(poligono);
                } catch {
                    // Mantener como string si falla
                }
            }
            return {
                id: doc.id,
                ...data,
                poligono,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
            } as Plot;
        });

        // Filtro adicional de estado (en memoria)
        if (filtros?.estado) {
            plots = plots.filter(p => p.estado === filtros.estado);
        }

        return plots;
    } catch (error) {
        console.error('Error al obtener plots:', error);
        throw error;
    }
};

/**
 * Obtener lotes de un campo específico
 */
export const obtenerPlotsByField = async (
    orgId: string,
    fieldId: string,
    soloActivos: boolean = true
): Promise<Plot[]> => {
    return obtenerPlots(orgId, {
        fieldId,
        activo: soloActivos ? true : undefined
    });
};

/**
 * Obtener un lote por ID
 */
export const obtenerPlot = async (
    orgId: string,
    plotId: string
): Promise<Plot | null> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${COLLECTION}/${plotId}`);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.data();
        let poligono = data.poligono;
        if (typeof poligono === 'string' && poligono) {
            try {
                poligono = JSON.parse(poligono);
            } catch { }
        }

        return {
            id: snapshot.id,
            ...data,
            poligono,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as Plot;
    } catch (error) {
        console.error('Error al obtener plot:', error);
        throw error;
    }
};

/**
 * Actualizar un lote
 */
export const actualizarPlot = async (
    orgId: string,
    plotId: string,
    data: Partial<Plot>
): Promise<void> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${COLLECTION}/${plotId}`);

        // Serializar poligono si es objeto
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = { ...data, updatedAt: new Date() };
        if (updateData.poligono && typeof updateData.poligono === 'object') {
            updateData.poligono = JSON.stringify(updateData.poligono);
        }

        await updateDoc(docRef, updateData);
    } catch (error) {
        console.error('Error al actualizar plot:', error);
        throw error;
    }
};

/**
 * Cambiar estado de un lote
 */
export const cambiarEstadoPlot = async (
    orgId: string,
    plotId: string,
    nuevoEstado: EstadoLote
): Promise<void> => {
    await actualizarPlot(orgId, plotId, { estado: nuevoEstado });
};

/**
 * Eliminar (desactivar) un lote
 */
export const eliminarPlot = async (
    orgId: string,
    plotId: string
): Promise<void> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${COLLECTION}/${plotId}`);
        await updateDoc(docRef, {
            activo: false,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error al eliminar plot:', error);
        throw error;
    }
};

/**
 * Obtener resumen de lotes
 */
export const obtenerResumenPlots = async (
    orgId: string,
    fieldId?: string
): Promise<{
    total: number;
    superficieTotal: number;
    porEstado: Record<EstadoLote, number>;
}> => {
    const plots = await obtenerPlots(orgId, {
        fieldId,
        activo: true
    });

    const superficieTotal = plots.reduce((acc, p) => acc + (p.superficie || 0), 0);

    const porEstado: Record<string, number> = {};
    plots.forEach(p => {
        porEstado[p.estado] = (porEstado[p.estado] || 0) + 1;
    });

    return {
        total: plots.length,
        superficieTotal,
        porEstado: porEstado as Record<EstadoLote, number>
    };
};
