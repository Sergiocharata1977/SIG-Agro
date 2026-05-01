import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const CAMPANIAS_MANIFEST: AgroPluginManifest = {
  identity: {
    plugin_id: 'sig-agro-campanias',
    slug: 'campanias',
    display_name: 'Campañas Agrícolas',
    summary: 'Planificación y seguimiento de campañas agrícolas por lote y cultivo.',
    category: 'produccion',
    tier: 'base',
    visibility: 'internal',
    maturity: 'ga',
  },
  versioning: { plugin_version: '1.0.0', runtime_api_version: '1.0.0' },
  compatibility: {
    core_version_range: '>=1.0.0',
    required_capabilities: ['sig-agro-campos'],
    optional_capabilities: ['sig-agro-contabilidad'],
    incompatible_plugins: [],
  },
  permissions: {
    scopes: ['campanias:read', 'campanias:write', 'campanias:delete'],
    data_access: { field_data: true, financial: false, personal_info: false },
  },
  tenant_settings: {
    schema_version: '1.0.0',
    required: false,
    defaults: { cultivos_habilitados: ['Soja', 'Maiz', 'Algodon', 'Girasol'] },
    schema: {},
  },
  routes: {
    navigation: [
      { path: '/campanias', label: 'Campañas', icon: 'Wheat', requiredPermissions: ['campanias:read'] },
    ],
    pages: [
      { path: '/campanias/[id]', label: 'Detalle de campaña', requiredPermissions: ['campanias:read'] },
    ],
  },
  events: {
    emits: [
      { event_id: 'campania.created', description: 'Campaña creada', payload_schema: { campaniaId: 'string', cultivo: 'string' } },
      { event_id: 'campania.finalizada', description: 'Campaña finalizada', payload_schema: { campaniaId: 'string' } },
    ],
    consumes: [
      { event_id: 'campo.deleted', description: 'Reacciona al borrado de campo', payload_schema: { campoId: 'string' } },
    ],
  },
  billing: { model: 'plan_included', feature_flag: 'campanias' },
  multi_tenant: { isolation_model: 'logical_per_organization', per_tenant_overrides_allowed: false },
  uninstall_strategy: { mode: 'soft_remove', data_retention_days: 180, reversible_within_days: 30 },
};
