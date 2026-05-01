import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const MAPA_GIS_MANIFEST = {
  identity: {
    plugin_id: 'sig-agro-mapa-gis',
    slug: 'mapa_gis',
    display_name: 'Mapa GIS',
    summary: 'Visualizacion geoespacial de campos, lotes y capas operativas.',
    category: 'campo_gis',
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
    required_capabilities: [],
    optional_capabilities: [],
    incompatible_plugins: [],
  },
  permissions: {
    scopes: ['mapa_gis:read', 'mapa_gis:write'],
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
        path: '/mapa-gis',
        label: 'Mapa GIS',
        icon: 'Map',
        requiredPermissions: ['mapa_gis:read'],
      },
    ],
    pages: [
      {
        path: '/mapa-gis',
        label: 'Mapa GIS',
        requiredPermissions: ['mapa_gis:read'],
      },
    ],
  },
  events: {
    emits: [],
    consumes: [],
  },
  billing: {
    model: 'plan_included',
    feature_flag: 'mapa_gis',
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
