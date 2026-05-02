export type ModuloAuditoria =
    | 'contabilidad'
    | 'terceros'
    | 'tesoreria'
    | 'cheques'
    | 'operaciones'
    | 'operaciones_comerciales'
    | 'presupuesto'
    | 'centros_costo'
    | 'campanas'
    | 'plan_cuentas';

export type AccionAuditoria =
    | 'crear'
    | 'modificar'
    | 'eliminar'
    | 'contabilizar'
    | 'anular'
    | 'aprobar'
    | 'rechazar'
    | 'cambiar_estado';

export interface RegistroAuditoria {
    id: string;
    organizationId: string;
    modulo: ModuloAuditoria;
    accion: AccionAuditoria;
    entidadId: string;
    entidadTipo: string;
    entidadDescripcion: string;
    usuarioId: string;
    usuarioNombre?: string;
    usuarioEmail?: string;
    valorAnterior?: Record<string, unknown>;
    valorNuevo?: Record<string, unknown>;
    camposModificados?: string[];
    timestamp: Date;
}
