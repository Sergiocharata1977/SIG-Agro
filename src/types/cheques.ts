export type EstadoChequeEmitido = 'emitido' | 'presentado' | 'debitado' | 'rechazado' | 'anulado';
export type EstadoChequeRecibido = 'en_cartera' | 'depositado' | 'al_cobro' | 'cobrado' | 'rechazado' | 'endosado' | 'anulado';
export type TipoCheque = 'comun' | 'diferido';

export interface ChequeEmitido {
  id: string;
  organizationId: string;
  numeroCheque: string;
  banco: string;
  cuentaBancariaId: string;
  cuentaBancariaNombre: string;
  tipo: TipoCheque;
  fechaEmision: Date;
  fechaPago: Date;
  monto: number;
  beneficiario: string;
  terceroId?: string;
  concepto: string;
  estado: EstadoChequeEmitido;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChequeRecibido {
  id: string;
  organizationId: string;
  numeroCheque: string;
  banco: string;
  tipo: TipoCheque;
  fechaRecepcion: Date;
  fechaPago: Date;
  monto: number;
  librador: string;
  terceroId?: string;
  concepto: string;
  estado: EstadoChequeRecibido;
  cuentaDepositoId?: string;
  cuentaDepositoNombre?: string;
  notas?: string;
  createdAt: Date;
}

export interface ResumenCheques {
  emitidosPendientes: number;
  emitidosMonto: number;
  recibidosEnCartera: number;
  recibidosMonto: number;
  vencenEsta7Dias: number;
}
