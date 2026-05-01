const AGRO_PLUGIN_CATEGORY_VALUES = [
  'campo_gis',
  'produccion',
  'contabilidad',
  'ia_analitica',
  'documentos',
  'compliance',
  'integraciones',
] as const;

const AGRO_PLUGIN_TIER_VALUES = ['base', 'optional', 'premium'] as const;
const AGRO_PLUGIN_VISIBILITY_VALUES = ['internal', 'marketplace'] as const;
const AGRO_PLUGIN_MATURITY_VALUES = [
  'draft',
  'beta',
  'ga',
  'deprecated',
] as const;
const AGRO_PLUGIN_BILLING_MODE_VALUES = [
  'free',
  'plan_included',
  'add_on',
] as const;
const AGRO_PLUGIN_ISOLATION_MODEL_VALUES = [
  'logical_per_organization',
  'shared',
] as const;
const AGRO_PLUGIN_UNINSTALL_MODE_VALUES = [
  'soft_remove',
  'hard_remove',
] as const;

const PLUGIN_ID_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export type AgroPluginCategory = (typeof AGRO_PLUGIN_CATEGORY_VALUES)[number];
export type AgroPluginTier = (typeof AGRO_PLUGIN_TIER_VALUES)[number];
export type AgroPluginVisibility = (typeof AGRO_PLUGIN_VISIBILITY_VALUES)[number];
export type AgroPluginMaturity = (typeof AGRO_PLUGIN_MATURITY_VALUES)[number];

export type AgroPluginRoute = {
  path: string;
  label: string;
  icon?: string;
  requiredPermissions: string[];
};

export type AgroPluginEvent = {
  event_id: string;
  description: string;
  payload_schema: Record<string, unknown>;
};

export type AgroPluginManifest = {
  identity: {
    plugin_id: string;
    slug: string;
    display_name: string;
    summary: string;
    category: AgroPluginCategory;
    tier: AgroPluginTier;
    visibility: AgroPluginVisibility;
    maturity: AgroPluginMaturity;
  };
  versioning: {
    plugin_version: string;
    runtime_api_version: string;
  };
  compatibility: {
    core_version_range: string;
    required_capabilities: string[];
    optional_capabilities: string[];
    incompatible_plugins: string[];
  };
  permissions: {
    scopes: string[];
    data_access: {
      field_data: boolean;
      financial: boolean;
      personal_info: boolean;
    };
  };
  tenant_settings: {
    schema_version: string;
    required: boolean;
    defaults: Record<string, unknown>;
    schema: Record<string, unknown>;
  };
  routes: {
    navigation: AgroPluginRoute[];
    pages: AgroPluginRoute[];
  };
  events: {
    emits: AgroPluginEvent[];
    consumes: AgroPluginEvent[];
  };
  billing: {
    model: 'free' | 'plan_included' | 'add_on';
    feature_flag: string;
  };
  multi_tenant: {
    isolation_model: 'logical_per_organization' | 'shared';
    per_tenant_overrides_allowed: boolean;
  };
  uninstall_strategy: {
    mode: 'soft_remove' | 'hard_remove';
    data_retention_days: number;
    reversible_within_days: number;
  };
};

export const AGRO_PLUGIN_CATEGORIES: Record<AgroPluginCategory, string> = {
  campo_gis: 'Campo y GIS',
  produccion: 'Produccion',
  contabilidad: 'Contabilidad',
  ia_analitica: 'IA y analitica',
  documentos: 'Documentos',
  compliance: 'Compliance',
  integraciones: 'Integraciones',
};

export const AGRO_PLUGIN_API_VERSION = '1.0.0' as const;

type UnknownRecord = Record<string, unknown>;

function assertCondition(
  condition: boolean,
  path: string,
  message: string
): asserts condition {
  if (!condition) {
    throw new TypeError(`${path}: ${message}`);
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function isOneOf<T extends string>(
  value: unknown,
  allowedValues: readonly T[]
): value is T {
  return typeof value === 'string' && allowedValues.includes(value as T);
}

function getRequiredRecord(parent: UnknownRecord, key: string, path: string): UnknownRecord {
  const value = parent[key];
  assertCondition(isRecord(value), path, 'must be an object');
  return value;
}

function getRequiredString(parent: UnknownRecord, key: string, path: string): string {
  const value = parent[key];
  assertCondition(isNonEmptyString(value), path, 'must be a non-empty string');
  return value;
}

function getRequiredBoolean(parent: UnknownRecord, key: string, path: string): boolean {
  const value = parent[key];
  assertCondition(isBoolean(value), path, 'must be a boolean');
  return value;
}

function getRequiredNonNegativeInteger(
  parent: UnknownRecord,
  key: string,
  path: string
): number {
  const value = parent[key];
  assertCondition(isNonNegativeInteger(value), path, 'must be a non-negative integer');
  return value;
}

function getRequiredStringArray(
  parent: UnknownRecord,
  key: string,
  path: string
): string[] {
  const value = parent[key];
  assertCondition(isStringArray(value), path, 'must be an array of non-empty strings');
  return value;
}

function getEnumValue<T extends string>(
  parent: UnknownRecord,
  key: string,
  path: string,
  allowedValues: readonly T[]
): T {
  const value = parent[key];
  assertCondition(
    isOneOf(value, allowedValues),
    path,
    `must be one of: ${allowedValues.join(', ')}`
  );
  return value;
}

function validateRoute(value: unknown, path: string): AgroPluginRoute {
  assertCondition(isRecord(value), path, 'must be an object');

  const route: AgroPluginRoute = {
    path: getRequiredString(value, 'path', `${path}.path`),
    label: getRequiredString(value, 'label', `${path}.label`),
    requiredPermissions: getRequiredStringArray(
      value,
      'requiredPermissions',
      `${path}.requiredPermissions`
    ),
  };

  assertCondition(route.path.startsWith('/'), `${path}.path`, 'must start with "/"');

  const icon = value.icon;
  if (icon !== undefined) {
    assertCondition(isNonEmptyString(icon), `${path}.icon`, 'must be a non-empty string');
    route.icon = icon;
  }

  return route;
}

function validateRoutesArray(value: unknown, path: string): AgroPluginRoute[] {
  assertCondition(Array.isArray(value), path, 'must be an array');
  return value.map((entry, index) => validateRoute(entry, `${path}[${index}]`));
}

function validateEvent(value: unknown, path: string): AgroPluginEvent {
  assertCondition(isRecord(value), path, 'must be an object');

  return {
    event_id: getRequiredString(value, 'event_id', `${path}.event_id`),
    description: getRequiredString(value, 'description', `${path}.description`),
    payload_schema: getRequiredRecord(value, 'payload_schema', `${path}.payload_schema`),
  };
}

function validateEventsArray(value: unknown, path: string): AgroPluginEvent[] {
  assertCondition(Array.isArray(value), path, 'must be an array');
  return value.map((entry, index) => validateEvent(entry, `${path}[${index}]`));
}

export function validateAgroPluginManifest(manifest: unknown): AgroPluginManifest {
  assertCondition(isRecord(manifest), 'manifest', 'must be an object');

  const identity = getRequiredRecord(manifest, 'identity', 'identity');
  const versioning = getRequiredRecord(manifest, 'versioning', 'versioning');
  const compatibility = getRequiredRecord(manifest, 'compatibility', 'compatibility');
  const permissions = getRequiredRecord(manifest, 'permissions', 'permissions');
  const tenantSettings = getRequiredRecord(manifest, 'tenant_settings', 'tenant_settings');
  const routes = getRequiredRecord(manifest, 'routes', 'routes');
  const events = getRequiredRecord(manifest, 'events', 'events');
  const billing = getRequiredRecord(manifest, 'billing', 'billing');
  const multiTenant = getRequiredRecord(manifest, 'multi_tenant', 'multi_tenant');
  const dataAccess = getRequiredRecord(permissions, 'data_access', 'permissions.data_access');
  const uninstallStrategy = getRequiredRecord(
    manifest,
    'uninstall_strategy',
    'uninstall_strategy'
  );

  return {
    identity: {
      plugin_id: (() => {
        const value = getRequiredString(identity, 'plugin_id', 'identity.plugin_id');
        assertCondition(
          PLUGIN_ID_PATTERN.test(value),
          'identity.plugin_id',
          'must match the expected plugin id pattern'
        );
        return value;
      })(),
      slug: (() => {
        const value = getRequiredString(identity, 'slug', 'identity.slug');
        assertCondition(
          SLUG_PATTERN.test(value),
          'identity.slug',
          'must match the expected slug pattern'
        );
        return value;
      })(),
      display_name: getRequiredString(identity, 'display_name', 'identity.display_name'),
      summary: getRequiredString(identity, 'summary', 'identity.summary'),
      category: getEnumValue(
        identity,
        'category',
        'identity.category',
        AGRO_PLUGIN_CATEGORY_VALUES
      ),
      tier: getEnumValue(identity, 'tier', 'identity.tier', AGRO_PLUGIN_TIER_VALUES),
      visibility: getEnumValue(
        identity,
        'visibility',
        'identity.visibility',
        AGRO_PLUGIN_VISIBILITY_VALUES
      ),
      maturity: getEnumValue(
        identity,
        'maturity',
        'identity.maturity',
        AGRO_PLUGIN_MATURITY_VALUES
      ),
    },
    versioning: {
      plugin_version: (() => {
        const value = getRequiredString(
          versioning,
          'plugin_version',
          'versioning.plugin_version'
        );
        assertCondition(
          SEMVER_PATTERN.test(value),
          'versioning.plugin_version',
          'must be a valid semver string'
        );
        return value;
      })(),
      runtime_api_version: getRequiredString(
        versioning,
        'runtime_api_version',
        'versioning.runtime_api_version'
      ),
    },
    compatibility: {
      core_version_range: getRequiredString(
        compatibility,
        'core_version_range',
        'compatibility.core_version_range'
      ),
      required_capabilities: getRequiredStringArray(
        compatibility,
        'required_capabilities',
        'compatibility.required_capabilities'
      ),
      optional_capabilities: getRequiredStringArray(
        compatibility,
        'optional_capabilities',
        'compatibility.optional_capabilities'
      ),
      incompatible_plugins: getRequiredStringArray(
        compatibility,
        'incompatible_plugins',
        'compatibility.incompatible_plugins'
      ),
    },
    permissions: {
      scopes: getRequiredStringArray(permissions, 'scopes', 'permissions.scopes'),
      data_access: {
        field_data: getRequiredBoolean(dataAccess, 'field_data', 'permissions.data_access.field_data'),
        financial: getRequiredBoolean(dataAccess, 'financial', 'permissions.data_access.financial'),
        personal_info: getRequiredBoolean(
          dataAccess,
          'personal_info',
          'permissions.data_access.personal_info'
        ),
      },
    },
    tenant_settings: {
      schema_version: getRequiredString(
        tenantSettings,
        'schema_version',
        'tenant_settings.schema_version'
      ),
      required: getRequiredBoolean(
        tenantSettings,
        'required',
        'tenant_settings.required'
      ),
      defaults: getRequiredRecord(tenantSettings, 'defaults', 'tenant_settings.defaults'),
      schema: getRequiredRecord(tenantSettings, 'schema', 'tenant_settings.schema'),
    },
    routes: {
      navigation: validateRoutesArray(routes.navigation, 'routes.navigation'),
      pages: validateRoutesArray(routes.pages, 'routes.pages'),
    },
    events: {
      emits: validateEventsArray(events.emits, 'events.emits'),
      consumes: validateEventsArray(events.consumes, 'events.consumes'),
    },
    billing: {
      model: getEnumValue(
        billing,
        'model',
        'billing.model',
        AGRO_PLUGIN_BILLING_MODE_VALUES
      ),
      feature_flag: getRequiredString(billing, 'feature_flag', 'billing.feature_flag'),
    },
    multi_tenant: {
      isolation_model: getEnumValue(
        multiTenant,
        'isolation_model',
        'multi_tenant.isolation_model',
        AGRO_PLUGIN_ISOLATION_MODEL_VALUES
      ),
      per_tenant_overrides_allowed: getRequiredBoolean(
        multiTenant,
        'per_tenant_overrides_allowed',
        'multi_tenant.per_tenant_overrides_allowed'
      ),
    },
    uninstall_strategy: {
      mode: getEnumValue(
        uninstallStrategy,
        'mode',
        'uninstall_strategy.mode',
        AGRO_PLUGIN_UNINSTALL_MODE_VALUES
      ),
      data_retention_days: getRequiredNonNegativeInteger(
        uninstallStrategy,
        'data_retention_days',
        'uninstall_strategy.data_retention_days'
      ),
      reversible_within_days: getRequiredNonNegativeInteger(
        uninstallStrategy,
        'reversible_within_days',
        'uninstall_strategy.reversible_within_days'
      ),
    },
  };
}
