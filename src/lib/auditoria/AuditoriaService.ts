import {
    Timestamp,
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    where,
    type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
    type AccionAuditoria,
    type ModuloAuditoria,
    type RegistroAuditoria,
} from '@/types/auditoria';

const AUDITORIA_COLLECTION = 'auditoria';
const ORGANIZATIONS_COLLECTION = 'organizations';

type FiltrosAuditoria = {
    modulo?: ModuloAuditoria;
    accion?: AccionAuditoria;
    usuarioId?: string;
    entidadId?: string;
    desde?: Date;
    hasta?: Date;
};

function getAuditoriaCollection(orgId: string) {
    return collection(db, ORGANIZATIONS_COLLECTION, orgId, AUDITORIA_COLLECTION);
}

function mapRegistroAuditoria(
    id: string,
    orgId: string,
    data: Record<string, unknown>
): RegistroAuditoria {
    return {
        id,
        organizationId: orgId,
        modulo: data.modulo as ModuloAuditoria,
        accion: data.accion as AccionAuditoria,
        entidadId: data.entidadId as string,
        entidadTipo: data.entidadTipo as string,
        entidadDescripcion: data.entidadDescripcion as string,
        usuarioId: data.usuarioId as string,
        usuarioNombre: data.usuarioNombre as string | undefined,
        usuarioEmail: data.usuarioEmail as string | undefined,
        valorAnterior: data.valorAnterior as Record<string, unknown> | undefined,
        valorNuevo: data.valorNuevo as Record<string, unknown> | undefined,
        camposModificados: data.camposModificados as string[] | undefined,
        timestamp: (data.timestamp as Timestamp | undefined)?.toDate() || new Date(),
    };
}

function calcularCamposModificados(
    valorAnterior?: Record<string, unknown>,
    valorNuevo?: Record<string, unknown>
): string[] {
    return Object.keys(valorNuevo || {}).filter(
        (k) => JSON.stringify((valorAnterior || {})[k]) !== JSON.stringify((valorNuevo || {})[k])
    );
}

export class AuditoriaService {
    static async registrar(
        orgId: string,
        data: Omit<RegistroAuditoria, 'id' | 'organizationId' | 'timestamp'>
    ): Promise<void> {
        const auditoriaRef = getAuditoriaCollection(orgId);

        await addDoc(auditoriaRef, {
            ...data,
            organizationId: orgId,
            camposModificados: calcularCamposModificados(data.valorAnterior, data.valorNuevo),
            timestamp: Timestamp.now(),
        });
    }

    static async obtenerRegistros(
        orgId: string,
        filtros?: FiltrosAuditoria
    ): Promise<RegistroAuditoria[]> {
        const constraints: QueryConstraint[] = [];

        if (filtros?.modulo) {
            constraints.push(where('modulo', '==', filtros.modulo));
        }

        if (filtros?.accion) {
            constraints.push(where('accion', '==', filtros.accion));
        }

        if (filtros?.usuarioId) {
            constraints.push(where('usuarioId', '==', filtros.usuarioId));
        }

        if (filtros?.entidadId) {
            constraints.push(where('entidadId', '==', filtros.entidadId));
        }

        if (filtros?.desde) {
            constraints.push(where('timestamp', '>=', Timestamp.fromDate(filtros.desde)));
        }

        if (filtros?.hasta) {
            constraints.push(where('timestamp', '<=', Timestamp.fromDate(filtros.hasta)));
        }

        constraints.push(orderBy('timestamp', 'desc'));

        const auditoriaRef = getAuditoriaCollection(orgId);
        const snapshot = await getDocs(query(auditoriaRef, ...constraints));

        return snapshot.docs.map((doc) =>
            mapRegistroAuditoria(doc.id, orgId, doc.data() as Record<string, unknown>)
        );
    }

    static async obtenerRegistrosPorEntidad(
        orgId: string,
        entidadId: string
    ): Promise<RegistroAuditoria[]> {
        return this.obtenerRegistros(orgId, { entidadId });
    }
}
