export type EstadoAprobacion =
  | 'borrador'
  | 'pendiente_aprobacion'
  | 'aprobado'
  | 'rechazado'
  | 'contabilizado'
  | 'anulado';

export type TipoAprobacion =
  | 'pago_grande'
  | 'ajuste_contable'
  | 'anulacion'
  | 'nota_credito'
  | 'refinanciacion'
  | 'condonacion'
  | 'ajuste_cc';

export interface HistorialAprobacion {
  estado: EstadoAprobacion;
  usuarioId: string;
  usuarioNombre?: string;
  fecha: Date;
  observacion?: string;
}

export interface SolicitudAprobacion {
  id: string;
  organizationId: string;
  tipo: TipoAprobacion;
  estado: EstadoAprobacion;
  operacionTipo: string;
  operacionId?: string;
  descripcion: string;
  monto?: number;
  solicitanteId: string;
  solicitanteNombre?: string;
  fechaSolicitud: Date;
  motivoSolicitud: string;
  aprobadorId?: string;
  aprobadorNombre?: string;
  fechaAprobacion?: Date;
  motivoAprobacion?: string;
  historial: HistorialAprobacion[];
  createdAt: Date;
  updatedAt: Date;
}

export const UMBRALES_APROBACION: Record<string, number> = {
  pago_grande: 500000,
  nota_credito: 100000,
  ajuste_contable: 50000,
};
