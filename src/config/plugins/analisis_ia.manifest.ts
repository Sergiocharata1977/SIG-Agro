import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const ANALISIS_IA_MANIFEST = {
  identity: {
    plugin_id: 'sig-agro-ia',
    slug: 'analisis_ia',
    display_name: 'Analisis IA',
    summary: 'Analitica agronomica asistida por IA sobre datos productivos y de campo.',
    category: 'ia_analitica',
    tier: 'premium',
    visibility: 'marketplace',
    maturity: 'beta',
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
    scopes: ['analisis_ia:read', 'analisis_ia:write'],
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
        path: '/analisis-ia',
        label: 'Analisis IA',
        icon: 'Bot',
        requiredPermissions: ['analisis_ia:read'],
      },
    ],
    pages: [
      {
        path: '/analisis-ia',
        label: 'Analisis IA',
        requiredPermissions: ['analisis_ia:read'],
      },
    ],
  },
  events: {
    emits: [],
    consumes: [],
  },
  billing: {
    model: 'add_on',
    feature_flag: 'analisis_ia',
  },
  multi_tenant: {
    isolation_model: 'logical_per_organization',
    per_tenant_overrides_allowed: true,
  },
  uninstall_strategy: {
    mode: 'soft_remove',
    data_retention_days: 90,
    reversible_within_days: 15,
  },
} satisfies AgroPluginManifest;
