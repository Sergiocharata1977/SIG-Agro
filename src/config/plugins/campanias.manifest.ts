import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const CAMPANIAS_MANIFEST = {
  identity: {
    plugin_id: 'sig-agro-campanias',
    slug: 'campanias',
    display_name: 'Campanias',
    summary: 'Planificacion y seguimiento de campanias agricolas por cultivo y lote.',
    category: 'produccion',
    tier: 'base',
    visibility: 'internal',
    maturity: 'ga',
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
    scopes: ['campanias:read', 'campanias:write', 'campanias:delete'],
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
        path: '/campanias',
        label: 'Campanias',
        icon: 'Wheat',
        requiredPermissions: ['campanias:read'],
      },
    ],
    pages: [
      {
        path: '/campanias',
        label: 'Campanias',
        requiredPermissions: ['campanias:read'],
      },
      {
        path: '/campanias/[id]',
        label: 'Detalle de campania',
        requiredPermissions: ['campanias:read'],
      },
    ],
  },
  events: {
    emits: [],
    consumes: [],
  },
  billing: {
    model: 'plan_included',
    feature_flag: 'campanias',
  },
  multi_tenant: {
    isolation_model: 'logical_per_organization',
    per_tenant_overrides_allowed: false,
  },
  uninstall_strategy: {
    mode: 'soft_remove',
    data_retention_days: 180,
    reversible_within_days: 30,
  },
} satisfies AgroPluginManifest;
