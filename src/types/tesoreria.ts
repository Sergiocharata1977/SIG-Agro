export type TipoCuenta = 'banco' | 'caja_chica';
export type TipoMovimientoTesoreria = 'ingreso' | 'egreso' | 'transferencia';
export type EstadoTesoreria = 'activo' | 'inactivo';

export interface CuentaBancaria {
  id: string;
  organizationId: string;
  banco: string;
  numeroCuenta: string;
  titular: string;
  tipoCuenta: 'corriente' | 'ahorro' | 'caja_ahorro';
  moneda: 'ARS' | 'USD';
  saldoInicial: number;
  saldo: number;
  estado: EstadoTesoreria;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CajaChica {
  id: string;
  organizationId: string;
  nombre: string;
  responsable?: string;
  saldoInicial: number;
  saldo: number;
  moneda: 'ARS' | 'USD';
  estado: EstadoTesoreria;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MovimientoTesoreria {
  id: string;
  organizationId: string;
  tipo: TipoMovimientoTesoreria;
  cuentaOrigenTipo: TipoCuenta;
  cuentaOrigenId: string;
  cuentaOrigenNombre: string;
  cuentaDestinoTipo?: TipoCuenta;
  cuentaDestinoId?: string;
  cuentaDestinoNombre?: string;
  fecha: Date;
  concepto: string;
  monto: number;
  terceroId?: string;
  terceroNombre?: string;
  operacionId?: string;
  asientoId?: string;
  notas?: string;
  createdAt: Date;
}

export interface ResumenTesoreria {
  totalBancos: number;
  totalCajas: number;
  totalGeneral: number;
  ingresosMes: number;
  egresosMes: number;
}
