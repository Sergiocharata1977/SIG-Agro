/**
 * Servicio para Eventos/Labores Agrícolas
 * CRUD y operaciones de eventos
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
import { Evento, TipoEvento, EstadoEvento } from '@/types';

const PRODUCTORES = 'agro_productores';

/**
 * Obtiene la colección de eventos
 */
function getEventosCollection(productorId: string) {
    return collection(db, PRODUCTORES, productorId, 'eventos');
}

/**
 * Crear un nuevo evento
 */
export async function crearEvento(
    productorId: string,
    data: Omit<Evento, 'id' | 'productorId' | 'createdAt' | 'updatedAt'>
): Promise<Evento> {
    const eventoData = {
        ...data,
        productorId,
        estado: data.estado || 'programado',
        fecha: Timestamp.fromDate(data.fecha),
        costoTotal: calcularCostoTotal(data),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(getEventosCollection(productorId), eventoData);

    return {
        id: docRef.id,
        ...data,
        productorId,
        estado: eventoData.estado as EstadoEvento,
        costoTotal: eventoData.costoTotal,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Calcular costo total del evento
 */
function calcularCostoTotal(data: Partial<Evento>): number {
    let total = 0;

    if (data.costoManoObra) total += data.costoManoObra;
    if (data.costoMaquinaria) total += data.costoMaquinaria;
    if (data.costoInsumos) total += data.costoInsumos;

    // Sumar costo de productos
    if (data.productos) {
        data.productos.forEach((p) => {
            if (p.costoTotal) total += p.costoTotal;
        });
    }

    return total;
}

/**
 * Obtener eventos de una campaña
 */
export async function obtenerEventosCampania(
    productorId: string,
    campaniaId: string
): Promise<Evento[]> {
    const q = query(
        getEventosCollection(productorId),
        where('campaniaId', '==', campaniaId),
        orderBy('fecha', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            fecha: data.fecha?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Evento;
    });
}

/**
 * Obtener eventos de un lote
 */
export async function obtenerEventosLote(
    productorId: string,
    loteId: string
): Promise<Evento[]> {
    const q = query(
        getEventosCollection(productorId),
        where('loteId', '==', loteId),
        orderBy('fecha', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            fecha: data.fecha?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Evento;
    });
}

/**
 * Obtener un evento por ID
 */
export async function obtenerEvento(
    productorId: string,
    eventoId: string
): Promise<Evento | null> {
    const docRef = doc(db, PRODUCTORES, productorId, 'eventos', eventoId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
        id: snapshot.id,
        ...data,
        fecha: data.fecha?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Evento;
}

/**
 * Actualizar un evento
 */
export async function actualizarEvento(
    productorId: string,
    eventoId: string,
    data: Partial<Evento>
): Promise<void> {
    const docRef = doc(db, PRODUCTORES, productorId, 'eventos', eventoId);

    const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: Timestamp.now(),
    };

    if (data.fecha) updateData.fecha = Timestamp.fromDate(data.fecha);

    // Recalcular costo total
    updateData.costoTotal = calcularCostoTotal(data);

    await updateDoc(docRef, updateData);
}

/**
 * Marcar evento como completado
 */
export async function completarEvento(
    productorId: string,
    eventoId: string
): Promise<void> {
    const docRef = doc(db, PRODUCTORES, productorId, 'eventos', eventoId);

    await updateDoc(docRef, {
        estado: 'completado',
        updatedAt: Timestamp.now(),
    });
}

/**
 * Obtener resumen de costos por tipo de evento
 */
export async function obtenerResumenCostosCampania(
    productorId: string,
    campaniaId: string
): Promise<Record<TipoEvento, number>> {
    const eventos = await obtenerEventosCampania(productorId, campaniaId);

    const resumen: Record<string, number> = {};

    eventos.forEach((evento) => {
        if (!resumen[evento.tipo]) {
            resumen[evento.tipo] = 0;
        }
        resumen[evento.tipo] += evento.costoTotal || 0;
    });

    return resumen as Record<TipoEvento, number>;
}
