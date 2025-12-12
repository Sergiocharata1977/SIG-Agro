/**
 * Servicio de Productores
 * CRUD para la colección agro_productores
 */

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Productor } from '@/types';

const COLLECTION = 'agro_productores';

/**
 * Obtiene un productor por ID
 */
export async function obtenerProductor(productorId: string): Promise<Productor | null> {
    try {
        const productorRef = doc(db, COLLECTION, productorId);
        const snapshot = await getDoc(productorRef);

        if (!snapshot.exists()) {
            return null;
        }

        const data = snapshot.data();
        return {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Productor;
    } catch (error) {
        console.error('Error al obtener productor:', error);
        throw error;
    }
}

/**
 * Crea o actualiza un productor
 */
export async function guardarProductor(
    productorId: string,
    data: Omit<Productor, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
    try {
        const productorRef = doc(db, COLLECTION, productorId);
        const existing = await getDoc(productorRef);

        if (existing.exists()) {
            // Actualizar
            await updateDoc(productorRef, {
                ...data,
                updatedAt: Timestamp.now(),
            });
        } else {
            // Crear
            await setDoc(productorRef, {
                ...data,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
        }
    } catch (error) {
        console.error('Error al guardar productor:', error);
        throw error;
    }
}

/**
 * Actualiza el perfil de un productor
 */
export async function actualizarPerfil(
    productorId: string,
    data: Partial<Pick<Productor, 'nombre' | 'apellido' | 'telefono' | 'dni' | 'localidad' | 'direccion' | 'razonSocial' | 'cuit'>>
): Promise<void> {
    try {
        const productorRef = doc(db, COLLECTION, productorId);

        await updateDoc(productorRef, {
            ...data,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        throw error;
    }
}
