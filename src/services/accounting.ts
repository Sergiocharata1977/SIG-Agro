
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
    limit,
    Timestamp,
    runTransaction
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Account, JournalEntry } from '@/types/accounting';

// ============================================
// PLAN DE CUENTAS (ACCOUNTS)
// ============================================

export const crearCuenta = async (orgId: string, account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/accounts`);
        const now = new Date();

        const docRef = await addDoc(collectionRef, {
            ...account,
            createdAt: now,
            updatedAt: now,
            active: true
        });

        return { id: docRef.id, ...account };
    } catch (error) {
        console.error('Error al crear cuenta:', error);
        throw error;
    }
};

export const obtenerCuentas = async (orgId: string): Promise<Account[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/accounts`);
        const q = query(
            collectionRef,
            where('active', '==', true),
            orderBy('codigo', 'asc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Account));
    } catch (error) {
        console.error('Error al obtener cuentas:', error);
        throw error;
    }
};

export const actualizarCuenta = async (orgId: string, accountId: string, data: Partial<Account>) => {
    try {
        const docRef = doc(db, `organizations/${orgId}/accounts/${accountId}`);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error al actualizar cuenta:', error);
        throw error;
    }
};

// ============================================
// ASIENTOS CONTABLES (JOURNAL ENTRIES)
// ============================================

export const crearAsiento = async (orgId: string, entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'numero'>) => {
    try {
        const result = await runTransaction(db, async (transaction) => {
            // 1. Obtener último número de asiento para incrementar
            // Esta lógica simplificada podría tener condiciones de carrera en alta concurrencia real,
            // pero para esta etapa es funcional. Idealmente usar un contador atómico distribuido.
            const entriesRef = collection(db, `organizations/${orgId}/journal_entries`);
            const q = query(entriesRef, orderBy('numero', 'desc'), limit(1));
            const snapshot = await getDocs(q);

            let nextNumber = 1;
            if (!snapshot.empty) {
                nextNumber = snapshot.docs[0].data().numero + 1;
            }

            // 2. Crear el asiento
            const newDocRef = doc(collection(db, `organizations/${orgId}/journal_entries`));
            const now = new Date();

            const newEntry = {
                ...entry,
                numero: nextNumber,
                createdAt: now,
                updatedAt: now
            };

            transaction.set(newDocRef, newEntry);

            return { id: newDocRef.id, ...newEntry };
        });

        return result;
    } catch (error) {
        console.error('Error al crear asiento:', error);
        throw error;
    }
};

export const obtenerAsientos = async (orgId: string, limitCount = 50): Promise<JournalEntry[]> => {
    try {
        const collectionRef = collection(db, `organizations/${orgId}/journal_entries`);
        const q = query(
            collectionRef,
            orderBy('fecha', 'desc'),
            orderBy('numero', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convertir Timestamps si vienen así
                fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : new Date(data.fecha),
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            } as JournalEntry;
        });
    } catch (error) {
        console.error('Error al obtener asientos:', error);
        throw error;
    }
};

export const obtenerAsiento = async (orgId: string, entryId: string): Promise<JournalEntry | null> => {
    try {
        const docRef = doc(db, `organizations/${orgId}/journal_entries/${entryId}`);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) return null;

        const data = snapshot.data();
        return {
            id: snapshot.id,
            ...data,
            fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : new Date(data.fecha),
        } as JournalEntry;
    } catch (error) {
        console.error('Error al obtener asiento:', error);
        throw error;
    }
};
