import {
    addDoc,
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    Timestamp,
    where,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { OperationRecord, TipoOperacion } from '@/types/contabilidad-simple';

type CreateOperationInput = {
    productorId: string;
    organizationId: string;
    type: TipoOperacion;
    operationId: string;
    requestId: string;
    descripcion: string;
    fecha: Date;
    amount: number;
    createdBy: string;
    thirdPartyId?: string;
    fieldId?: string;
    plotId?: string;
    campaignId?: string;
    warehouseOriginId?: string;
    warehouseDestinationId?: string;
    journalEntryId?: string;
    stockMovementIds?: string[];
    metadata?: Record<string, unknown>;
};

type AuditInput = {
    productorId: string;
    organizationId: string;
    operationId: string;
    requestId: string;
    event: 'operation_posted' | 'operation_failed';
    actorId: string;
    details?: Record<string, unknown>;
};

const operationsPath = (orgId: string) => `organizations/${orgId}/operations`;
const auditPath = (orgId: string) => `organizations/${orgId}/operation_audit`;

export async function createOperationRecord(input: CreateOperationInput): Promise<string> {
    const ref = collection(db, operationsPath(input.organizationId));
    const now = Timestamp.now();
    const created = await addDoc(ref, {
        productorId: input.productorId,
        organizationId: input.organizationId,
        type: input.type,
        status: 'posted',
        requestId: input.requestId,
        operationId: input.operationId,
        descripcion: input.descripcion,
        fecha: Timestamp.fromDate(input.fecha),
        amount: input.amount,
        thirdPartyId: input.thirdPartyId || null,
        fieldId: input.fieldId || null,
        plotId: input.plotId || null,
        campaignId: input.campaignId || null,
        warehouseOriginId: input.warehouseOriginId || null,
        warehouseDestinationId: input.warehouseDestinationId || null,
        journalEntryId: input.journalEntryId || null,
        stockMovementIds: input.stockMovementIds || [],
        metadata: input.metadata || {},
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
    });
    return created.id;
}

export async function writeOperationAudit(input: AuditInput): Promise<void> {
    await addDoc(collection(db, auditPath(input.organizationId)), {
        productorId: input.productorId,
        organizationId: input.organizationId,
        operationId: input.operationId,
        requestId: input.requestId,
        event: input.event,
        actorId: input.actorId,
        details: input.details || {},
        createdAt: Timestamp.now(),
    });
}

export async function listOperationsByOrg(orgId: string, max = 50): Promise<OperationRecord[]> {
    const snap = await getDocs(
        query(collection(db, operationsPath(orgId)), orderBy('fecha', 'desc'), limit(max))
    );
    return snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            fecha: data.fecha?.toDate?.() || new Date(),
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as OperationRecord;
    });
}

export async function findOperationByRequestId(
    orgId: string,
    requestId: string
): Promise<OperationRecord | null> {
    const snap = await getDocs(
        query(
            collection(db, operationsPath(orgId)),
            where('requestId', '==', requestId),
            limit(1)
        )
    );
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate?.() || new Date(),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as OperationRecord;
}
