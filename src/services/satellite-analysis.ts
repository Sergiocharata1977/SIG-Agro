/**
 * Servicio de Análisis Satelital
 * CRUD para la colección /organizations/{orgId}/satellite_analysis
 */

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    QueryConstraint
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { SatelliteAnalysis, TipoAnalisis } from '@/types/sig-agro-advanced';

const COLLECTION = 'satellite_analysis';

/**
 * Crear un nuevo análisis satelital
 */
export const crearAnalisisSatelital = async (
    orgId: string,
    analysis: Omit<SatelliteAnalysis, 'id' | 'organizationId' | 'createdAt' | 'createdBy'>,
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
        let constraints: QueryConstraint[] = [orderBy('fechaAnalisis', 'desc')];

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

// ============================================
// NUEVOS: Funciones para múltiples índices
// ============================================

/**
 * Generar análisis simulado para cualquier índice (para demo/testing)
 */
export const generarAnalisisMultiIndice = async (
    orgId: string,
    plotId: string,
    cropId: string,
    userId: string,
    tipoIndice: TipoAnalisis = 'ndvi'
): Promise<SatelliteAnalysis> => {
    // Valores simulados según el tipo de índice
    const configs: Record<string, { base: number; rango: number; estresProb: number }> = {
        ndvi: { base: 0.4, rango: 0.4, estresProb: 0.2 },
        ndre: { base: 0.3, rango: 0.3, estresProb: 0.25 },
        msavi: { base: 0.25, rango: 0.35, estresProb: 0.15 },
        ndmi: { base: -0.1, rango: 0.5, estresProb: 0.3 },
        reci: { base: 0.8, rango: 1.5, estresProb: 0.2 },
    };

    const config = configs[tipoIndice] || configs.ndvi;
    const valorPromedio = config.base + Math.random() * config.rango;
    const estresHidrico = Math.random() < config.estresProb;

    // Construir métricas según el índice
    const metricas: Partial<SatelliteAnalysis> = {};

    switch (tipoIndice) {
        case 'ndvi':
            metricas.ndviPromedio = valorPromedio;
            metricas.ndviMinimo = valorPromedio - 0.1;
            metricas.ndviMaximo = valorPromedio + 0.15;
            break;
        case 'ndre':
            metricas.ndrePromedio = valorPromedio;
            metricas.ndreMinimo = valorPromedio - 0.08;
            metricas.ndreMaximo = valorPromedio + 0.12;
            break;
        case 'msavi':
            metricas.msaviPromedio = valorPromedio;
            metricas.msaviMinimo = valorPromedio - 0.05;
            metricas.msaviMaximo = valorPromedio + 0.1;
            break;
        case 'ndmi':
            metricas.ndmiPromedio = valorPromedio;
            metricas.ndmiMinimo = valorPromedio - 0.15;
            metricas.ndmiMaximo = valorPromedio + 0.15;
            break;
        case 'reci':
            metricas.reciPromedio = valorPromedio;
            metricas.reciMinimo = valorPromedio - 0.3;
            metricas.reciMaximo = valorPromedio + 0.5;
            break;
    }

    const nombreIndice = tipoIndice.toUpperCase();
    const valorFormatted = (valorPromedio * (tipoIndice === 'reci' ? 1 : 100)).toFixed(tipoIndice === 'reci' ? 2 : 0);

    const analisis = await crearAnalisisSatelital(orgId, {
        plotId,
        cropId,
        tipoAnalisis: tipoIndice,
        fechaAnalisis: new Date(),
        ...metricas,
        zonasNdvi: {
            baja: Math.random() * 20,
            media: 30 + Math.random() * 30,
            alta: 40 + Math.random() * 30
        },
        estresHidrico,
        nivelEstres: estresHidrico ? 'warning' : undefined,
        tendencia: Math.random() > 0.5 ? 'mejora' : 'estable',
        resumen: generarResumen(tipoIndice, valorPromedio, estresHidrico),
        recomendaciones: generarRecomendaciones(tipoIndice, valorPromedio, estresHidrico),
        generadoPor: 'ia',
        modeloIA: `SIG-Agro-${nombreIndice}-v1`
    }, userId);

    return analisis;
};

/**
 * Generar resumen según el índice
 */
function generarResumen(indice: TipoAnalisis, valor: number, estres: boolean): string {
    const resumenes: Record<string, (v: number, e: boolean) => string> = {
        ndvi: (v, e) => `El lote presenta un NDVI promedio de ${(v * 100).toFixed(0)}%${e ? ' con signos de estrés hídrico' : ''}.`,
        ndre: (v, e) => `El índice Red Edge (NDRE) es ${(v * 100).toFixed(0)}%, ${v < 0.3 ? 'indicando posible estrés temprano' : 'dentro de parámetros normales'}${e ? '. Se detecta estrés hídrico.' : '.'}`,
        msavi: (v, e) => `El MSAVI indica ${v < 0.2 ? 'baja' : v < 0.5 ? 'moderada' : 'alta'} cobertura vegetal (${(v * 100).toFixed(0)}%)${e ? ' con posible déficit hídrico' : ''}.`,
        ndmi: (v, e) => `El índice de humedad (NDMI) es ${v.toFixed(2)}, indicando ${v < -0.2 ? 'estrés hídrico severo' : v < 0.2 ? 'contenido de agua normal' : 'alta disponibilidad de agua'}.`,
        reci: (v, e) => `El índice de clorofila (ReCI) es ${v.toFixed(2)}, ${v < 0.5 ? 'sugiriendo posible deficiencia de nitrógeno' : v < 2 ? 'con niveles normales de clorofila' : 'indicando alta actividad fotosintética'}.`,
    };

    return resumenes[indice]?.(valor, estres) || `Análisis ${indice} completado.`;
}

/**
 * Generar recomendaciones según el índice
 */
function generarRecomendaciones(indice: TipoAnalisis, valor: number, estres: boolean): string[] {
    const baseRecomendaciones: string[] = [];

    // Recomendaciones por índice
    switch (indice) {
        case 'ndvi':
            if (valor < 0.3) baseRecomendaciones.push('Verificar estado del cultivo inmediatamente');
            if (estres) baseRecomendaciones.push('Evaluar riego suplementario');
            baseRecomendaciones.push('Continuar monitoreo regular');
            break;
        case 'ndre':
            if (valor < 0.25) baseRecomendaciones.push('Alerta temprana: posible estrés antes de que sea visible');
            baseRecomendaciones.push('Comparar con NDVI para confirmar diagnóstico');
            break;
        case 'msavi':
            if (valor < 0.2) baseRecomendaciones.push('Baja cobertura vegetal - revisar densidad de siembra');
            baseRecomendaciones.push('Útil para monitoreo en etapas tempranas del cultivo');
            break;
        case 'ndmi':
            if (valor < -0.2) baseRecomendaciones.push('URGENTE: Implementar riego suplementario');
            if (valor < 0) baseRecomendaciones.push('Monitorear humedad del suelo');
            if (valor > 0.4) baseRecomendaciones.push('Verificar drenaje del lote');
            break;
        case 'reci':
            if (valor < 0.5) baseRecomendaciones.push('Considerar aplicación de fertilizante nitrogenado');
            if (valor >= 0.5 && valor < 2) baseRecomendaciones.push('Niveles de clorofila normales');
            baseRecomendaciones.push('El índice ReCI es sensible al contenido de nitrógeno');
            break;
    }

    return baseRecomendaciones;
}

/**
 * Obtener análisis completo con todos los índices para un lote
 */
export const obtenerAnalisisCompleto = async (
    orgId: string,
    plotId: string.
        limite: number = 5
): Promise<{
    ndvi: SatelliteAnalysis[];
    ndre: SatelliteAnalysis[];
    msavi: SatelliteAnalysis[];
    ndmi: SatelliteAnalysis[];
    reci: SatelliteAnalysis[];
}> => {
    const [ndvi, ndre, msavi, ndmi, reci] = await Promise.all([
        obtenerAnalisis(orgId, { plotId, tipoAnalisis: 'ndvi', limite }),
        obtenerAnalisis(orgId, { plotId, tipoAnalisis: 'ndre', limite }),
        obtenerAnalisis(orgId, { plotId, tipoAnalisis: 'msavi', limite }),
        obtenerAnalisis(orgId, { plotId, tipoAnalisis: 'ndmi', limite }),
        obtenerAnalisis(orgId, { plotId, tipoAnalisis: 'reci', limite }),
    ]);

    return { ndvi, ndre, msavi, ndmi, reci };
};

/**
 * Tipos de índices disponibles para el selector UI
 */
export const INDICES_DISPONIBLES = [
    { id: 'ndvi', nombre: 'NDVI', descripcion: 'Índice de Vegetación' },
    { id: 'ndre', nombre: 'NDRE', descripcion: 'Red Edge - Estrés Temprano' },
    { id: 'msavi', nombre: 'MSAVI', descripcion: 'Ajustado al Suelo' },
    { id: 'ndmi', nombre: 'NDMI', descripcion: 'Índice de Humedad' },
    { id: 'reci', nombre: 'ReCI', descripcion: 'Clorofila/Nitrógeno' },
] as const;

