/**
 * Servicio de Alertas
 * CRUD para la colección /organizations/{orgId}/alerts
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
import type { Alert, TipoAlerta, NivelSeveridad } from '@/types/sig-agro-advanced';

const COLLECTION = 'alerts';

/**
 * Crear una nueva alerta
 */
export const crearAlerta = async (
    orgId: string,
    alert: Omit<Alert, 'id' | 'organizationId' | 'createdAt' | 'leida' | 'resuelta'>,
    userId: string
): Promise<Alert> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${COLLECTION}`);
        const now = new Date();

        const docData = {
            ...alert,
            organizationId: orgId,
            leida: false,
            resuelta: false,
            createdAt: now,
            createdBy: userId
        };

        const docRef = await addDoc(collectionRef, docData);
        return { id: docRef.id, ...docData } as Alert;
    } catch (error) {
        console.error('Error al crear alerta:', error);
        throw error;
    }
};

/**
 * Obtener alertas con filtros
 */
export const obtenerAlertas = async (
    orgId: string,
    filtros?: {
        plotId?: string;
        fieldId?: string;
        tipo?: TipoAlerta;
        severidad?: NivelSeveridad;
        soloNoLeidas?: boolean;
        soloNoResueltas?: boolean;
        limite?: number;
    }
): Promise<Alert[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${COLLECTION}`);
        let constraints: any[] = [orderBy('fechaDeteccion', 'desc')];

        if (filtros?.plotId) {
            constraints = [where('plotId', '==', filtros.plotId), ...constraints];
        }
        if (filtros?.fieldId) {
            constraints = [where('fieldId', '==', filtros.fieldId), ...constraints];
        }
        if (filtros?.soloNoResueltas) {
            constraints = [where('resuelta', '==', false), ...constraints];
        }
        if (filtros?.limite) {
            constraints = [...constraints, limit(filtros.limite)];
        }

        const q = query(collectionRef, ...constraints);
        const snapshot = await getDocs(q);

        let alertas = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fechaDeteccion: data.fechaDeteccion?.toDate?.() || data.fechaDeteccion,
                createdAt: data.createdAt?.toDate?.() || data.createdAt
            } as Alert;
        });

        // Filtros adicionales en memoria
        if (filtros?.tipo) {
            alertas = alertas.filter(a => a.tipo === filtros.tipo);
        }
        if (filtros?.severidad) {
            alertas = alertas.filter(a => a.severidad === filtros.severidad);
        }
        if (filtros?.soloNoLeidas) {
            alertas = alertas.filter(a => !a.leida);
        }

        return alertas;
    } catch (error) {
        console.error('Error al obtener alertas:', error);
        throw error;
    }
};

/**
 * Obtener alertas críticas no resueltas
 */
export const obtenerAlertasCriticas = async (
    orgId: string
): Promise<Alert[]> => {
    return obtenerAlertas(orgId, {
        severidad: 'critical',
        soloNoResueltas: true
    });
};

/**
 * Obtener conteo de alertas no leídas
 */
export const obtenerConteoNoLeidas = async (
    orgId: string
): Promise<number> => {
    const alertas = await obtenerAlertas(orgId, { soloNoLeidas: true });
    return alertas.length;
};

/**
 * Marcar alerta como leída
 */
export const marcarComoLeida = async (
    orgId: string,
    alertId: string
): Promise<void> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${COLLECTION}/${alertId}`);
        await updateDoc(docRef, { leida: true });
    } catch (error) {
        console.error('Error al marcar alerta como leída:', error);
        throw error;
    }
};

/**
 * Marcar todas como leídas
 */
export const marcarTodasComoLeidas = async (
    orgId: string
): Promise<void> => {
    const alertas = await obtenerAlertas(orgId, { soloNoLeidas: true });
    await Promise.all(
        alertas.map(a => marcarComoLeida(orgId, a.id))
    );
};

/**
 * Resolver alerta
 */
export const resolverAlerta = async (
    orgId: string,
    alertId: string,
    notas?: string
): Promise<void> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${COLLECTION}/${alertId}`);
        await updateDoc(docRef, {
            resuelta: true,
            fechaResolucion: new Date(),
            resolucionNotas: notas || null
        });
    } catch (error) {
        console.error('Error al resolver alerta:', error);
        throw error;
    }
};

/**
 * Crear alerta desde análisis satelital
 */
export const crearAlertaDesdeAnalisis = async (
    orgId: string,
    plotId: string,
    analisis: {
        ndviPromedio?: number;
        estresHidrico?: boolean;
        anomaliasDetectadas?: string[];
    },
    userId: string
): Promise<Alert[]> => {
    const alertasCreadas: Alert[] = [];

    // Alerta por NDVI bajo
    if (analisis.ndviPromedio !== undefined && analisis.ndviPromedio < 0.3) {
        const alerta = await crearAlerta(orgId, {
            plotId,
            tipo: 'ndvi_bajo',
            severidad: analisis.ndviPromedio < 0.2 ? 'critical' : 'warning',
            titulo: 'NDVI bajo detectado',
            descripcion: `El índice de vegetación del lote es ${(analisis.ndviPromedio * 100).toFixed(0)}%, muy por debajo del valor esperado.`,
            accionSugerida: 'Revisar el estado del cultivo y verificar riego/fertilización.',
            fechaDeteccion: new Date(),
            origenTipo: 'satellite_analysis'
        }, userId);
        alertasCreadas.push(alerta);
    }

    // Alerta por estrés hídrico
    if (analisis.estresHidrico) {
        const alerta = await crearAlerta(orgId, {
            plotId,
            tipo: 'estres_hidrico',
            severidad: 'warning',
            titulo: 'Estrés hídrico detectado',
            descripcion: 'El análisis satelital detectó signos de estrés hídrico en el cultivo.',
            accionSugerida: 'Evaluar la posibilidad de riego suplementario.',
            fechaDeteccion: new Date(),
            origenTipo: 'satellite_analysis'
        }, userId);
        alertasCreadas.push(alerta);
    }

    return alertasCreadas;
};

/**
 * Obtener resumen de alertas
 */
export const obtenerResumenAlertas = async (
    orgId: string
): Promise<{
    total: number;
    noLeidas: number;
    criticas: number;
    porTipo: Record<TipoAlerta, number>;
}> => {
    const alertas = await obtenerAlertas(orgId, { soloNoResueltas: true });

    const porTipo: Record<string, number> = {};
    let criticas = 0;
    let noLeidas = 0;

    alertas.forEach(a => {
        if (!a.leida) noLeidas++;
        if (a.severidad === 'critical') criticas++;
        porTipo[a.tipo] = (porTipo[a.tipo] || 0) + 1;
    });

    return {
        total: alertas.length,
        noLeidas,
        criticas,
        porTipo: porTipo as Record<TipoAlerta, number>
    };
};
