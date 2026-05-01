import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const CONTABILIDAD_AGRO_MANIFEST = {
  identity: {
    plugin_id: 'sig-agro-contabilidad',
    slug: 'contabilidad',
    display_name: 'Contabilidad Agro',
    summary: 'Control contable y financiero para la operacion agropecuaria.',
    category: 'contabilidad',
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
    scopes: ['contabilidad:read', 'contabilidad:write', 'contabilidad:delete'],
    data_access: {
      field_data: false,
      financial: true,
      personal_info: false,
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
        path: '/contabilidad',
        label: 'Contabilidad',
        icon: 'Landmark',
        requiredPermissions: ['contabilidad:read'],
      },
    ],
    pages: [
      {
        path: '/contabilidad',
        label: 'Contabilidad',
        requiredPermissions: ['contabilidad:read'],
      },
    ],
  },
  events: {
    emits: [],
    consumes: [],
  },
  billing: {
    model: 'add_on',
    feature_flag: 'contabilidad',
  },
  multi_tenant: {
    isolation_model: 'logical_per_organization',
    per_tenant_overrides_allowed: true,
  },
  uninstall_strategy: {
    mode: 'soft_remove',
    data_retention_days: 365,
    reversible_within_days: 60,
  },
} satisfies AgroPluginManifest;
