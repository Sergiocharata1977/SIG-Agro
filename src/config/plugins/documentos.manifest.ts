import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const DOCUMENTOS_MANIFEST: AgroPluginManifest = {
  identity: {
    plugin_id: 'sig-agro-documentos',
    slug: 'documentos',
    display_name: 'Documentos y Evidencias',
    summary: 'Almacenamiento y trazabilidad de documentos técnicos, contratos y evidencias de campo.',
    category: 'compliance',
    tier: 'optional',
    visibility: 'internal',
    maturity: 'ga',
  },
  versioning: { plugin_version: '1.0.0', runtime_api_version: '1.0.0' },
  compatibility: {
    core_version_range: '>=1.0.0',
    required_capabilities: [],
    optional_capabilities: ['sig-agro-campos', 'sig-agro-campanias'],
    incompatible_plugins: [],
  },
  permissions: {
    scopes: ['documentos:read', 'documentos:write', 'documentos:delete'],
    data_access: { field_data: false, financial: false, personal_info: true },
  },
  tenant_settings: {
    schema_version: '1.0.0',
    required: false,
    defaults: { max_file_size_mb: 50, tipos_permitidos: ['pdf', 'jpg', 'png', 'xlsx'] },
    schema: {},
  },
  routes: {
    navigation: [
      { path: '/documentos', label: 'Documentos', icon: 'FileText', requiredPermissions: ['documentos:read'] },
    ],
    pages: [],
  },
  events: { emits: [], consumes: [] },
  billing: { model: 'add_on', feature_flag: 'documentos' },
  multi_tenant: { isolation_model: 'logical_per_organization', per_tenant_overrides_allowed: false },
  uninstall_strategy: { mode: 'soft_remove', data_retention_days: 365, reversible_within_days: 90 },
};
