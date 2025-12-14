import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Campo, Lote } from '@/types/agro';

// ============================================
// CAMPOS
// ============================================

/**
 * Crear un nuevo campo en la organización
 */
export const crearCampo = async (orgId: string, campo: Omit<Campo, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/campos`);
        const now = new Date();

        const docRef = await addDoc(collectionRef, {
            ...campo,
            createdAt: now,
            updatedAt: now,
            activo: true
        });

        return { id: docRef.id, ...campo };
    } catch (error) {
        console.error('Error al crear campo:', error);
        throw error;
    }
};

/**
 * Obtener todos los campos de la organización
 */
export const obtenerCampos = async (orgId: string): Promise<Campo[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/campos`);
        const q = query(collectionRef, where('activo', '==', true));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Deserializar perimetro si es string JSON
            let perimetro = data.perimetro;
            if (typeof perimetro === 'string') {
                try {
                    perimetro = JSON.parse(perimetro);
                } catch {
                    perimetro = null;
                }
            }
            return {
                id: doc.id,
                ...data,
                perimetro
            } as Campo;
        });
    } catch (error) {
        console.error('Error al obtener campos:', error);
        throw error;
    }
};

/**
 * Obtener un campo por ID
 */
export const obtenerCampo = async (orgId: string, campoId: string): Promise<Campo | null> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/campos/${campoId}`);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.data();
        let perimetro = data.perimetro;
        if (typeof perimetro === 'string') {
            try {
                perimetro = JSON.parse(perimetro);
            } catch {
                perimetro = null;
            }
        }

        return {
            id: snapshot.id,
            ...data,
            perimetro
        } as Campo;
    } catch (error) {
        console.error('Error al obtener campo:', error);
        throw error;
    }
};

/**
 * Actualizar un campo
 */
export const actualizarCampo = async (orgId: string, campoId: string, data: Partial<Campo>) => {
    try {
        const docRef = doc(db, `organizations/${orgId}/campos/${campoId}`);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error al actualizar campo:', error);
        throw error;
    }
};

/**
 * Eliminar (dar de baja lógica) un campo
 */
export const eliminarCampo = async (orgId: string, campoId: string) => {
    try {
        const docRef = doc(db, `organizations/${orgId}/campos/${campoId}`);
        await updateDoc(docRef, {
            activo: false,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error al eliminar campo:', error);
        throw error;
    }
};

// ============================================
// LOTES
// ============================================

/**
 * Crear un lote dentro de un campo
 */
export const crearLote = async (orgId: string, campoId: string, lote: Omit<Lote, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        // Los lotes son subcolección de campos? O colección root de la org?
        // Según firestore.rules: organizations/{orgId}/campos/{campoId}/lotes/{loteId}
        const collectionRef = collection(db, `organizations/${orgId}/campos/${campoId}/lotes`);
        const now = new Date();

        const docRef = await addDoc(collectionRef, {
            ...lote,
            createdAt: now,
            updatedAt: now,
            activo: true
        });

        return { id: docRef.id, ...lote };
    } catch (error) {
        console.error('Error al crear lote:', error);
        throw error;
    }
};

/**
 * Obtener lotes de un campo
 */
export const obtenerLotes = async (orgId: string, campoId: string): Promise<Lote[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/campos/${campoId}/lotes`);
        const q = query(collectionRef, where('activo', '==', true));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Deserializar poligono si es string JSON
            let poligono = data.poligono;
            if (typeof poligono === 'string') {
                try {
                    poligono = JSON.parse(poligono);
                } catch {
                    poligono = null;
                }
            }
            return {
                id: doc.id,
                ...data,
                poligono
            } as Lote;
        });
    } catch (error) {
        console.error('Error al obtener lotes:', error);
        throw error;
    }
};

/**
 * Actualizar un lote
 */
export const actualizarLote = async (orgId: string, campoId: string, loteId: string, data: Partial<Lote>) => {
    try {
        const docRef = doc(db, `organizations/${orgId}/campos/${campoId}/lotes/${loteId}`);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error al actualizar lote:', error);
        throw error;
    }
};
