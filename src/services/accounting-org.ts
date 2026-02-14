import {
    collection,
    doc,
    addDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    runTransaction,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Account, JournalEntry, JournalEntryLine } from '@/types/accounting';

const getAccountsPath = (orgId: string) => `organizations/${orgId}/accounts`;
const getJournalPath = (orgId: string) => `organizations/${orgId}/journal_entries`;
const getCounterPath = (orgId: string) => `organizations/${orgId}/system/accounting_counter`;

function validateJournalLines(lines: JournalEntryLine[]) {
    if (!lines || lines.length < 2) {
        throw new Error('Journal entry must have at least 2 lines');
    }

    const totalDebe = lines.reduce((sum, line) => sum + (line.debe || 0), 0);
    const totalHaber = lines.reduce((sum, line) => sum + (line.haber || 0), 0);

    if (Math.abs(totalDebe - totalHaber) > 0.01) {
        throw new Error(`Unbalanced entry. Debe=${totalDebe}, Haber=${totalHaber}`);
    }
}

export async function createOrgAccount(
    orgId: string,
    account: Omit<Account, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>
) {
    const now = new Date();
    const accountsRef = collection(db, getAccountsPath(orgId));

    const exists = await getDocs(
        query(accountsRef, where('codigo', '==', account.codigo), limit(1))
    );
    if (!exists.empty) {
        throw new Error(`Account code already exists: ${account.codigo}`);
    }

    const ref = await addDoc(accountsRef, {
        ...account,
        orgId,
        active: account.active ?? true,
        createdAt: now,
        updatedAt: now,
    });

    return { id: ref.id, ...account, orgId, createdAt: now, updatedAt: now };
}

export async function getOrgAccounts(orgId: string): Promise<Account[]> {
    const snapshot = await getDocs(
        query(
            collection(db, getAccountsPath(orgId)),
            where('active', '==', true),
            orderBy('codigo', 'asc')
        )
    );

    return snapshot.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Account;
    });
}

export async function createOrgJournalEntry(
    orgId: string,
    entry: Omit<JournalEntry, 'id' | 'orgId' | 'numero' | 'createdAt' | 'updatedAt'>
) {
    validateJournalLines(entry.lineas);

    const result = await runTransaction(db, async (tx) => {
        const counterRef = doc(db, getCounterPath(orgId));
        const counterSnap = await tx.get(counterRef);
        const current = counterSnap.exists() ? (counterSnap.data().journalEntryNumber || 0) : 0;
        const nextNumber = current + 1;

        const journalRef = doc(collection(db, getJournalPath(orgId)));
        const now = new Date();

        const totalDebe = entry.lineas.reduce((sum, line) => sum + (line.debe || 0), 0);
        const totalHaber = entry.lineas.reduce((sum, line) => sum + (line.haber || 0), 0);

        tx.set(journalRef, {
            ...entry,
            orgId,
            numero: nextNumber,
            totalDebe,
            totalHaber,
            fecha: entry.fecha instanceof Date ? entry.fecha : new Date(entry.fecha),
            createdAt: now,
            updatedAt: now,
        });

        tx.set(
            counterRef,
            { journalEntryNumber: nextNumber, updatedAt: now },
            { merge: true }
        );

        return { id: journalRef.id, numero: nextNumber, totalDebe, totalHaber, now };
    });

    return {
        id: result.id,
        ...entry,
        orgId,
        numero: result.numero,
        totalDebe: result.totalDebe,
        totalHaber: result.totalHaber,
        createdAt: result.now,
        updatedAt: result.now,
    };
}

export async function getOrgJournalEntries(orgId: string, limitCount = 100): Promise<JournalEntry[]> {
    const snapshot = await getDocs(
        query(
            collection(db, getJournalPath(orgId)),
            orderBy('fecha', 'desc'),
            orderBy('numero', 'desc'),
            limit(limitCount)
        )
    );

    return snapshot.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : new Date(data.fecha),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as JournalEntry;
    });
}

export async function getOrgJournalEntry(orgId: string, entryId: string): Promise<JournalEntry | null> {
    const snap = await getDoc(doc(db, `${getJournalPath(orgId)}/${entryId}`));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
        id: snap.id,
        ...data,
        fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : new Date(data.fecha),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as JournalEntry;
}
