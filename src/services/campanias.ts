/**
 * Servicio para Campañas Agrícolas
 * CRUD y operaciones de campañas
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
import { Campania, EstadoCampania } from '@/types';

const PRODUCTORES = 'agro_productores';

/**
 * Obtiene la colección de campañas
 */
function getCampaniasCollection(productorId: string) {
    return collection(db, PRODUCTORES, productorId, 'campanias');
}

/**
 * Crear una nueva campaña
 */
export async function crearCampania(
    productorId: string,
    data: Omit<Campania, 'id' | 'productorId' | 'createdAt' | 'updatedAt'>
): Promise<Campania> {
    const campaniaData = {
        ...data,
        productorId,
        estado: data.estado || 'planificada',
        fechaInicio: Timestamp.fromDate(data.fechaInicio),
        fechaSiembra: data.fechaSiembra ? Timestamp.fromDate(data.fechaSiembra) : null,
        fechaCosecha: data.fechaCosecha ? Timestamp.fromDate(data.fechaCosecha) : null,
        fechaFinPrevista: data.fechaFinPrevista ? Timestamp.fromDate(data.fechaFinPrevista) : null,
        fechaFinReal: data.fechaFinReal ? Timestamp.fromDate(data.fechaFinReal) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(getCampaniasCollection(productorId), campaniaData);

    return {
        id: docRef.id,
        ...data,
        productorId,
        estado: campaniaData.estado as EstadoCampania,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Obtener todas las campañas de un productor
 */
export async function obtenerCampanias(productorId: string): Promise<Campania[]> {
    const collectionRef = getCampaniasCollection(productorId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const constraints: any[] = [orderBy('fechaInicio', 'desc')];
    const q = query(
        collectionRef,
        ...constraints
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            fechaInicio: data.fechaInicio?.toDate() || new Date(),
            fechaSiembra: data.fechaSiembra?.toDate() || undefined,
            fechaCosecha: data.fechaCosecha?.toDate() || undefined,
            fechaFinPrevista: data.fechaFinPrevista?.toDate() || undefined,
            fechaFinReal: data.fechaFinReal?.toDate() || undefined,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Campania;
    });
}

/**
 * Obtener campañas de un lote específico
 */
export async function obtenerCampaniasLote(
    productorId: string,
    loteId: string
): Promise<Campania[]> {
    const q = query(
        getCampaniasCollection(productorId),
        where('loteId', '==', loteId),
        orderBy('fechaInicio', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            fechaInicio: data.fechaInicio?.toDate() || new Date(),
            fechaSiembra: data.fechaSiembra?.toDate() || undefined,
            fechaCosecha: data.fechaCosecha?.toDate() || undefined,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Campania;
    });
}

/**
 * Obtener una campaña por ID
 */
export async function obtenerCampania(
    productorId: string,
    campaniaId: string
): Promise<Campania | null> {
    const docRef = doc(db, PRODUCTORES, productorId, 'campanias', campaniaId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
        id: snapshot.id,
        ...data,
        fechaInicio: data.fechaInicio?.toDate() || new Date(),
        fechaSiembra: data.fechaSiembra?.toDate() || undefined,
        fechaCosecha: data.fechaCosecha?.toDate() || undefined,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Campania;
}

/**
 * Actualizar una campaña
 */
export async function actualizarCampania(
    productorId: string,
    campaniaId: string,
    data: Partial<Campania>
): Promise<void> {
    const docRef = doc(db, PRODUCTORES, productorId, 'campanias', campaniaId);

    const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: Timestamp.now(),
    };

    // Convertir fechas a Timestamp
    if (data.fechaInicio) updateData.fechaInicio = Timestamp.fromDate(data.fechaInicio);
    if (data.fechaSiembra) updateData.fechaSiembra = Timestamp.fromDate(data.fechaSiembra);
    if (data.fechaCosecha) updateData.fechaCosecha = Timestamp.fromDate(data.fechaCosecha);

    await updateDoc(docRef, updateData);
}

/**
 * Cambiar estado de una campaña
 */
export async function cambiarEstadoCampania(
    productorId: string,
    campaniaId: string,
    estado: EstadoCampania
): Promise<void> {
    const docRef = doc(db, PRODUCTORES, productorId, 'campanias', campaniaId);

    await updateDoc(docRef, {
        estado,
        ...(estado === 'finalizada' ? { fechaFinReal: Timestamp.now() } : {}),
        updatedAt: Timestamp.now(),
    });
}

/**
 * Registrar cosecha
 */
export async function registrarCosecha(
    productorId: string,
    campaniaId: string,
    data: {
        fechaCosecha: Date;
        rendimiento: number;
        produccionTotal: number;
        humedadCosecha?: number;
    }
): Promise<void> {
    const docRef = doc(db, PRODUCTORES, productorId, 'campanias', campaniaId);

    await updateDoc(docRef, {
        fechaCosecha: Timestamp.fromDate(data.fechaCosecha),
        rendimiento: data.rendimiento,
        produccionTotal: data.produccionTotal,
        humedadCosecha: data.humedadCosecha || null,
        estado: 'finalizada',
        fechaFinReal: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
}
