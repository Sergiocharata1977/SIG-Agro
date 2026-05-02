export type TipoOperacionComercial =
  | 'servicio_tecnico'
  | 'venta_repuesto'
  | 'venta_maquinaria';

export type EstadoOperacionComercial =
  | 'borrador'
  | 'pendiente'
  | 'facturado'
  | 'cobrado'
  | 'anulado';

export type CondicionVenta =
  | 'contado'
  | 'credito_30'
  | 'credito_60'
  | 'credito_90'
  | 'financiado';

export interface LineaOperacionComercial {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
  esRepuesto?: boolean;
  esManoObra?: boolean;
}

export interface OperacionComercial {
  id: string;
  organizationId: string;
  tipo: TipoOperacionComercial;
  estado: EstadoOperacionComercial;
  fecha: Date;
  numeroDocumento?: string;
  terceroId: string;
  terceroNombre: string;
  lineas: LineaOperacionComercial[];
  subtotal: number;
  descuentoGlobal: number;
  iva: number;
  montoIVA: number;
  total: number;
  condicionVenta: CondicionVenta;
  medioCobro?: string;
  maquinaId?: string;
  ordenServicioId?: string;
  maquinaVendidaDescripcion?: string;
  marcaMaquina?: string;
  modeloMaquina?: string;
  anioMaquina?: number;
  asientoId?: string;
  notas?: string;
  creadoPor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FiltrosOperacionComercial {
  tipo?: TipoOperacionComercial;
  estado?: EstadoOperacionComercial;
  desde?: Date;
  hasta?: Date;
  terceroId?: string;
}

export type NuevaOperacionComercial = Omit<
  OperacionComercial,
  'id' | 'organizationId' | 'createdAt' | 'updatedAt'
>;
