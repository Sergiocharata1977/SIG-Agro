import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const METRICAS_MANIFEST: AgroPluginManifest = {
  identity: {
    plugin_id: 'sig-agro-metricas',
    slug: 'metricas',
    display_name: 'Métricas y KPIs',
    summary: 'Dashboard ejecutivo con métricas productivas y financieras consolidadas por campaña.',
    category: 'ia_analitica',
    tier: 'optional',
    visibility: 'internal',
    maturity: 'ga',
  },
  versioning: { plugin_version: '1.0.0', runtime_api_version: '1.0.0' },
  compatibility: {
    core_version_range: '>=1.0.0',
    required_capabilities: ['sig-agro-campos', 'sig-agro-campanias'],
    optional_capabilities: ['sig-agro-contabilidad', 'sig-agro-ia'],
    incompatible_plugins: [],
  },
  permissions: {
    scopes: ['metricas:read'],
    data_access: { field_data: true, financial: true, personal_info: false },
  },
  tenant_settings: {
    schema_version: '1.0.0',
    required: false,
    defaults: { periodo_default: 'campania_actual' },
    schema: {},
  },
  routes: {
    navigation: [
      { path: '/metricas', label: 'Métricas', icon: 'BarChart3', requiredPermissions: ['metricas:read'] },
    ],
    pages: [],
  },
  events: { emits: [], consumes: [] },
  billing: { model: 'plan_included', feature_flag: 'metricas' },
  multi_tenant: { isolation_model: 'logical_per_organization', per_tenant_overrides_allowed: false },
  uninstall_strategy: { mode: 'soft_remove', data_retention_days: 0, reversible_within_days: 0 },
};
