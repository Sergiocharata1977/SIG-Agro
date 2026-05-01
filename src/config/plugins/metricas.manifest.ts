import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const METRICAS_MANIFEST = {
  identity: {
    plugin_id: 'sig-agro-metricas',
    slug: 'metricas',
    display_name: 'Metricas',
    summary: 'Indicadores y tableros ejecutivos para seguimiento productivo.',
    category: 'ia_analitica',
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
    required_capabilities: ['sig-agro-campos', 'sig-agro-campanias'],
    optional_capabilities: [],
    incompatible_plugins: [],
  },
  permissions: {
    scopes: ['metricas:read'],
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
        path: '/metricas',
        label: 'Metricas',
        icon: 'BarChart3',
        requiredPermissions: ['metricas:read'],
      },
    ],
    pages: [
      {
        path: '/metricas',
        label: 'Metricas',
        requiredPermissions: ['metricas:read'],
      },
    ],
  },
  events: {
    emits: [],
    consumes: [],
  },
  billing: {
    model: 'plan_included',
    feature_flag: 'metricas',
  },
  multi_tenant: {
    isolation_model: 'logical_per_organization',
    per_tenant_overrides_allowed: false,
  },
  uninstall_strategy: {
    mode: 'soft_remove',
    data_retention_days: 30,
    reversible_within_days: 7,
  },
} satisfies AgroPluginManifest;
