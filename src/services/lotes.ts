/**
 * Servicio para gestión de Lotes en Firestore
 * Colección: agro_productores/{productorId}/campos/{campoId}/lotes
 */

import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Lote, GeoJSONPolygon, GeoJSONPoint } from '@/types';

const PRODUCTORES_COLLECTION = 'agro_productores';

/**
 * Obtiene la referencia a la colección de lotes de un campo
 */
function getLotesCollection(productorId: string, campoId: string) {
    return collection(
        db,
        PRODUCTORES_COLLECTION,
        productorId,
        'campos',
        campoId,
        'lotes'
    );
}

/**
 * Crea un nuevo lote
 */
export async function crearLote(
    productorId: string,
    campoId: string,
    data: Omit<Lote, 'id' | 'productorId' | 'campoId' | 'createdAt' | 'updatedAt'>
): Promise<Lote> {
    const lotesRef = getLotesCollection(productorId, campoId);

    const loteData = {
        ...data,
        productorId,
        campoId,
        activo: data.activo ?? true,
        estado: data.estado ?? 'barbecho',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(lotesRef, loteData);

    return {
        id: docRef.id,
        ...data,
        productorId,
        campoId,
        activo: loteData.activo,
        estado: loteData.estado,
        createdAt: loteData.createdAt.toDate(),
        updatedAt: loteData.updatedAt.toDate(),
    };
}

/**
 * Obtiene todos los lotes de un campo
 */
export async function obtenerLotes(
    productorId: string,
    campoId: string
): Promise<Lote[]> {
    const lotesRef = getLotesCollection(productorId, campoId);
    const q = query(lotesRef, where('activo', '==', true), orderBy('nombre'));

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Lote;
    });
}

/**
 * Obtiene un lote por ID
 */
export async function obtenerLote(
    productorId: string,
    campoId: string,
    loteId: string
): Promise<Lote | null> {
    const loteRef = doc(
        db,
        PRODUCTORES_COLLECTION,
        productorId,
        'campos',
        campoId,
        'lotes',
        loteId
    );
    const snapshot = await getDoc(loteRef);

    if (!snapshot.exists()) {
        return null;
    }

    const data = snapshot.data();
    return {
        id: snapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Lote;
}

/**
 * Actualiza un lote
 */
export async function actualizarLote(
    productorId: string,
    campoId: string,
    loteId: string,
    data: Partial<Omit<Lote, 'id' | 'productorId' | 'campoId' | 'createdAt'>>
): Promise<void> {
    const loteRef = doc(
        db,
        PRODUCTORES_COLLECTION,
        productorId,
        'campos',
        campoId,
        'lotes',
        loteId
    );

    await updateDoc(loteRef, {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Actualiza el polígono de un lote
 */
export async function actualizarPoligonoLote(
    productorId: string,
    campoId: string,
    loteId: string,
    poligono: GeoJSONPolygon,
    centroide?: GeoJSONPoint
): Promise<void> {
    await actualizarLote(productorId, campoId, loteId, {
        poligono,
        centroide,
    });
}

/**
 * Calcula el centroide de un polígono
 */
export function calcularCentroide(poligono: GeoJSONPolygon): GeoJSONPoint {
    const coords = poligono.coordinates[0]; // Primer anillo (exterior)
    let sumLng = 0;
    let sumLat = 0;

    // Excluir el último punto (duplicado del primero en GeoJSON)
    const numPoints = coords.length - 1;

    for (let i = 0; i < numPoints; i++) {
        sumLng += coords[i][0];
        sumLat += coords[i][1];
    }

    return {
        type: 'Point',
        coordinates: [sumLng / numPoints, sumLat / numPoints],
    };
}

/**
 * Calcula la superficie aproximada en hectáreas
 * Usando fórmula de Shoelace para área en coordenadas geográficas
 */
export function calcularSuperficieHa(poligono: GeoJSONPolygon): number {
    const coords = poligono.coordinates[0];
    const numPoints = coords.length - 1;

    let area = 0;

    for (let i = 0; i < numPoints; i++) {
        const j = (i + 1) % numPoints;
        area += coords[i][0] * coords[j][1];
        area -= coords[j][0] * coords[i][1];
    }

    area = Math.abs(area) / 2;

    // Convertir de grados² a hectáreas (aproximado para latitudes argentinas)
    // 1 grado ≈ 111 km en el ecuador
    // Factor de conversión aproximado para Chaco (~27° S)
    const factorConversion = 111 * 111 * Math.cos((27 * Math.PI) / 180) * 100;

    return area * factorConversion;
}

/**
 * Elimina un lote (soft delete)
 */
export async function eliminarLote(
    productorId: string,
    campoId: string,
    loteId: string
): Promise<void> {
    await actualizarLote(productorId, campoId, loteId, { activo: false });
}
