import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const SCOUTING_MANIFEST = {
  identity: {
    plugin_id: 'sig-agro-scouting',
    slug: 'scouting',
    display_name: 'Scouting',
    summary: 'Seguimiento a campo con observaciones, alertas e inspecciones operativas.',
    category: 'produccion',
    tier: 'optional',
    visibility: 'marketplace',
    maturity: 'beta',
  },
  versioning: {
    plugin_version: '1.0.0',
    runtime_api_version: '1.0.0',
  },
  compatibility: {
    core_version_range: '>=1.0.0',
    required_capabilities: ['sig-agro-campos'],
    optional_capabilities: [],
    incompatible_plugins: [],
  },
  permissions: {
    scopes: ['scouting:read', 'scouting:write'],
    data_access: {
      field_data: true,
      financial: false,
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
        path: '/scouting',
        label: 'Scouting',
        icon: 'ClipboardList',
        requiredPermissions: ['scouting:read'],
      },
    ],
    pages: [
      {
        path: '/scouting',
        label: 'Scouting',
        requiredPermissions: ['scouting:read'],
      },
    ],
  },
  events: {
    emits: [],
    consumes: [],
  },
  billing: {
    model: 'add_on',
    feature_flag: 'scouting',
  },
  multi_tenant: {
    isolation_model: 'logical_per_organization',
    per_tenant_overrides_allowed: false,
  },
  uninstall_strategy: {
    mode: 'soft_remove',
    data_retention_days: 90,
    reversible_within_days: 30,
  },
} satisfies AgroPluginManifest;
