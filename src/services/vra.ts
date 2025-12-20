/**
 * Servicio de VRA (Variable Rate Application)
 * Zonificación automática y generación de prescripciones
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
    Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type {
    ZonaManejo,
    Prescripcion,
    ResultadoZonificacion,
    TipoPrescripcion,
    FormatoExportacion,
    ZONAS_DEFAULT
} from '@/types/vra';

const PRESCRIPCIONES_COLLECTION = 'prescripciones';

// ============================================
// ZONIFICACIÓN (Clustering)
// ============================================

/**
 * Algoritmo K-means simplificado para zonificación
 * Agrupa valores de un índice en N clusters
 */
export function kMeansClustering(
    valores: number[],
    numClusters: number = 3,
    maxIteraciones: number = 100
): { clusters: number[][]; centroids: number[] } {
    if (valores.length === 0) return { clusters: [], centroids: [] };

    // Inicializar centroides con valores min/max distribuidos
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const step = (max - min) / numClusters;

    let centroids = Array.from({ length: numClusters }, (_, i) => min + step * (i + 0.5));

    let clusters: number[][] = [];

    for (let iter = 0; iter < maxIteraciones; iter++) {
        // Asignar cada valor al centroide más cercano
        clusters = Array.from({ length: numClusters }, () => []);

        for (const valor of valores) {
            let minDist = Infinity;
            let clusterIdx = 0;

            for (let i = 0; i < centroids.length; i++) {
                const dist = Math.abs(valor - centroids[i]);
                if (dist < minDist) {
                    minDist = dist;
                    clusterIdx = i;
                }
            }

            clusters[clusterIdx].push(valor);
        }

        // Recalcular centroides
        const newCentroids = clusters.map(cluster => {
            if (cluster.length === 0) return 0;
            return cluster.reduce((sum, v) => sum + v, 0) / cluster.length;
        });

        // Verificar convergencia
        const converged = centroids.every((c, i) => Math.abs(c - newCentroids[i]) < 0.001);
        centroids = newCentroids;

        if (converged) break;
    }

    return { clusters, centroids };
}

/**
 * Generar zonas de manejo desde datos de índice
 */
export function generarZonasManejo(
    datosIndice: { valor: number; lat: number; lng: number }[],
    numZonas: number = 3,
    nombresZonas?: string[],
    coloresZonas?: string[]
): ZonaManejo[] {
    if (datosIndice.length === 0) return [];

    const valores = datosIndice.map(d => d.valor);
    const { clusters, centroids } = kMeansClustering(valores, numZonas);

    // Ordenar clusters por centroide (de menor a mayor)
    const clusterInfo = centroids.map((centroid, idx) => ({
        centroid,
        originalIdx: idx,
        cluster: clusters[idx]
    })).sort((a, b) => a.centroid - b.centroid);

    const defaultNombres = ['Zona Baja', 'Zona Media', 'Zona Alta'];
    const defaultColores = ['#EF4444', '#EAB308', '#22C55E'];

    // Si hay más de 3 zonas, interpolar nombres/colores
    const nombres = nombresZonas || (numZonas === 3
        ? defaultNombres
        : Array.from({ length: numZonas }, (_, i) => `Zona ${i + 1}`));

    const colores = coloresZonas || (numZonas === 3
        ? defaultColores
        : Array.from({ length: numZonas }, (_, i) => {
            const hue = (120 * i) / (numZonas - 1); // De rojo (0) a verde (120)
            return `hsl(${hue}, 70%, 50%)`;
        }));

    const areaTotal = datosIndice.length; // Simplificado: 1 punto = 1 unidad

    return clusterInfo.map((info, idx) => {
        const clusterVals = info.cluster;
        return {
            id: `zona_${idx + 1}`,
            nombre: nombres[idx] || `Zona ${idx + 1}`,
            color: colores[idx] || '#808080',
            indicePromedio: info.centroid,
            indiceMin: clusterVals.length > 0 ? Math.min(...clusterVals) : 0,
            indiceMax: clusterVals.length > 0 ? Math.max(...clusterVals) : 0,
            areaHa: clusterVals.length, // Placeholder
            porcentajeLote: (clusterVals.length / areaTotal) * 100,
            poligonos: [] // Se llenarían con geometría real
        };
    });
}

// ============================================
// PRESCRIPCIONES
// ============================================

/**
 * Crear una prescripción de aplicación variable
 */
export const crearPrescripcion = async (
    orgId: string,
    prescripcion: Omit<Prescripcion, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>,
    userId: string
): Promise<Prescripcion> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${PRESCRIPCIONES_COLLECTION}`);
        const now = new Date();

        const docData = {
            ...prescripcion,
            organizationId: orgId,
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
            createdBy: userId
        };

        const docRef = await addDoc(collectionRef, docData);

        return {
            id: docRef.id,
            ...prescripcion,
            organizationId: orgId,
            createdAt: now,
            updatedAt: now
        };
    } catch (error) {
        console.error('Error al crear prescripción:', error);
        throw error;
    }
};

/**
 * Obtener prescripciones
 */
export const obtenerPrescripciones = async (
    orgId: string,
    filtros?: {
        plotId?: string;
        tipo?: TipoPrescripcion;
        estado?: Prescripcion['estado'];
        limite?: number;
    }
): Promise<Prescripcion[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${PRESCRIPCIONES_COLLECTION}`);
        let constraints: any[] = [orderBy('createdAt', 'desc')];

        if (filtros?.plotId) {
            constraints = [where('plotId', '==', filtros.plotId), ...constraints];
        }
        if (filtros?.estado) {
            constraints = [where('estado', '==', filtros.estado), ...constraints];
        }

        const q = query(collectionRef, ...constraints);
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
                fechaCreacion: data.fechaCreacion?.toDate?.() || data.fechaCreacion,
                fechaAplicacion: data.fechaAplicacion?.toDate?.() || data.fechaAplicacion,
            } as Prescripcion;
        });
    } catch (error) {
        console.error('Error al obtener prescripciones:', error);
        throw error;
    }
};

/**
 * Generar prescripción desde zonas de manejo
 */
export function generarPrescripcionDesdeZonas(
    zonas: ZonaManejo[],
    tipo: TipoPrescripcion,
    productoNombre: string,
    unidad: string,
    dosisBase: number,
    factorAjuste: number = 0.2 // Variación del 20% entre zonas
): Omit<Prescripcion, 'id' | 'organizationId' | 'plotId' | 'createdAt' | 'updatedAt' | 'createdBy'> {
    // Calcular dosis por zona
    const zonasConDosis = zonas.map((zona, idx) => {
        // Ajustar dosis según el índice promedio de la zona
        // Zonas bajas reciben más, zonas altas reciben menos
        const factorZona = 1 + ((zonas.length - 1 - idx) * factorAjuste / (zonas.length - 1)) - (factorAjuste / 2);
        const dosis = Math.round(dosisBase * factorZona * 10) / 10;
        const dosisTotal = Math.round(dosis * zona.areaHa * 10) / 10;

        return {
            zonaId: zona.id,
            zonaNombre: zona.nombre,
            dosis,
            dosisTotal,
            areaHa: zona.areaHa
        };
    });

    const areaTotal = zonas.reduce((sum, z) => sum + z.areaHa, 0);
    const cantidadTotal = zonasConDosis.reduce((sum, z) => sum + z.dosisTotal, 0);
    const dosisPromedio = areaTotal > 0 ? cantidadTotal / areaTotal : 0;

    return {
        tipo,
        fechaCreacion: new Date(),
        productoNombre,
        unidad,
        zonas: zonasConDosis,
        dosisPromedio: Math.round(dosisPromedio * 10) / 10,
        cantidadTotal: Math.round(cantidadTotal * 10) / 10,
        estado: 'borrador'
    };
}

// ============================================
// EXPORTACIÓN
// ============================================

/**
 * Exportar prescripción a GeoJSON
 */
export function exportarAGeoJSON(prescripcion: Prescripcion, zonas: ZonaManejo[]): string {
    const features = prescripcion.zonas.map(zonaPrescripcion => {
        const zonaOriginal = zonas.find(z => z.id === zonaPrescripcion.zonaId);

        return {
            type: 'Feature',
            properties: {
                zonaNombre: zonaPrescripcion.zonaNombre,
                dosis: zonaPrescripcion.dosis,
                unidad: prescripcion.unidad,
                producto: prescripcion.productoNombre,
                areaHa: zonaPrescripcion.areaHa
            },
            geometry: zonaOriginal?.poligonos[0] || null
        };
    });

    return JSON.stringify({
        type: 'FeatureCollection',
        properties: {
            tipo: prescripcion.tipo,
            producto: prescripcion.productoNombre,
            fechaCreacion: prescripcion.fechaCreacion
        },
        features
    }, null, 2);
}

/**
 * Exportar prescripción a ISOXML (simplificado)
 * Formato compatible con tractores ISOBUS
 */
export function exportarAISOXML(prescripcion: Prescripcion): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ISO11783_TaskData VersionMajor="4" VersionMinor="3" ManagementSoftwareManufacturer="SIG-Agro" ManagementSoftwareVersion="1.0">
    <TSK A="${prescripcion.id}" B="${prescripcion.productoNombre}" G="1">
        <TZN A="1" B="0" C="${prescripcion.tipo}">
            ${prescripcion.zonas.map((zona, idx) => `
            <PDV A="${zona.dosis}" B="1" E="${zona.zonaId}"/>
            `).join('')}
        </TZN>
    </TSK>
</ISO11783_TaskData>`;

    return xml;
}

/**
 * Exportar prescripción al formato seleccionado
 */
export function exportarPrescripcion(
    prescripcion: Prescripcion,
    zonas: ZonaManejo[],
    formato: FormatoExportacion
): { contenido: string; mimeType: string; extension: string } {
    switch (formato) {
        case 'geojson':
            return {
                contenido: exportarAGeoJSON(prescripcion, zonas),
                mimeType: 'application/geo+json',
                extension: '.geojson'
            };
        case 'isoxml':
            return {
                contenido: exportarAISOXML(prescripcion),
                mimeType: 'application/xml',
                extension: '.xml'
            };
        case 'kml':
            // Simplificado - usar GeoJSON como base
            return {
                contenido: exportarAGeoJSON(prescripcion, zonas),
                mimeType: 'application/vnd.google-earth.kml+xml',
                extension: '.kml'
            };
        default:
            throw new Error(`Formato no soportado: ${formato}`);
    }
}
