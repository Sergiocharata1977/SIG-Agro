import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const CAMPOS_MANIFEST: AgroPluginManifest = {
  identity: {
    plugin_id: 'sig-agro-campos',
    slug: 'campos',
    display_name: 'Gestión de Campos',
    summary: 'Alta, edición y visualización GIS de establecimientos agrícolas y sus lotes.',
    category: 'campo_gis',
    tier: 'base',
    visibility: 'internal',
    maturity: 'ga',
  },
  versioning: { plugin_version: '1.0.0', runtime_api_version: '1.0.0' },
  compatibility: {
    core_version_range: '>=1.0.0',
    required_capabilities: [],
    optional_capabilities: ['mapa_gis'],
    incompatible_plugins: [],
  },
  permissions: {
    scopes: ['campos:read', 'campos:write', 'campos:delete'],
    data_access: { field_data: true, financial: false, personal_info: false },
  },
  tenant_settings: {
    schema_version: '1.0.0',
    required: false,
    defaults: {},
    schema: {},
  },
  routes: {
    navigation: [
      { path: '/campos', label: 'Campos', icon: 'MapPin', requiredPermissions: ['campos:read'] },
    ],
    pages: [
      { path: '/campos/nuevo', label: 'Nuevo campo', requiredPermissions: ['campos:write'] },
      { path: '/campos/[id]', label: 'Detalle de campo', requiredPermissions: ['campos:read'] },
    ],
  },
  events: {
    emits: [
      { event_id: 'campo.created', description: 'Campo creado', payload_schema: { campoId: 'string' } },
      { event_id: 'campo.deleted', description: 'Campo eliminado', payload_schema: { campoId: 'string' } },
    ],
    consumes: [],
  },
  billing: { model: 'plan_included', feature_flag: 'campos' },
  multi_tenant: { isolation_model: 'logical_per_organization', per_tenant_overrides_allowed: false },
  uninstall_strategy: { mode: 'soft_remove', data_retention_days: 90, reversible_within_days: 30 },
};
