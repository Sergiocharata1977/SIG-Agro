/**
 * Servicio de Campos (Fields)
 * CRUD para la colección /organizations/{orgId}/fields
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
import type { Field } from '@/types/sig-agro';

const COLLECTION = 'fields';

/**
 * Crear un nuevo campo
 */
export const crearField = async (
    orgId: string,
    field: Omit<Field, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    userId: string
): Promise<Field> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${COLLECTION}`);
        const now = new Date();

        const docData = {
            ...field,
            organizationId: orgId,
            createdAt: now,
            updatedAt: now,
            createdBy: userId
        };

        const docRef = await addDoc(collectionRef, docData);
        return { id: docRef.id, ...docData } as Field;
    } catch (error) {
        console.error('Error al crear field:', error);
        throw error;
    }
};

/**
 * Obtener todos los campos de una organización
 */
export const obtenerFields = async (
    orgId: string,
    filtros?: { activo?: boolean }
): Promise<Field[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/${COLLECTION}`);
        let q = query(collectionRef, orderBy('nombre', 'asc'));

        if (filtros?.activo !== undefined) {
            q = query(collectionRef, where('activo', '==', filtros.activo), orderBy('nombre', 'asc'));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Deserializar perimetro si es string
            let perimetro = data.perimetro;
            if (typeof perimetro === 'string' && perimetro) {
                try {
                    perimetro = JSON.parse(perimetro);
                } catch {
                    // Mantener como string si falla
                }
            }
            return {
                id: doc.id,
                ...data,
                perimetro,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
            } as Field;
        });
    } catch (error) {
        console.error('Error al obtener fields:', error);
        throw error;
    }
};

/**
 * Obtener un campo por ID
 */
export const obtenerField = async (
    orgId: string,
    fieldId: string
): Promise<Field | null> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${COLLECTION}/${fieldId}`);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.data();
        return {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
        } as Field;
    } catch (error) {
        console.error('Error al obtener field:', error);
        throw error;
    }
};

/**
 * Actualizar un campo
 */
export const actualizarField = async (
    orgId: string,
    fieldId: string,
    data: Partial<Field>
): Promise<void> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${COLLECTION}/${fieldId}`);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error al actualizar field:', error);
        throw error;
    }
};

/**
 * Eliminar (desactivar) un campo
 */
export const eliminarField = async (
    orgId: string,
    fieldId: string
): Promise<void> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/${COLLECTION}/${fieldId}`);
        await updateDoc(docRef, {
            activo: false,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error al eliminar field:', error);
        throw error;
    }
};

/**
 * Obtener resumen de campos
 */
export const obtenerResumenFields = async (
    orgId: string
): Promise<{
    total: number;
    superficieTotal: number;
    activos: number;
}> => {
    const fields = await obtenerFields(orgId);
    const activos = fields.filter(f => f.activo);
    const superficieTotal = activos.reduce((acc, f) => acc + (f.superficieTotal || 0), 0);

    return {
        total: fields.length,
        superficieTotal,
        activos: activos.length
    };
};
