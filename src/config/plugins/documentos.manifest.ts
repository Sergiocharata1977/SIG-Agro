import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const DOCUMENTOS_MANIFEST = {
  identity: {
    plugin_id: 'sig-agro-documentos',
    slug: 'documentos',
    display_name: 'Documentos',
    summary: 'Repositorio documental para evidencias, contratos y archivos operativos.',
    category: 'compliance',
    tier: 'optional',
    visibility: 'marketplace',
    maturity: 'ga',
  },
  versioning: {
    plugin_version: '1.0.0',
    runtime_api_version: '1.0.0',
  },
  compatibility: {
    core_version_range: '>=1.0.0',
    required_capabilities: [],
    optional_capabilities: [],
    incompatible_plugins: [],
  },
  permissions: {
    scopes: ['documentos:read', 'documentos:write', 'documentos:delete'],
    data_access: {
      field_data: false,
      financial: false,
      personal_info: true,
    },
  },
  tenant_settings: {
    schema_version: '1.0.0',
    required: false,
    defaults: {},
    schema: {},
  },
  routes: {
    navigation: [
      {
        path: '/documentos',
        label: 'Documentos',
        icon: 'FileText',
        requiredPermissions: ['documentos:read'],
      },
    ],
    pages: [
      {
        path: '/documentos',
        label: 'Documentos',
        requiredPermissions: ['documentos:read'],
      },
    ],
  },
  events: {
    emits: [],
    consumes: [],
  },
  billing: {
    model: 'add_on',
    feature_flag: 'documentos',
  },
  multi_tenant: {
    isolation_model: 'logical_per_organization',
    per_tenant_overrides_allowed: false,
  },
  uninstall_strategy: {
    mode: 'soft_remove',
    data_retention_days: 365,
    reversible_within_days: 90,
  },
} satisfies AgroPluginManifest;
