import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const SCOUTING_MANIFEST: AgroPluginManifest = {
  identity: {
    plugin_id: 'sig-agro-scouting',
    slug: 'scouting',
    display_name: 'Scouting de Cultivos',
    summary: 'Relevamiento a campo: registro de alertas fitosanitarias, imágenes y observaciones por lote.',
    category: 'produccion',
    tier: 'optional',
    visibility: 'internal',
    maturity: 'beta',
  },
  versioning: { plugin_version: '0.8.0', runtime_api_version: '1.0.0' },
  compatibility: {
    core_version_range: '>=1.0.0',
    required_capabilities: ['sig-agro-campos'],
    optional_capabilities: ['sig-agro-campanias', 'sig-agro-ia'],
    incompatible_plugins: [],
  },
  permissions: {
    scopes: ['scouting:read', 'scouting:write'],
    data_access: { field_data: true, financial: false, personal_info: false },
  },
  tenant_settings: {
    schema_version: '1.0.0',
    required: false,
    defaults: { alertas_push: true, frecuencia_sugerida_dias: 7 },
    schema: {},
  },
  routes: {
    navigation: [
      { path: '/scouting', label: 'Scouting', icon: 'FlaskConical', requiredPermissions: ['scouting:read'] },
    ],
    pages: [],
  },
  events: {
    emits: [
      { event_id: 'scouting.alerta', description: 'Alerta fitosanitaria registrada', payload_schema: { loteId: 'string', tipo: 'string', severidad: 'string' } },
    ],
    consumes: [],
  },
  billing: { model: 'add_on', feature_flag: 'scouting' },
  multi_tenant: { isolation_model: 'logical_per_organization', per_tenant_overrides_allowed: false },
  uninstall_strategy: { mode: 'soft_remove', data_retention_days: 90, reversible_within_days: 30 },
};
