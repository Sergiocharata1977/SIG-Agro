export type CategoriaPresupuesto =
  | 'semillas'
  | 'fertilizantes'
  | 'agroquimicos'
  | 'combustible'
  | 'labores'
  | 'fletes'
  | 'seguros'
  | 'arrendamientos'
  | 'cosecha'
  | 'mano_obra'
  | 'servicios_tecnicos'
  | 'repuestos'
  | 'gastos_admin'
  | 'gastos_comerciales'
  | 'financiamiento'
  | 'otros_gastos'
  | 'venta_granos'
  | 'otros_ingresos';

export type TipoPresupuesto = 'gasto' | 'ingreso';

export interface LineaPresupuesto {
  id: string;
  categoria: CategoriaPresupuesto;
  descripcion: string;
  tipo: TipoPresupuesto;
  montoPresupuestado: number;
  montoReal: number;
  diferencia: number;
  variacionPct: number;
}

export interface Presupuesto {
  id: string;
  organizationId: string;
  nombre: string;
  campaniaId?: string;
  campoId?: string;
  loteId?: string;
  cultivo?: string;
  hectareas?: number;
  año: number;
  lineas: LineaPresupuesto[];
  totalPresupuestadoGastos: number;
  totalPresupuestadoIngresos: number;
  totalRealGastos: number;
  totalRealIngresos: number;
  margenPresupuestado: number;
  margenReal: number;
  estado: 'activo' | 'cerrado' | 'borrador';
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}
