import { describe, expect, it } from 'vitest';
import {
  AGRO_PLUGIN_API_VERSION,
  validateAgroPluginManifest,
} from '@/lib/plugins/manifestSchema';

function buildValidManifest() {
  return {
    identity: {
      plugin_id: 'plugin_demo',
      slug: 'plugin-demo',
      display_name: 'Plugin Demo',
      summary: 'Plugin de prueba completo',
      category: 'documentos',
      tier: 'optional',
      visibility: 'marketplace',
      maturity: 'ga',
    },
    versioning: {
      plugin_version: '1.2.3',
      runtime_api_version: AGRO_PLUGIN_API_VERSION,
    },
    compatibility: {
      core_version_range: '^1.0.0',
      required_capabilities: ['campos'],
      optional_capabilities: ['metricas'],
      incompatible_plugins: ['legacy-plugin'],
    },
    permissions: {
      scopes: ['read:documents', 'write:documents'],
      data_access: {
        field_data: true,
        financial: false,
        personal_info: false,
      },
    },
    tenant_settings: {
      schema_version: '1.0.0',
      required: false,
      defaults: {
        retentionDays: 30,
      },
      schema: {
        type: 'object',
      },
    },
    routes: {
      navigation: [
        {
          path: '/documentos',
          label: 'Documentos',
          icon: 'file',
          requiredPermissions: ['read:documents'],
        },
      ],
      pages: [
        {
          path: '/documentos/configuracion',
          label: 'Configuracion',
          requiredPermissions: ['write:documents'],
        },
      ],
    },
    events: {
      emits: [
        {
          event_id: 'document.created',
          description: 'Documento generado',
          payload_schema: {
            type: 'object',
          },
        },
      ],
      consumes: [
        {
          event_id: 'document.updated',
          description: 'Documento actualizado',
          payload_schema: {
            type: 'object',
          },
        },
      ],
    },
    billing: {
      model: 'plan_included',
      feature_flag: 'documents_enabled',
    },
    multi_tenant: {
      isolation_model: 'logical_per_organization',
      per_tenant_overrides_allowed: true,
    },
    uninstall_strategy: {
      mode: 'soft_remove',
      data_retention_days: 30,
      reversible_within_days: 7,
    },
  };
}

describe('validateAgroPluginManifest', () => {
  it('rechaza manifest sin campos requeridos', () => {
    expect(() => validateAgroPluginManifest({})).toThrow(
      'identity: must be an object'
    );
  });

  it('acepta manifest valido completo', () => {
    const manifest = validateAgroPluginManifest(buildValidManifest());

    expect(manifest.identity.plugin_id).toBe('plugin_demo');
    expect(manifest.versioning.plugin_version).toBe('1.2.3');
    expect(manifest.routes.navigation[0]?.path).toBe('/documentos');
  });

  it('AGRO_PLUGIN_API_VERSION es semver valido', () => {
    expect(AGRO_PLUGIN_API_VERSION).toMatch(
      /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
    );
  });
});
