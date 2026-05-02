export type TipoAdjunto =
  | 'factura'
  | 'recibo'
  | 'remito'
  | 'orden_compra'
  | 'comprobante_transferencia'
  | 'cheque_escaneado'
  | 'contrato'
  | 'presupuesto'
  | 'liquidacion'
  | 'informe'
  | 'otro';

export interface Adjunto {
  id: string;
  organizationId: string;
  entidadTipo: string;
  entidadId: string;
  nombre: string;
  nombreStorage: string;
  url: string;
  contentType: string;
  tamaño: number;
  tipo: TipoAdjunto;
  descripcion?: string;
  subidoPor: string;
  subidoPorNombre?: string;
  createdAt: Date;
}
