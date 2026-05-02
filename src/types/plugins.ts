export type PluginId =
  | 'contabilidad_avanzada'
  | 'tesoreria'
  | 'cuentas_corrientes'
  | 'operaciones_comerciales'
  | 'agro_gestion'
  | 'presupuesto_control'
  | 'iso_control_interno'
  | 'exportacion';

export type PluginCategoria =
  | 'contabilidad'
  | 'tesoreria'
  | 'comercial'
  | 'agro'
  | 'control';

export interface Plugin {
  id: PluginId;
  nombre: string;
  descripcion: string;
  icono: string;
  categoria: PluginCategoria;
  dependencias?: PluginId[];
  rutasHabilitadas: string[];
}

export type PluginDefinicion = Plugin;

export interface OrganizationPlugins {
  organizationId: string;
  pluginsActivos: PluginId[];
  updatedAt: Date;
  updatedBy: string;
}

export const CATALOGO_PLUGINS: Plugin[] = [
  {
    id: 'contabilidad_avanzada',
    nombre: 'Contabilidad Avanzada',
    descripcion:
      'Mayor por cuenta, libro diario completo y cuentas corrientes detalladas con historial y mora.',
    icono: 'BookOpen',
    categoria: 'contabilidad',
    rutasHabilitadas: ['/contabilidad/mayor', '/terceros/[id]'],
  },
  {
    id: 'tesoreria',
    nombre: 'Tesoreria',
    descripcion:
      'Control de caja, bancos, cheques recibidos/emitidos y flujo de caja proyectado.',
    icono: 'Landmark',
    categoria: 'tesoreria',
    rutasHabilitadas: ['/tesoreria', '/cheques', '/flujo-caja'],
  },
  {
    id: 'operaciones_comerciales',
    nombre: 'Operaciones Comerciales',
    descripcion:
      'Servicios tecnicos, venta de repuestos, venta de maquinaria y operaciones financieras avanzadas.',
    icono: 'ShoppingCart',
    categoria: 'comercial',
    rutasHabilitadas: ['/operaciones/comerciales'],
  },
  {
    id: 'agro_gestion',
    nombre: 'Agro Gestion',
    descripcion:
      'Resultado economico por campana y por lote, desglose de costos e ingresos, comparativa interanual.',
    icono: 'Sprout',
    categoria: 'agro',
    rutasHabilitadas: ['/campanas/resultado'],
  },
  {
    id: 'presupuesto_control',
    nombre: 'Presupuesto & Control',
    descripcion:
      'Centros de costo, presupuesto por campana y comparativa presupuesto vs ejecucion real.',
    icono: 'BarChart3',
    categoria: 'control',
    rutasHabilitadas: ['/centros-costo', '/presupuesto'],
  },
  {
    id: 'iso_control_interno',
    nombre: 'ISO & Control Interno',
    descripcion:
      'Auditoria de cambios, workflow de aprobaciones y adjuntos de comprobantes.',
    icono: 'ShieldCheck',
    categoria: 'control',
    rutasHabilitadas: ['/auditoria', '/aprobaciones'],
  },
  {
    id: 'exportacion',
    nombre: 'Exportacion Excel/PDF',
    descripcion:
      'Descarga de reportes en Excel y PDF: libro diario, mayor, cuentas corrientes, flujo de caja.',
    icono: 'Download',
    categoria: 'contabilidad',
    rutasHabilitadas: [],
  },
];

export type {
  AgroPluginManifest,
  AgroPluginCategory,
  AgroPluginTier,
  AgroPluginRoute,
} from '../lib/plugins/manifestSchema';
