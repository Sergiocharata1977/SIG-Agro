/**
 * Servicio de Análisis Satelital
 * CRUD para la colección /organizations/{orgId}/satellite_analysis
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
    limit
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { SatelliteAnalysis, TipoAnalisis } from '@/types/sig-agro-advanced';

const COLLECTION = 'satellite_analysis';

/**
 * Crear un nuevo análisis satelital
 */
export const crearAnalisisSatelital = async (
    orgId: string,
    analysis: Omit<SatelliteAnalysis, 'id' | 'organizationId' | 'createdAt'>,
    userId: string
): Promise<SatelliteAnalysis> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${COLLECTION}`);
        const now = new Date();

        const docData = {
            ...analysis,
            organizationId: orgId,
            createdAt: now,
            createdBy: userId
        };

        const docRef = await addDoc(collectionRef, docData);
        return { id: docRef.id, ...docData } as SatelliteAnalysis;
    } catch (error) {
        console.error('Error al crear análisis:', error);
        throw error;
    }
};

/**
 * Obtener análisis con filtros
 */
export const obtenerAnalisis = async (
    orgId: string,
    filtros?: {
        plotId?: string;
        cropId?: string;
        tipoAnalisis?: TipoAnalisis;
        limite?: number;
    }
): Promise<SatelliteAnalysis[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${COLLECTION}`);
        let constraints: any[] = [orderBy('fechaAnalisis', 'desc')];

        if (filtros?.plotId) {
            constraints = [where('plotId', '==', filtros.plotId), ...constraints];
        }
        if (filtros?.cropId) {
            constraints = [where('cropId', '==', filtros.cropId), ...constraints];
        }
        if (filtros?.limite) {
            constraints = [...constraints, limit(filtros.limite)];
        }

        const q = query(collectionRef, ...constraints);
        const snapshot = await getDocs(q);

        let analisis = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fechaAnalisis: data.fechaAnalisis?.toDate?.() || data.fechaAnalisis,
                createdAt: data.createdAt?.toDate?.() || data.createdAt
            } as SatelliteAnalysis;
        });

        // Filtro adicional en memoria
        if (filtros?.tipoAnalisis) {
            analisis = analisis.filter(a => a.tipoAnalisis === filtros.tipoAnalisis);
        }

        return analisis;
    } catch (error) {
        console.error('Error al obtener análisis:', error);
        throw error;
    }
};

/**
 * Obtener historial NDVI de un lote
 */
export const obtenerHistorialNDVI = async (
    orgId: string,
    plotId: string,
    limite: number = 12
): Promise<{ fecha: Date; valor: number }[]> => {
    const analisis = await obtenerAnalisis(orgId, {
        plotId,
        tipoAnalisis: 'ndvi',
        limite
    });

    return analisis
        .filter(a => a.ndviPromedio !== undefined)
        .map(a => ({
            fecha: a.fechaAnalisis,
            valor: a.ndviPromedio!
        }))
        .reverse();
};

/**
 * Obtener último análisis de un lote
 */
export const obtenerUltimoAnalisis = async (
    orgId: string,
    plotId: string
): Promise<SatelliteAnalysis | null> => {
    const analisis = await obtenerAnalisis(orgId, { plotId, limite: 1 });
    return analisis[0] || null;
};

/**
 * Comparar análisis con período anterior
 */
export const compararConAnterior = async (
    orgId: string,
    plotId: string,
    analisisActual: SatelliteAnalysis
): Promise<{
    variacionNDVI: number | null;
    tendencia: 'mejora' | 'estable' | 'deterioro';
}> => {
    const historial = await obtenerAnalisis(orgId, { plotId, limite: 2 });

    if (historial.length < 2 || !analisisActual.ndviPromedio) {
        return { variacionNDVI: null, tendencia: 'estable' };
    }

    const anterior = historial[1];
    if (!anterior.ndviPromedio) {
        return { variacionNDVI: null, tendencia: 'estable' };
    }

    const variacion = ((analisisActual.ndviPromedio - anterior.ndviPromedio) / anterior.ndviPromedio) * 100;

    let tendencia: 'mejora' | 'estable' | 'deterioro' = 'estable';
    if (variacion > 5) tendencia = 'mejora';
    else if (variacion < -5) tendencia = 'deterioro';

    return { variacionNDVI: variacion, tendencia };
};

/**
 * Generar análisis simulado (para demo/testing)
 */
export const generarAnalisisSimulado = async (
    orgId: string,
    plotId: string,
    cropId: string,
    userId: string
): Promise<SatelliteAnalysis> => {
    // Valores simulados para demo
    const ndviPromedio = 0.4 + Math.random() * 0.4; // 0.4 - 0.8
    const estresHidrico = Math.random() < 0.2; // 20% probabilidad

    const analisis = await crearAnalisisSatelital(orgId, {
        plotId,
        cropId,
        tipoAnalisis: 'ndvi',
        fechaAnalisis: new Date(),
        ndviPromedio,
        ndviMinimo: ndviPromedio - 0.1,
        ndviMaximo: ndviPromedio + 0.15,
        zonasNdvi: {
            baja: Math.random() * 20,
            media: 30 + Math.random() * 30,
            alta: 40 + Math.random() * 30
        },
        estresHidrico,
        nivelEstres: estresHidrico ? 'warning' : undefined,
        tendencia: Math.random() > 0.5 ? 'mejora' : 'estable',
        resumen: `El lote presenta un NDVI promedio de ${(ndviPromedio * 100).toFixed(0)}%${estresHidrico ? ' con signos de estrés hídrico' : ''}.`,
        recomendaciones: estresHidrico
            ? ['Evaluar riego suplementario', 'Monitorear humedad del suelo']
            : ['Continuar monitoreo regular', 'El cultivo evoluciona normalmente'],
        generadoPor: 'ia',
        modeloIA: 'SIG-Agro-NDVI-v1'
    }, userId);

    return analisis;
};

/**
 * Obtener resumen de análisis
 */
export const obtenerResumenAnalisis = async (
    orgId: string,
    plotId?: string
): Promise<{
    total: number;
    ultimoNDVI: number | null;
    tendencia: 'mejora' | 'estable' | 'deterioro' | null;
    conEstres: number;
}> => {
    const analisis = await obtenerAnalisis(orgId, { plotId, limite: 50 });

    const ultimoConNDVI = analisis.find(a => a.ndviPromedio !== undefined);
    const conEstres = analisis.filter(a => a.estresHidrico).length;

    return {
        total: analisis.length,
        ultimoNDVI: ultimoConNDVI?.ndviPromedio || null,
        tendencia: ultimoConNDVI?.tendencia || null,
        conEstres
    };
};
