/**
 * Servicio de Cultivos/Campañas (Crops)
 * CRUD para la colección /organizations/{orgId}/crops
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
    orderBy
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Crop, TipoCultivo, EstadoCultivo } from '@/types/sig-agro';

const COLLECTION = 'crops';

/**
 * Crear un nuevo cultivo/campaña
 */
export const crearCrop = async (
    orgId: string,
    crop: Omit<Crop, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    userId: string
): Promise<Crop> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${COLLECTION}`);
        const now = new Date();

        const docData = {
            ...crop,
            organizationId: orgId,
            createdAt: now,
            updatedAt: now,
            createdBy: userId
        };

        const docRef = await addDoc(collectionRef, docData);
        return { id: docRef.id, ...docData } as Crop;
    } catch (error) {
        console.error('Error al crear crop:', error);
        throw error;
    }
};

/**
 * Obtener cultivos con filtros
 */
export const obtenerCrops = async (
    orgId: string,
    filtros?: {
        plotId?: string;
        fieldId?: string;
        campania?: string;
        cultivo?: TipoCultivo;
        estado?: EstadoCultivo;
    }
): Promise<Crop[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${COLLECTION}`);
        let constraints: any[] = [orderBy('campania', 'desc')];

        if (filtros?.plotId) {
            constraints = [where('plotId', '==', filtros.plotId), ...constraints];
        }
        if (filtros?.fieldId) {
            constraints = [where('fieldId', '==', filtros.fieldId), ...constraints];
        }
        if (filtros?.campania) {
            constraints = [where('campania', '==', filtros.campania), ...constraints];
        }

        const q = query(collectionRef, ...constraints);
        const snapshot = await getDocs(q);

        let crops = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fechaSiembra: data.fechaSiembra?.toDate?.() || data.fechaSiembra,
                fechaCosecha: data.fechaCosecha?.toDate?.() || data.fechaCosecha,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
            } as Crop;
        });

        // Filtros adicionales en memoria
        if (filtros?.cultivo) {
            crops = crops.filter(c => c.cultivo === filtros.cultivo);
        }
        if (filtros?.estado) {
            crops = crops.filter(c => c.estado === filtros.estado);
        }

        return crops;
    } catch (error) {
        console.error('Error al obtener crops:', error);
        throw error;
    }
};

/**
 * Obtener historial de cultivos de un lote
 */
export const obtenerHistorialCropsByPlot = async (
    orgId: string,
    plotId: string
): Promise<Crop[]> => {
    return obtenerCrops(orgId, { plotId });
};

/**
 * Obtener cultivos activos de una campaña
 */
export const obtenerCropsByCampania = async (
    orgId: string,
    campania: string
): Promise<Crop[]> => {
    return obtenerCrops(orgId, { campania });
};

/**
 * Obtener un cultivo por ID
 */
export const obtenerCrop = async (
    orgId: string,
    cropId: string
): Promise<Crop | null> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${COLLECTION}/${cropId}`);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.data();
        return {
            id: snapshot.id,
            ...data,
            fechaSiembra: data.fechaSiembra?.toDate?.() || data.fechaSiembra,
            fechaCosecha: data.fechaCosecha?.toDate?.() || data.fechaCosecha,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as Crop;
    } catch (error) {
        console.error('Error al obtener crop:', error);
        throw error;
    }
};

/**
 * Obtener cultivo activo de un lote
 */
export const obtenerCropActivoByPlot = async (
    orgId: string,
    plotId: string
): Promise<Crop | null> => {
    const crops = await obtenerCrops(orgId, {
        plotId,
        estado: 'en_desarrollo'
    });
    return crops[0] || null;
};

/**
 * Actualizar un cultivo
 */
export const actualizarCrop = async (
    orgId: string,
    cropId: string,
    data: Partial<Crop>
): Promise<void> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${COLLECTION}/${cropId}`);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error al actualizar crop:', error);
        throw error;
    }
};

/**
 * Registrar cosecha
 */
export const registrarCosecha = async (
    orgId: string,
    cropId: string,
    datos: {
        fechaCosecha: Date;
        rendimientoReal: number;
        humedad?: number;
        granosVerdes?: number;
        granosPartidos?: number;
    }
): Promise<void> => {
    await actualizarCrop(orgId, cropId, {
        ...datos,
        estado: 'finalizado'
    });
};

/**
 * Calcular margen bruto
 */
export const calcularMargenBruto = (crop: Crop): number | null => {
    if (!crop.ingresoTotal || !crop.costoTotal) return null;
    return crop.ingresoTotal - crop.costoTotal;
};

/**
 * Obtener resumen de cultivos por campaña
 */
export const obtenerResumenCampania = async (
    orgId: string,
    campania: string
): Promise<{
    totalCultivos: number;
    superficieTotal: number;
    porCultivo: Record<TipoCultivo, { cantidad: number; superficie: number }>;
    rendimientoPromedio: number | null;
}> => {
    const crops = await obtenerCropsByCampania(orgId, campania);

    const porCultivo: Record<string, { cantidad: number; superficie: number }> = {};
    let superficieTotal = 0;
    let sumRendimientos = 0;
    let countRendimientos = 0;

    crops.forEach(crop => {
        // Necesitamos obtener la superficie del lote asociado
        // Por ahora usamos un estimado
        const superficie = 0; // Se debería hacer join con plots

        if (!porCultivo[crop.cultivo]) {
            porCultivo[crop.cultivo] = { cantidad: 0, superficie: 0 };
        }
        porCultivo[crop.cultivo].cantidad++;

        if (crop.rendimientoReal) {
            sumRendimientos += crop.rendimientoReal;
            countRendimientos++;
        }
    });

    return {
        totalCultivos: crops.length,
        superficieTotal,
        porCultivo: porCultivo as Record<TipoCultivo, { cantidad: number; superficie: number }>,
        rendimientoPromedio: countRendimientos > 0 ? sumRendimientos / countRendimientos : null
    };
};

/**
 * Obtener campañas disponibles
 */
export const obtenerCampaniasDisponibles = async (
    orgId: string
): Promise<string[]> => {
    const crops = await obtenerCrops(orgId);
    const campanias = [...new Set(crops.map(c => c.campania))];
    return campanias.sort().reverse();
};

/**
 * Generar nombre de campaña actual
 */
export const getCampaniaActual = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Campaña agrícola: Agosto a Julio
    if (month >= 8) {
        return `${year}/${year + 1}`;
    } else {
        return `${year - 1}/${year}`;
    }
};
