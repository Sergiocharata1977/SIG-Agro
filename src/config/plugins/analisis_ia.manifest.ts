import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';

export const ANALISIS_IA_MANIFEST: AgroPluginManifest = {
  identity: {
    plugin_id: 'sig-agro-ia',
    slug: 'analisis_ia',
    display_name: 'Análisis IA',
    summary: 'Análisis satelital con índices NDVI/EVI y recomendaciones agronómicas con IA (Gemini).',
    category: 'ia_analitica',
    tier: 'premium',
    visibility: 'marketplace',
    maturity: 'beta',
  },
  versioning: { plugin_version: '0.9.0', runtime_api_version: '1.0.0' },
  compatibility: {
    core_version_range: '>=1.0.0',
    required_capabilities: ['sig-agro-campos', 'sig-agro-campanias'],
    optional_capabilities: ['sig-agro-metricas'],
    incompatible_plugins: [],
  },
  permissions: {
    scopes: ['analisis_ia:read', 'analisis_ia:write', 'satellite:read'],
    data_access: { field_data: true, financial: false, personal_info: false },
  },
  tenant_settings: {
    schema_version: '1.0.0',
    required: false,
    defaults: { indice_default: 'NDVI', alertas_automaticas: true },
    schema: {},
  },
  routes: {
    navigation: [
      { path: '/analisis-ia', label: 'Análisis IA', icon: 'Bot', requiredPermissions: ['analisis_ia:read'] },
    ],
    pages: [
      { path: '/analisis-ia/[loteId]', label: 'Análisis de lote', requiredPermissions: ['analisis_ia:read'] },
    ],
  },
  events: {
    emits: [
      { event_id: 'analisis.completado', description: 'Análisis satelital completado', payload_schema: { loteId: 'string', indice: 'string', valor: 'number' } },
      { event_id: 'alerta.agronómica', description: 'Alerta agronómica generada', payload_schema: { loteId: 'string', tipo: 'string', severidad: 'string' } },
    ],
    consumes: [
      { event_id: 'campo.created', description: 'Inicializa monitoreo satelital', payload_schema: { campoId: 'string' } },
    ],
  },
  billing: { model: 'add_on', feature_flag: 'analisis_ia' },
  multi_tenant: { isolation_model: 'logical_per_organization', per_tenant_overrides_allowed: true },
  uninstall_strategy: { mode: 'soft_remove', data_retention_days: 90, reversible_within_days: 15 },
};
