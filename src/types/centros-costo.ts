export type TipoCentroCosto =
  | 'administracion'
  | 'ventas'
  | 'repuestos'
  | 'servicios_tecnicos'
  | 'taller'
  | 'campo'
  | 'maquinaria'
  | 'sucursal'
  | 'campana'
  | 'lote'
  | 'cultivo'
  | 'otro';

export interface CentroCosto {
  id: string;
  organizationId: string;
  codigo: string;
  nombre: string;
  tipo: TipoCentroCosto;
  descripcion?: string;
  campaniaId?: string;
  campoId?: string;
  loteId?: string;
  padre?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MovimientoCentroCosto {
  id: string;
  organizationId: string;
  centroCostoId: string;
  centroCostoNombre: string;
  fecha: Date;
  concepto: string;
  tipoMovimiento: 'cargo' | 'abono';
  monto: number;
  operacionId: string;
  tipoOperacion: string;
  asientoId?: string;
  createdAt: Date;
}

export interface ResumenCentroCosto {
  centroCostoId: string;
  nombre: string;
  totalCargos: number;
  totalAbonos: number;
  saldo: number;
  cantidadMovimientos: number;
}

export type NuevoCentroCosto = Omit<
  CentroCosto,
  'id' | 'organizationId' | 'createdAt' | 'updatedAt'
>;

export type ActualizacionCentroCosto = Partial<
  Omit<CentroCosto, 'id' | 'organizationId' | 'createdAt'>
>;

export type NuevoMovimientoCentroCosto = Omit<
  MovimientoCentroCosto,
  'id' | 'organizationId' | 'createdAt'
>;
