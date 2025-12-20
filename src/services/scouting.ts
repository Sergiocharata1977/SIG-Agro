/**
 * Servicio de Scouting (Recorridas de Campo)
 * CRUD para observaciones georreferenciadas con fotos
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
    where,
    orderBy,
    limit,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import type {
    ScoutingObservation,
    ScoutingPhoto,
    ScoutingSession,
    TipoObservacion,
    EstadoObservacion,
    SeveridadProblema
} from '@/types/scouting';

const OBSERVATIONS_COLLECTION = 'scouting_observations';
const SESSIONS_COLLECTION = 'scouting_sessions';

// ============================================
// OBSERVACIONES
// ============================================

/**
 * Crear nueva observación de scouting
 */
export const crearObservacion = async (
    orgId: string,
    observacion: Omit<ScoutingObservation, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>,
    userId: string
): Promise<ScoutingObservation> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${OBSERVATIONS_COLLECTION}`);
        const now = new Date();

        const docData = {
            ...observacion,
            organizationId: orgId,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
            createdBy: userId
        };

        const docRef = await addDoc(collectionRef, docData);

        return {
            id: docRef.id,
            ...observacion,
            organizationId: orgId,
            createdAt: now,
            updatedAt: now
        };
    } catch (error) {
        console.error('Error al crear observación:', error);
        throw error;
    }
};

/**
 * Obtener observaciones con filtros
 */
export const obtenerObservaciones = async (
    orgId: string,
    filtros?: {
        plotId?: string;
        fieldId?: string;
        tipo?: TipoObservacion;
        estado?: EstadoObservacion;
        urgentesOnly?: boolean;
        limite?: number;
    }
): Promise<ScoutingObservation[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${OBSERVATIONS_COLLECTION}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let constraints: any[] = [orderBy('createdAt', 'desc')];

        if (filtros?.plotId) {
            constraints = [where('plotId', '==', filtros.plotId), ...constraints];
        }
        if (filtros?.fieldId) {
            constraints = [where('fieldId', '==', filtros.fieldId), ...constraints];
        }
        if (filtros?.estado) {
            constraints = [where('estado', '==', filtros.estado), ...constraints];
        }
        if (filtros?.urgentesOnly) {
            constraints = [where('urgente', '==', true), ...constraints];
        }
        if (filtros?.limite) {
            constraints = [...constraints, limit(filtros.limite)];
        }

        const q = query(collectionRef, ...constraints);
        const snapshot = await getDocs(q);

        let observaciones = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
                fechaResolucion: data.fechaResolucion?.toDate?.() || data.fechaResolucion,
                fotos: (data.fotos || []).map((f: ScoutingPhoto) => ({
                    ...f,
                    timestamp: f.timestamp instanceof Timestamp ? f.timestamp.toDate() : f.timestamp
                }))
            } as ScoutingObservation;
        });

        // Filtro adicional en memoria para tipo
        if (filtros?.tipo) {
            observaciones = observaciones.filter(o => o.tipo === filtros.tipo);
        }

        return observaciones;
    } catch (error) {
        console.error('Error al obtener observaciones:', error);
        throw error;
    }
};

/**
 * Obtener una observación por ID
 */
export const obtenerObservacion = async (
    orgId: string,
    obsId: string
): Promise<ScoutingObservation | null> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${OBSERVATIONS_COLLECTION}/${obsId}`);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.data();
        return {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        } as ScoutingObservation;
    } catch (error) {
        console.error('Error al obtener observación:', error);
        throw error;
    }
};

/**
 * Actualizar observación
 */
export const actualizarObservacion = async (
    orgId: string,
    obsId: string,
    data: Partial<ScoutingObservation>
): Promise<void> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${OBSERVATIONS_COLLECTION}/${obsId}`);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error al actualizar observación:', error);
        throw error;
    }
};

/**
 * Resolver observación
 */
export const resolverObservacion = async (
    orgId: string,
    obsId: string,
    notas?: string
): Promise<void> => {
    await actualizarObservacion(orgId, obsId, {
        estado: 'resuelta',
        fechaResolucion: new Date(),
        notasResolucion: notas
    });
};

/**
 * Eliminar observación
 */
export const eliminarObservacion = async (
    orgId: string,
    obsId: string
): Promise<void> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${OBSERVATIONS_COLLECTION}/${obsId}`);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error al eliminar observación:', error);
        throw error;
    }
};

// ============================================
// FOTOS
// ============================================

/**
 * Subir foto de scouting a Firebase Storage
 */
export const subirFotoScouting = async (
    orgId: string,
    obsId: string,
    file: File | Blob,
    geoData: { latitude: number; longitude: number; accuracy?: number }
): Promise<ScoutingPhoto> => {
    try {
        const timestamp = new Date();
        const fileName = `scouting_${obsId}_${timestamp.getTime()}.jpg`;
        const storagePath = `organizations/${orgId}/scouting/${obsId}/${fileName}`;

        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);

        const url = await getDownloadURL(storageRef);

        const photo: ScoutingPhoto = {
            id: fileName,
            url,
            timestamp,
            latitude: geoData.latitude,
            longitude: geoData.longitude,
            accuracy: geoData.accuracy
        };

        return photo;
    } catch (error) {
        console.error('Error al subir foto:', error);
        throw error;
    }
};

/**
 * Agregar foto a una observación existente
 */
export const agregarFotoAObservacion = async (
    orgId: string,
    obsId: string,
    file: File | Blob,
    geoData: { latitude: number; longitude: number; accuracy?: number }
): Promise<ScoutingPhoto> => {
    // Subir foto
    const photo = await subirFotoScouting(orgId, obsId, file, geoData);

    // Obtener observación actual
    const obs = await obtenerObservacion(orgId, obsId);
    if (!obs) throw new Error('Observación no encontrada');

    // Actualizar con nueva foto
    const fotosActualizadas = [...(obs.fotos || []), photo];
    await actualizarObservacion(orgId, obsId, { fotos: fotosActualizadas });

    return photo;
};

// ============================================
// ESTADÍSTICAS
// ============================================

/**
 * Obtener resumen de observaciones
 */
export const obtenerResumenScouting = async (
    orgId: string,
    plotId?: string
): Promise<{
    total: number;
    pendientes: number;
    criticas: number;
    porTipo: Record<TipoObservacion, number>;
    porSeveridad: Record<SeveridadProblema, number>;
}> => {
    const observaciones = await obtenerObservaciones(orgId, { plotId });

    const porTipo: Record<string, number> = {};
    const porSeveridad: Record<string, number> = {};
    let pendientes = 0;
    let criticas = 0;

    observaciones.forEach(obs => {
        // Por tipo
        porTipo[obs.tipo] = (porTipo[obs.tipo] || 0) + 1;

        // Por severidad
        if (obs.severidad) {
            porSeveridad[obs.severidad] = (porSeveridad[obs.severidad] || 0) + 1;
        }

        // Pendientes
        if (obs.estado === 'pendiente') pendientes++;

        // Críticas
        if (obs.severidad === 'critico' || obs.urgente) criticas++;
    });

    return {
        total: observaciones.length,
        pendientes,
        criticas,
        porTipo: porTipo as Record<TipoObservacion, number>,
        porSeveridad: porSeveridad as Record<SeveridadProblema, number>
    };
};

/**
 * Obtener observaciones cercanas a una coordenada
 */
export const obtenerObservacionesCercanas = async (
    orgId: string,
    lat: number,
    lng: number,
    radioKm: number = 1
): Promise<ScoutingObservation[]> => {
    const todas = await obtenerObservaciones(orgId);

    // Filtrar por distancia (fórmula de Haversine simplificada)
    return todas.filter(obs => {
        const dLat = (obs.latitude - lat) * (Math.PI / 180);
        const dLng = (obs.longitude - lng) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat * (Math.PI / 180)) * Math.cos(obs.latitude * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distancia = 6371 * c; // Radio de la Tierra en km

        return distancia <= radioKm;
    });
};

// ============================================
// GEOLOCALIZACIÓN
// ============================================

/**
 * Obtener ubicación actual del dispositivo
 */
export const obtenerUbicacionActual = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no soportada'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
};

/**
 * Encontrar el lote más cercano a una coordenada
 * (Placeholder - requiere implementación con datos de lotes)
 */
export const encontrarLoteCercano = async (
    orgId: string,
    lat: number,
    lng: number
): Promise<string | null> => {
    // TODO: Implementar cuando tengamos acceso a los polígonos de los lotes
    // Por ahora retorna null
    console.log('Buscando lote cercano a:', lat, lng);
    return null;
};
