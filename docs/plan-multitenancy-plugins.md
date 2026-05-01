# Plan Integración Multi-tenant + Sistema de Plugins — Ejecución multi-agente

**Fecha:** 2026-05-01
**Feature:** Migrar SIG-Agro a un sistema de plugins dinámicos y control de acceso multi-tenant robusto, compatible con el ecosistema de 9001app-firebase, manteniendo autonomía como aplicación standalone.
**Proyectos afectados:** `SIG-Agro`, `9001app-firebase` (referencia/modelo)

---

## Análisis comparativo: Estado actual vs Estado objetivo

### Multi-tenancy

| Dimensión | 9001app-firebase (referencia) | SIG-Agro (actual) | SIG-Agro (objetivo) |
|-----------|-------------------------------|-------------------|----------------------|
| Modelo | Centralizado (`organization_id` en User) | Descentralizado (subcolección `members`) | Híbrido: subcolección + índice en User |
| Multi-org | Parcial (super_admin override) | Nativo (`organizationIds[]`) | Nativo mejorado con contexto activo |
| Roles | Doble sistema (legacy + global, 6+6 roles) | Simple (5 roles) | Extendido (5 roles + perfiles funcionales agro) |
| Resolución de permisos | `effectiveAccess.ts` con functional profiles | Inline en componentes | Servicio dedicado `EffectiveAccessService` |
| Data scopes | 5 niveles (`all` → `assigned_only`) | No existe | 3 niveles (`org` → `field` → `plot`) |
| Workspace views | 5 vistas predefinidas | No existe | 3 vistas agro: `ejecutiva`, `operativa`, `mobile` |

### Sistema de Plugins

| Dimensión | 9001app-firebase (referencia) | SIG-Agro (actual) | SIG-Agro (objetivo) |
|-----------|-------------------------------|-------------------|----------------------|
| Plugins | 31+ manifiestos con ciclo de vida completo | No existe — módulos hardcodeados | 8 plugins agro nativos + arquitectura extensible |
| Ciclo de vida | install → enable → disable → uninstall | N/A | Mismo modelo adaptado |
| Marketplace | Público + privado + interno | N/A | Marketplace interno agro |
| Billing | Integrado con Mobbex por plugin | Plan-based simple | Plan-based + feature flags por plugin |
| Auditoría | Nivel plugin, configurable | Básica | Nivel módulo con trazabilidad agro |
| Compatibilidad | `incompatible_plugins[]`, `required_capabilities[]` | N/A | Dependencias entre módulos agro |

### Stack técnico

| | 9001app-firebase | SIG-Agro |
|--|-----------------|---------|
| Next.js | 14.2.18 | 16.0.8 |
| React | 18.3.1 | 19.2.1 |
| Firebase | 12.4.0 | 12.6.0 |
| Testing | Jest + Playwright | Vitest + Playwright |
| AI | Anthropic + OpenAI + Groq | Sin AI SDK directo |
| Internacionalización | No | next-intl |
| Mapas | No | Leaflet + react-leaflet |

---

## Arquitectura objetivo de SIG-Agro

```
src/
├── lib/
│   ├── plugins/
│   │   ├── manifestSchema.ts          ← Esquema de manifiesto (port de 9001app)
│   │   ├── PluginRegistry.ts          ← Registro en memoria de plugins activos
│   │   └── PluginLifecycleService.ts  ← install/enable/disable/uninstall
│   ├── access-control/
│   │   ├── effectiveAccess.ts         ← Resolución de permisos efectivos
│   │   ├── profiles.ts                ← Perfiles funcionales agro
│   │   └── workspaces.ts              ← Workspace views agro
│   └── auth-utils.ts                  ← (existente, extender)
├── config/
│   └── plugins/
│       ├── campos.manifest.ts
│       ├── campanias.manifest.ts
│       ├── contabilidad_agro.manifest.ts
│       ├── analisis_ia.manifest.ts
│       ├── mapa_gis.manifest.ts
│       ├── documentos.manifest.ts
│       ├── metricas.manifest.ts
│       └── scouting.manifest.ts
├── types/
│   ├── plugins.ts                     ← Tipos de plugins agro
│   ├── access-control.ts              ← Tipos de control de acceso
│   └── organization.ts                ← (existente, extender)
└── services/
    ├── plugins/
    │   └── CapabilityService.ts
    └── access/
        └── UserContextService.ts
```

---

## Resumen de olas

| Ola | Agentes | Paralelos entre sí | Dependen de |
|-----|---------|---------------------|-------------|
| 1 | A, B, C | Sí | Nada |
| 2 | A, B, C | Sí | Ola 1 completa |
| 3 | A, B | Sí | Ola 2 completa |
| 4 | A | No aplica (único) | Ola 3 completa |
| 5 | A, B | Sí | Ola 4 completa |

---

## Ola 1 — Contratos de tipos y esquemas base
> Ejecutar Agente A + Agente B + Agente C en PARALELO
> Ninguno modifica los mismos archivos. Son contratos puros (solo tipos, sin lógica).

---

### Agente A — Esquema de manifiesto de plugin agro

**Puede ejecutarse en paralelo con:** Agente B, Agente C
**Depende de:** nada — es la primera ola

#### Objetivo
Crear el esquema TypeScript completo de manifiestos de plugin adaptado al dominio agrícola de SIG-Agro, portando la estructura de 9001app-firebase.

#### Archivos a crear
- `src/lib/plugins/manifestSchema.ts` — Tipos y esquema Zod del manifiesto de plugin agro
- `src/types/plugins.ts` — Re-exports de tipos públicos del sistema de plugins

#### Archivos a modificar
- ninguno

#### Prompt completo para el agente

```
Eres un agente de implementación para el proyecto SIG-Agro.

STACK: Next.js 16, React 19, TypeScript estricto, Firebase 12.6, Vitest para tests.
RUTA DEL PROYECTO: c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro

CONTEXTO:
SIG-Agro es una aplicación agrícola que necesita un sistema de plugins dinámicos.
Tomar como modelo el archivo de 9001app-firebase:
  c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\9001app-firebase\src\lib\plugins\manifestSchema.ts

TAREA — crear src/lib/plugins/manifestSchema.ts con:

1. Tipo `AgroPluginManifest` con estas secciones:
   - identity: { plugin_id, slug, display_name, summary, category, tier, visibility, maturity }
   - versioning: { plugin_version (semver), runtime_api_version }
   - compatibility: { core_version_range, required_capabilities, optional_capabilities, incompatible_plugins }
   - permissions: { scopes, data_access: { field_data, financial, personal_info: boolean } }
   - tenant_settings: { schema_version, required, defaults, schema }
   - routes: { navigation: AgroPluginRoute[], pages: AgroPluginRoute[] }
   - events: { emits: AgroPluginEvent[], consumes: AgroPluginEvent[] }
   - billing: { model: 'free' | 'plan_included' | 'add_on', feature_flag }
   - multi_tenant: { isolation_model: 'logical_per_organization' | 'shared', per_tenant_overrides_allowed }
   - uninstall_strategy: { mode: 'soft_remove' | 'hard_remove', data_retention_days, reversible_within_days }

2. Tipos auxiliares:
   - AgroPluginCategory: 'campo_gis' | 'produccion' | 'contabilidad' | 'ia_analitica' | 'documentos' | 'compliance' | 'integraciones'
   - AgroPluginTier: 'base' | 'optional' | 'premium'
   - AgroPluginVisibility: 'internal' | 'marketplace'
   - AgroPluginMaturity: 'draft' | 'beta' | 'ga' | 'deprecated'
   - AgroPluginRoute: { path, label, icon?, requiredPermissions: string[] }
   - AgroPluginEvent: { event_id, description, payload_schema }

3. Función de validación `validateAgroPluginManifest(manifest: unknown): AgroPluginManifest`
   Usar Zod si ya está en las dependencias del package.json (verificar primero).
   Si no hay Zod, usar validación manual con type guards.

4. Constantes:
   - AGRO_PLUGIN_CATEGORIES: Record<AgroPluginCategory, string> (labels en español)
   - AGRO_PLUGIN_API_VERSION: '1.0.0'

TAMBIÉN crear src/types/plugins.ts que re-exporte los tipos públicos:
  export type { AgroPluginManifest, AgroPluginCategory, AgroPluginTier, AgroPluginRoute } from '../lib/plugins/manifestSchema'

RESTRICCIONES:
- No crear ningún manifiesto concreto todavía (eso es Ola 2)
- No crear servicios (eso es Ola 2)
- Solo tipos y esquema de validación
- Usar TypeScript estricto — sin `any`

CRITERIO DE ÉXITO:
- El archivo compila sin errores con `npx tsc --noEmit`
- Todos los tipos están exportados
```

---

### Agente B — Tipos de control de acceso agro

**Puede ejecutarse en paralelo con:** Agente A, Agente C
**Depende de:** nada — es la primera ola

#### Objetivo
Crear el sistema de tipos para control de acceso extendido: perfiles funcionales agro, workspace views, data scopes, y resolución de permisos efectivos.

#### Archivos a crear
- `src/types/access-control.ts` — Tipos completos de control de acceso agro

#### Archivos a modificar
- ninguno (no tocar `src/types/organization.ts` todavía)

#### Prompt completo para el agente

```
Eres un agente de implementación para el proyecto SIG-Agro.

STACK: Next.js 16, React 19, TypeScript estricto, Firebase 12.6.
RUTA DEL PROYECTO: c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro

CONTEXTO:
Leer primero estos archivos para entender los tipos existentes:
  - src/types/organization.ts (tipos actuales de User y Organization)

Tomar como modelo (solo para estructura, no copiar verbatim):
  c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\9001app-firebase\src\types\access-control.ts

TAREA — crear src/types/access-control.ts con:

1. Perfiles funcionales agro:
   type AgroFunctionalProfile = 
     'productor_ejecutivo' |    // dueño del campo, visión macro
     'ing_agronomo' |           // técnico, acceso operativo completo
     'operario_campo' |         // acceso reducido, solo operativa
     'contador_agro' |          // acceso financiero, sin datos de campo
     'auditor_externo' |        // solo lectura, sin datos sensibles
     'admin_sistema'            // acceso total

2. Workspace views agro:
   type AgroWorkspaceView = 
     'ejecutiva' |    // KPIs, métricas, contabilidad consolidada
     'operativa' |    // mapa GIS, lotes, campañas, scouting
     'mobile'         // vista reducida para trabajo en campo

3. Data scopes:
   type AgroDataScope = 
     'all_organizations' |      // super_admin
     'organization' |           // toda la organización
     'assigned_fields' |        // solo campos asignados
     'assigned_plots'           // solo lotes asignados

4. Permisos efectivos resueltos:
   interface AgroEffectiveAccess {
     userId: string
     organizationId: string
     role: OrganizationRole               // importar de organization.ts
     functionalProfile: AgroFunctionalProfile
     workspaceView: AgroWorkspaceView
     dataScope: AgroDataScope
     enabledModules: string[]             // plugin slugs habilitados
     permissions: {
       canRead: boolean
       canWrite: boolean
       canDelete: boolean
       canAdmin: boolean
       canExport: boolean
       canViewFinancials: boolean
       canManageUsers: boolean
     }
     fieldIds?: string[]                  // si dataScope === 'assigned_fields'
     plotIds?: string[]                   // si dataScope === 'assigned_plots'
   }

5. Mapeo de roles a perfil default:
   const ROLE_TO_DEFAULT_PROFILE: Record<OrganizationRole, AgroFunctionalProfile>

6. Mapeo de perfil a workspace default:
   const PROFILE_TO_WORKSPACE: Record<AgroFunctionalProfile, AgroWorkspaceView>

7. Módulos permitidos por perfil:
   const PROFILE_TO_MODULES: Record<AgroFunctionalProfile, string[]>

RESTRICCIONES:
- No importar de archivos que aún no existen
- Solo importar de src/types/organization.ts (que ya existe)
- No implementar lógica de resolución (eso es Ola 2 — EffectiveAccessService)

CRITERIO DE ÉXITO:
- El archivo compila sin errores
- Todos los tipos y constantes están exportados nombrados
```

---

### Agente C — Extensión del tipo User y Organization

**Puede ejecutarse en paralelo con:** Agente A, Agente B
**Depende de:** nada — es la primera ola

#### Objetivo
Extender los tipos `User` y `Organization` en `organization.ts` para soportar perfiles funcionales, módulos dinámicos por plugin, y contexto multi-org mejorado — sin romper el código existente.

#### Archivos a modificar
- `src/types/organization.ts` — Agregar campos opcionales a `User`, `OrganizationMember`, y `Organization`

#### Prompt completo para el agente

```
Eres un agente de implementación para el proyecto SIG-Agro.

STACK: Next.js 16, React 19, TypeScript estricto, Firebase 12.6.
RUTA DEL PROYECTO: c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro

TAREA — modificar src/types/organization.ts:

PRIMERO leer el archivo completo para entender su estado actual.

AGREGAR al tipo User (campos opcionales para no romper código existente):
  functionalProfile?: string              // AgroFunctionalProfile — string para evitar dependencia circular
  workspaceView?: string                  // AgroWorkspaceView
  activeOrganizationId?: string          // org activa en la sesión (multi-org)
  installedPlugins?: string[]            // slugs de plugins habilitados para este user
  permissionOverrides?: {
    allow?: string[]
    deny?: string[]
  }

AGREGAR al tipo OrganizationMember (campos opcionales):
  functionalProfile?: string
  dataScope?: string                      // AgroDataScope
  assignedFieldIds?: string[]
  assignedPlotIds?: string[]

AGREGAR al tipo Organization (campos opcionales):
  installedPlugins?: string[]            // slugs de plugins instalados en la org
  pluginSettings?: Record<string, unknown> // settings por plugin
  plan?: 'free' | 'starter' | 'pro' | 'enterprise'
  planFeatures?: string[]                // feature flags del plan

NO CAMBIAR:
- Tipos de roles existentes (OrganizationRole)
- Módulos USER_MODULES existentes
- Ningún campo ya existente
- Solo AGREGAR campos opcionales con `?`

CRITERIO DE ÉXITO:
- El archivo compila sin errores
- `grep -r "from.*organization" src/` sigue funcionando (no hay imports rotos)
- Todos los campos nuevos son opcionales (no rompen instancias existentes)
```

---

## Ola 2 — Lógica de servicios y manifiestos de plugins
> Ejecutar SOLO después de que Ola 1 esté completa
> Ejecutar Agente A + Agente B + Agente C en PARALELO

---

### Agente A — Manifiestos de los 8 plugins agro nativos

**Puede ejecutarse en paralelo con:** Agente B, Agente C
**Depende de:** Ola 1 completa (necesita `src/lib/plugins/manifestSchema.ts`)

#### Objetivo
Crear los 8 manifiestos de plugins para los módulos nativos de SIG-Agro: campos, campañas, contabilidad_agro, analisis_ia, mapa_gis, documentos, metricas, scouting.

#### Archivos a crear
- `src/config/plugins/campos.manifest.ts`
- `src/config/plugins/campanias.manifest.ts`
- `src/config/plugins/contabilidad_agro.manifest.ts`
- `src/config/plugins/analisis_ia.manifest.ts`
- `src/config/plugins/mapa_gis.manifest.ts`
- `src/config/plugins/documentos.manifest.ts`
- `src/config/plugins/metricas.manifest.ts`
- `src/config/plugins/scouting.manifest.ts`
- `src/config/plugins/index.ts` — registro central de todos los plugins

#### Prompt completo para el agente

```
Eres un agente de implementación para el proyecto SIG-Agro.

STACK: Next.js 16, React 19, TypeScript estricto, Firebase 12.6.
RUTA DEL PROYECTO: c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro

PRIMERO leer:
  - src/lib/plugins/manifestSchema.ts (creado en Ola 1 — el tipo AgroPluginManifest)
  - src/types/organization.ts (para conocer los roles existentes)

TOMAR COMO MODELO (para ver estructura de manifiestos reales):
  c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\9001app-firebase\src\config\plugins\crm.manifest.ts

TAREA — crear un manifiesto por plugin:

1. src/config/plugins/campos.manifest.ts
   - plugin_id: 'sig-agro-campos'
   - category: 'campo_gis', tier: 'base', maturity: 'ga'
   - Rutas: /campos, /campos/[id], /campos/nuevo
   - Permisos: read/write para operarios; delete para admin/owner
   - billing: 'plan_included'

2. src/config/plugins/campanias.manifest.ts
   - plugin_id: 'sig-agro-campanias'
   - category: 'produccion', tier: 'base', maturity: 'ga'
   - requires: ['sig-agro-campos']
   - Rutas: /campanias, /campanias/[id]
   - billing: 'plan_included'

3. src/config/plugins/contabilidad_agro.manifest.ts
   - plugin_id: 'sig-agro-contabilidad'
   - category: 'contabilidad', tier: 'optional', maturity: 'ga'
   - data_access: { financial: true }
   - Rutas: /contabilidad
   - billing: 'add_on'

4. src/config/plugins/analisis_ia.manifest.ts
   - plugin_id: 'sig-agro-ia'
   - category: 'ia_analitica', tier: 'premium', maturity: 'beta'
   - requires: ['sig-agro-campos', 'sig-agro-campanias']
   - Rutas: /analisis-ia
   - billing: 'add_on'

5. src/config/plugins/mapa_gis.manifest.ts
   - plugin_id: 'sig-agro-mapa-gis'
   - category: 'campo_gis', tier: 'base', maturity: 'ga'
   - Rutas: /mapa-gis
   - billing: 'plan_included'

6. src/config/plugins/documentos.manifest.ts
   - plugin_id: 'sig-agro-documentos'
   - category: 'compliance', tier: 'optional', maturity: 'ga'
   - Rutas: /documentos
   - billing: 'add_on'

7. src/config/plugins/metricas.manifest.ts
   - plugin_id: 'sig-agro-metricas'
   - category: 'ia_analitica', tier: 'optional', maturity: 'ga'
   - requires: ['sig-agro-campos', 'sig-agro-campanias']
   - Rutas: /metricas
   - billing: 'plan_included'

8. src/config/plugins/scouting.manifest.ts
   - plugin_id: 'sig-agro-scouting'
   - category: 'produccion', tier: 'optional', maturity: 'beta'
   - requires: ['sig-agro-campos']
   - Rutas: /scouting
   - billing: 'add_on'

9. src/config/plugins/index.ts — registro central:
   export const AGRO_PLUGINS: AgroPluginManifest[] = [ ...todos los 8 manifiestos ]
   export const AGRO_PLUGIN_BY_ID: Record<string, AgroPluginManifest>
   export const BASE_PLUGINS = AGRO_PLUGINS.filter(p => p.identity.tier === 'base')

RESTRICCIONES:
- No crear servicios de ciclo de vida (eso es Agente B de esta ola)
- Cada manifiesto es un objeto const tipado, sin lógica
```

---

### Agente B — PluginLifecycleService y CapabilityService

**Puede ejecutarse en paralelo con:** Agente A, Agente C
**Depende de:** Ola 1 completa (necesita manifestSchema.ts y types/plugins.ts)

#### Objetivo
Implementar los servicios de ciclo de vida de plugins: instalación, habilitación, deshabilitación y desinstalación, con persistencia en Firestore y validación de compatibilidad.

#### Archivos a crear
- `src/services/plugins/PluginLifecycleService.ts` — Ciclo de vida completo de plugins
- `src/services/plugins/CapabilityService.ts` — Consulta de capacidades instaladas por organización

#### Prompt completo para el agente

```
Eres un agente de implementación para el proyecto SIG-Agro.

STACK: Next.js 16, React 19, TypeScript estricto, Firebase 12.6.
RUTA DEL PROYECTO: c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro

PRIMERO leer:
  - src/lib/plugins/manifestSchema.ts (el tipo AgroPluginManifest)
  - src/types/plugins.ts
  - src/services/organizations.ts (para ver cómo se usan los servicios Firebase en este proyecto)
  - src/lib/firebase.ts o similar (para obtener la instancia de Firestore)

TOMAR COMO MODELO:
  c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\9001app-firebase\src\services\plugins\CapabilityService.ts

TAREA:

1. src/services/plugins/PluginLifecycleService.ts:

   interface InstalledPlugin {
     pluginId: string
     slug: string
     installedAt: Timestamp
     installedBy: string
     enabled: boolean
     enabledAt?: Timestamp
     settings: Record<string, unknown>
     version: string
   }

   class PluginLifecycleService {
     // Instala un plugin en una organización
     static async installPlugin(
       orgId: string, 
       manifest: AgroPluginManifest, 
       installedBy: string,
       initialSettings?: Record<string, unknown>
     ): Promise<void>
     
     // Habilita un plugin ya instalado
     static async enablePlugin(orgId: string, pluginId: string): Promise<void>
     
     // Deshabilita sin desinstalar
     static async disablePlugin(orgId: string, pluginId: string): Promise<void>
     
     // Desinstala con política de datos
     static async uninstallPlugin(
       orgId: string, 
       pluginId: string,
       hardRemove?: boolean
     ): Promise<void>
     
     // Lista plugins instalados para una org
     static async getInstalledPlugins(orgId: string): Promise<InstalledPlugin[]>
     
     // Verifica si un plugin está habilitado
     static async isPluginEnabled(orgId: string, pluginId: string): Promise<boolean>
     
     // Valida compatibilidad antes de instalar
     private static async validateCompatibility(
       orgId: string,
       manifest: AgroPluginManifest
     ): Promise<{ valid: boolean; errors: string[] }>
   }

   Colección Firestore: organizations/{orgId}/installed_plugins/{pluginId}

2. src/services/plugins/CapabilityService.ts:

   class CapabilityService {
     // Obtiene slugs de plugins habilitados para una org
     static async getEnabledPlugins(orgId: string): Promise<string[]>
     
     // Verifica si una org tiene un plugin específico habilitado
     static async hasCapability(orgId: string, pluginSlug: string): Promise<boolean>
     
     // Invalida caché de capacidades (llamar después de install/uninstall)
     static invalidateCache(orgId: string): void
     
     // Obtiene módulos (rutas) habilitados para una org
     static async getEnabledRoutes(orgId: string): Promise<string[]>
   }
   
   Usar caché en memoria (Map<string, string[]>) con TTL de 5 minutos.

RESTRICCIONES:
- No modificar firestore.rules (eso es Ola 3)
- No crear UI, solo servicios
- Manejar errores con tipos específicos, no con `any`
```

---

### Agente C — EffectiveAccessService y perfiles funcionales

**Puede ejecutarse en paralelo con:** Agente A, Agente B
**Depende de:** Ola 1 completa (necesita types/access-control.ts y types/organization.ts extendido)

#### Objetivo
Implementar el servicio que resuelve los permisos efectivos de un usuario en una organización, combinando role + functionalProfile + plugins habilitados.

#### Archivos a crear
- `src/lib/access-control/effectiveAccess.ts` — Función principal de resolución de acceso
- `src/lib/access-control/profiles.ts` — Configuración detallada de los 6 perfiles funcionales agro

#### Prompt completo para el agente

```
Eres un agente de implementación para el proyecto SIG-Agro.

STACK: Next.js 16, React 19, TypeScript estricto, Firebase 12.6.
RUTA DEL PROYECTO: c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro

PRIMERO leer:
  - src/types/access-control.ts (creado en Ola 1 — AgroEffectiveAccess, perfiles, etc.)
  - src/types/organization.ts (User, OrganizationMember, OrganizationRole)
  - src/lib/auth-utils.ts (utilidades existentes de auth)

TOMAR COMO MODELO:
  c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\9001app-firebase\src\config\access-control\profiles.ts
  c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\9001app-firebase\src\lib\access-control\effectiveAccess.ts

TAREA:

1. src/lib/access-control/profiles.ts:

   Definir configuración completa para los 6 perfiles:
   
   interface AgroProfileConfig {
     profile: AgroFunctionalProfile
     label: string
     description: string
     defaultWorkspace: AgroWorkspaceView
     defaultDataScope: AgroDataScope
     enabledModules: string[]           // slugs de plugins habilitados
     permissions: AgroEffectiveAccess['permissions']
     allowedRoles: OrganizationRole[]   // qué roles pueden tener este perfil
   }
   
   const AGRO_PROFILE_CONFIGS: Record<AgroFunctionalProfile, AgroProfileConfig>
   
   Perfiles a configurar:
   - productor_ejecutivo: workspace ejecutiva, scope=organization, modules=[dashboard, metricas, contabilidad, documentos]
   - ing_agronomo: workspace operativa, scope=organization, modules=todos
   - operario_campo: workspace operativa, scope=assigned_fields, modules=[campos, campanias, scouting, mapa_gis]
   - contador_agro: workspace ejecutiva, scope=organization, modules=[contabilidad, documentos, metricas]
   - auditor_externo: workspace ejecutiva, scope=organization, solo lectura, modules=[documentos, metricas]
   - admin_sistema: workspace ejecutiva (con panel admin), scope=all, todos los permisos

2. src/lib/access-control/effectiveAccess.ts:

   // Función principal — resuelve acceso efectivo desde los datos del user+member
   async function resolveEffectiveAccess(
     user: User,
     orgId: string,
     member: OrganizationMember,
     enabledPlugins: string[]           // desde CapabilityService (pasado como param para no crear dep circular)
   ): Promise<AgroEffectiveAccess>
   
   // Versión síncrona para cuando ya tenés todo el contexto
   function resolveAccessSync(
     role: OrganizationRole,
     functionalProfile: AgroFunctionalProfile | undefined,
     overrides: User['permissionOverrides'],
     enabledPlugins: string[]
   ): AgroEffectiveAccess['permissions']
   
   // Hook-friendly: recibe el contexto ya resuelto
   function canPerformAction(
     access: AgroEffectiveAccess,
     action: keyof AgroEffectiveAccess['permissions']
   ): boolean

RESTRICCIONES:
- No crear hooks de React todavía (eso es Ola 3)
- No importar de servicios de plugins (para evitar deps circulares — recibir enabledPlugins como parámetro)
- La función async puede leer Firestore directamente para obtener el member si no se pasa
```

---

## Ola 3 — Firestore Rules, hooks de React y contexto de auth
> Ejecutar SOLO después de que Ola 2 esté completa
> Ejecutar Agente A + Agente B en PARALELO

---

### Agente A — Actualización de Firestore Rules

**Puede ejecutarse en paralelo con:** Agente B
**Depende de:** Ola 2 completa (estructura de colecciones definida por PluginLifecycleService)

#### Objetivo
Actualizar `firestore.rules` para proteger las nuevas colecciones de plugins instalados y agregar helpers de verificación de capacidades.

#### Archivos a modificar
- `firestore.rules` — Agregar reglas para `installed_plugins` y helpers de capability

#### Prompt completo para el agente

```
Eres un agente de implementación para el proyecto SIG-Agro.

RUTA DEL PROYECTO: c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro

PRIMERO leer:
  - firestore.rules (el archivo completo)
  - src/services/plugins/PluginLifecycleService.ts (para conocer la colección exacta)

TOMAR COMO MODELO (para ver patrones de reglas de plugins):
  c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\9001app-firebase\firestore.rules

TAREA — agregar al firestore.rules existente:

1. Nuevas funciones helper (agregar junto a los helpers existentes):

   // Verifica si el usuario tiene rol admin o owner en la org
   function isOrgAdminOrOwner(orgId) {
     return isMember(orgId) && getMemberRole(orgId) in ['owner', 'admin'];
   }
   
   // Verifica si un plugin está instalado y habilitado
   function isPluginEnabled(orgId, pluginId) {
     return exists(/databases/$(database)/documents/organizations/$(orgId)/installed_plugins/$(pluginId))
       && get(/databases/$(database)/documents/organizations/$(orgId)/installed_plugins/$(pluginId)).data.enabled == true;
   }

2. Nueva sección de reglas para installed_plugins:

   match /organizations/{orgId}/installed_plugins/{pluginId} {
     allow read: if isMember(orgId) && isAdminOrOwner(orgId);
     allow create: if isMember(orgId) && isAdminOrOwner(orgId);
     allow update: if isMember(orgId) && isAdminOrOwner(orgId);
     allow delete: if isMember(orgId) && hasRole(orgId, ['owner']);  // solo owner puede desinstalar
   }

3. Nueva sección para plugin_settings por org:

   match /organizations/{orgId}/plugin_settings/{pluginId} {
     allow read: if isMember(orgId);
     allow write: if isMember(orgId) && isAdminOrOwner(orgId);
   }

RESTRICCIONES:
- NO modificar las reglas existentes, solo AGREGAR
- Mantener el estilo de indentación existente
- Agregar comentario `// === Plugin System Rules ===` antes de la nueva sección

CRITERIO DE ÉXITO:
- `firebase emulators:exec "echo ok"` no reporta errores de sintaxis en las rules
- Las reglas existentes no fueron modificadas
```

---

### Agente B — Hook useEffectiveAccess y actualización de AuthContext

**Puede ejecutarse en paralelo con:** Agente A
**Depende de:** Ola 2 completa (necesita EffectiveAccessService y CapabilityService)

#### Objetivo
Crear el hook `useEffectiveAccess` para usar en componentes React, y extender el `AuthContext` para exponer el acceso efectivo y los plugins habilitados del usuario activo.

#### Archivos a crear
- `src/hooks/useEffectiveAccess.ts` — Hook React que resuelve y cachea el acceso efectivo

#### Archivos a modificar
- `src/contexts/AuthContext.tsx` — Agregar `effectiveAccess`, `enabledPlugins`, `activeOrgId` al contexto

#### Prompt completo para el agente

```
Eres un agente de implementación para el proyecto SIG-Agro.

STACK: Next.js 16, React 19, TypeScript estricto.
RUTA DEL PROYECTO: c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro

PRIMERO leer completamente:
  - src/contexts/AuthContext.tsx (el archivo completo — es crítico no romperlo)
  - src/lib/access-control/effectiveAccess.ts (creado en Ola 2)
  - src/services/plugins/CapabilityService.ts (creado en Ola 2)
  - src/types/access-control.ts (creado en Ola 1)

TAREA:

1. src/hooks/useEffectiveAccess.ts:

   export function useEffectiveAccess(orgId?: string): {
     access: AgroEffectiveAccess | null
     isLoading: boolean
     can: (action: keyof AgroEffectiveAccess['permissions']) => boolean
     hasPlugin: (pluginSlug: string) => boolean
   }
   
   - Si orgId no se pasa, usar el activeOrganizationId del AuthContext
   - Usar useMemo para no re-resolver en cada render
   - Invalidar cuando cambia orgId o los plugins habilitados

2. Modificar src/contexts/AuthContext.tsx (CUIDADOSAMENTE):

   Agregar al contexto (sin eliminar nada existente):
   - effectiveAccess: AgroEffectiveAccess | null
   - enabledPlugins: string[]
   - activeOrgId: string | null
   - setActiveOrg: (orgId: string) => void  // para cambio de org activa

   En el provider, cargar los plugins habilitados cuando cambia la org activa:
   useEffect(() => {
     if (activeOrgId) {
       CapabilityService.getEnabledPlugins(activeOrgId).then(setEnabledPlugins)
     }
   }, [activeOrgId])

RESTRICCIONES:
- El AuthContext existente NO debe romper su interfaz actual (agregar, no cambiar)
- Tipar todo — sin `any`
- El hook debe devolver valores seguros cuando no hay usuario (null/false/[])

CRITERIO DE ÉXITO:
- Ningún componente existente rompe (la interfaz del contexto es aditiva)
- El hook retorna `can('canRead') === false` cuando no hay acceso resuelto
```

---

## Ola 4 — Integración en UI: sidebar dinámico y guard de ruta
> Ejecutar SOLO después de que Ola 3 esté completa
> Único agente

---

### Agente A — Sidebar dinámico por plugins y PluginGuard

**Puede ejecutarse en paralelo con:** es el único de esta ola
**Depende de:** Ola 3 completa (necesita `useEffectiveAccess`, `AuthContext` extendido)

#### Objetivo
Actualizar el sidebar de navegación para que muestre solo las rutas de plugins habilitados para la organización activa, y crear el componente `PluginGuard` que protege rutas por capacidad.

#### Archivos a crear
- `src/components/PluginGuard.tsx` — HOC/wrapper que bloquea acceso si el plugin no está habilitado

#### Archivos a modificar
- `src/components/Sidebar.tsx` (o el componente de navegación existente) — Leer rutas desde plugins activos en lugar de hardcodear

#### Prompt completo para el agente

```
Eres un agente de implementación para el proyecto SIG-Agro.

STACK: Next.js 16, React 19, TypeScript estricto, Tailwind CSS.
RUTA DEL PROYECTO: c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro

PRIMERO leer:
  - src/hooks/useEffectiveAccess.ts (creado en Ola 3)
  - src/contexts/AuthContext.tsx (con los cambios de Ola 3)
  - src/config/plugins/index.ts (creado en Ola 2 — todos los manifiestos)
  - El componente de sidebar existente (buscar en src/components/ o src/app/layout o similar)
  - src/services/plugins/CapabilityService.ts

TAREA:

1. src/components/PluginGuard.tsx:

   interface PluginGuardProps {
     pluginSlug: string
     fallback?: React.ReactNode        // qué mostrar si no habilitado
     children: React.ReactNode
   }
   
   export function PluginGuard({ pluginSlug, fallback, children }: PluginGuardProps)
   
   - Usar `useEffectiveAccess` para verificar si el plugin está habilitado
   - Si no está habilitado: mostrar fallback o null
   - Si está cargando: mostrar skeleton sencillo (no spinner — usar Tailwind animate-pulse)

2. Modificar el sidebar existente:
   - Leer `enabledPlugins` del AuthContext (o desde `useEffectiveAccess`)
   - Filtrar los items de navegación usando AGRO_PLUGINS del index.ts:
     const visibleRoutes = AGRO_PLUGINS
       .filter(p => enabledPlugins.includes(p.identity.slug))
       .flatMap(p => p.routes.navigation)
   - Mantener los items que no son de plugins (perfil, configuración, etc.)
   - El sidebar debe ser idéntico visualmente — solo cambia la fuente de los items

RESTRICCIONES:
- No cambiar el diseño visual del sidebar
- No modificar los estilos Tailwind existentes
- PluginGuard solo filtra por capacidad, no por permisos de rol (eso lo hace useEffectiveAccess)

CRITERIO DE ÉXITO:
- Al deshabilitar un plugin desde Firestore, su ruta desaparece del sidebar
- PluginGuard renderiza el fallback cuando el plugin no está activo
- La UI sigue siendo idéntica cuando todos los plugins están habilitados
```

---

## Ola 5 — Tests y documentación técnica
> Ejecutar SOLO después de que Ola 4 esté completa
> Ejecutar Agente A + Agente B en PARALELO

---

### Agente A — Tests unitarios del sistema de plugins

**Puede ejecutarse en paralelo con:** Agente B
**Depende de:** Ola 4 completa

#### Objetivo
Escribir tests unitarios con Vitest para el núcleo del sistema: manifestSchema, effectiveAccess, y CapabilityService.

#### Archivos a crear
- `src/lib/plugins/__tests__/manifestSchema.test.ts`
- `src/lib/access-control/__tests__/effectiveAccess.test.ts`
- `src/services/plugins/__tests__/CapabilityService.test.ts`

#### Prompt completo para el agente

```
Eres un agente de tests para el proyecto SIG-Agro.

STACK: Vitest, TypeScript estricto. NO usar Jest.
RUTA DEL PROYECTO: c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro
CONFIG: vitest.config.ts

PRIMERO leer:
  - src/lib/plugins/manifestSchema.ts
  - src/lib/access-control/effectiveAccess.ts
  - src/services/plugins/CapabilityService.ts
  - Un test existente del proyecto (buscar en src/**/__tests__/) para ver el estilo

TAREA — crear 3 archivos de tests:

1. src/lib/plugins/__tests__/manifestSchema.test.ts:
   - Test: validateAgroPluginManifest rechaza manifest sin campos requeridos
   - Test: validateAgroPluginManifest acepta manifest válido completo
   - Test: AGRO_PLUGIN_API_VERSION es semver válido

2. src/lib/access-control/__tests__/effectiveAccess.test.ts:
   - Test: rol 'owner' resuelve a perfil 'admin_sistema' por default
   - Test: rol 'operator' resuelve a perfil 'operario_campo' por default
   - Test: permissionOverrides.deny bloquea canWrite aunque el rol lo permita
   - Test: resolveAccessSync con plugins vacíos deshabilita módulos premium

3. src/services/plugins/__tests__/CapabilityService.test.ts:
   - Mockear Firestore con vi.mock
   - Test: getEnabledPlugins retorna array vacío si no hay plugins
   - Test: hasCapability retorna false para plugin no instalado
   - Test: caché se invalida correctamente con invalidateCache()

RESTRICCIONES:
- No testear UI (eso es e2e con Playwright)
- Usar vi.mock para Firestore — no llamar Firestore real
- Cada test debe ser independiente (beforeEach limpia estado)
```

---

### Agente B — Test E2E del flujo de instalación de plugin

**Puede ejecutarse en paralelo con:** Agente A
**Depende de:** Ola 4 completa

#### Objetivo
Escribir un test Playwright que verifique el flujo completo: login → org con plugin deshabilitado → el item de sidebar no aparece → habilitar plugin → el item aparece.

#### Archivos a crear
- `tests/e2e/plugin-system.spec.ts`

#### Prompt completo para el agente

```
Eres un agente de tests E2E para el proyecto SIG-Agro.

STACK: Playwright, TypeScript. 
RUTA DEL PROYECTO: c:\Users\Usuario\Documents\Proyectos\ISO -conjunto\SIG-Agro
CONFIG: playwright.config.ts

PRIMERO leer:
  - playwright.config.ts (configuración base URL, browsers, etc.)
  - tests/e2e/main-flows.spec.ts (el test E2E existente — para ver el estilo)
  - src/config/plugins/index.ts (para conocer los slugs de plugins)

TAREA — crear tests/e2e/plugin-system.spec.ts:

Test 1 — Plugin deshabilitado oculta navegación:
  1. Login con usuario admin de test
  2. Verificar que el sidebar no muestra el item de 'analisis-ia' (plugin premium)
  3. Navegar a /analisis-ia directamente
  4. Verificar que aparece el componente PluginGuard fallback (buscar por data-testid="plugin-not-enabled")

Test 2 — Flujo de habilitación de plugin:
  1. Login como owner
  2. Ir a /configuracion/plugins (ruta del marketplace interno)
  3. Encontrar el plugin 'Análisis IA'
  4. Hacer click en 'Habilitar'
  5. Verificar que el item aparece en el sidebar
  6. Navegar a /analisis-ia y verificar que carga (no fallback)

Test 3 — Cambio de organización activa:
  1. Login con usuario que pertenece a 2 organizaciones
  2. Verificar plugins de org 1
  3. Cambiar a org 2 usando el selector de org
  4. Verificar que los plugins del sidebar reflejan la org 2

RESTRICCIONES:
- Si el ambiente de test no tiene los datos necesarios, marcar tests como `test.skip`
- Usar `data-testid` para selectores, no texto visible
- No hardcodear IDs de usuario — usar variables de entorno `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`
```

---

## Verificación final

### Checklist por capa

#### Tipos y esquemas
- [ ] `src/lib/plugins/manifestSchema.ts` compila sin errores (`npx tsc --noEmit`)
- [ ] `src/types/access-control.ts` exporta todos los tipos necesarios
- [ ] `src/types/organization.ts` no tiene cambios breaking (todos los campos nuevos son opcionales)

#### Config / Manifiestos
- [ ] Los 8 manifiestos en `src/config/plugins/` son válidos según `validateAgroPluginManifest()`
- [ ] `src/config/plugins/index.ts` exporta todos los plugins correctamente
- [ ] Los manifiestos con `required_capabilities` tienen dependencias instalables

#### Servicios
- [ ] `PluginLifecycleService.installPlugin()` escribe en Firestore correctamente
- [ ] `CapabilityService.getEnabledPlugins()` lee desde Firestore con caché
- [ ] `resolveEffectiveAccess()` retorna el perfil correcto para cada combinación rol+profile

#### Firestore
- [ ] Las reglas para `organizations/{orgId}/installed_plugins/{pluginId}` están activas
- [ ] Solo owner puede eliminar plugins (regla restrictiva)
- [ ] Los helpers `isPluginEnabled()` funcionan correctamente

#### React / UI
- [ ] `useEffectiveAccess()` no causa re-renders infinitos
- [ ] `AuthContext` expone `enabledPlugins` sin romper los consumidores existentes
- [ ] Sidebar muestra solo rutas de plugins habilitados
- [ ] `PluginGuard` muestra fallback cuando plugin deshabilitado

#### Tests
- [ ] `npx vitest run` pasa todos los tests unitarios
- [ ] `npx playwright test plugin-system.spec.ts` pasa (o está correctamente skippeado)

---

## Decisiones de arquitectura clave

### Por qué subcolección para installed_plugins (no campo en Organization)
Los plugins instalados pueden ser muchos y necesitan consultas individuales con reglas de seguridad específicas. Una subcolección permite aplicar reglas Firestore granulares, indexar por estado, y escalar sin límites de documento.

### Por qué caché en CapabilityService (no solo Firestore)
Las verificaciones de capacidad ocurren en cada render del sidebar y en cada navegación. Hacer un read de Firestore por render sería prohibitivo en costo y latencia. El caché de 5 minutos es el balance correcto para un sistema donde los cambios de plugins son infrecuentes.

### Por qué perfiles funcionales separados de roles
Los roles (owner/admin/operator/viewer) son sobre autorización en la organización. Los perfiles funcionales (ing_agronomo/contador_agro) son sobre qué ve el usuario en la UI. Son ortogonales: un `operator` puede ser `ing_agronomo` o `operario_campo`. Esta separación permite personalización sin comprometer seguridad.

### Por qué pasar enabledPlugins como parámetro a resolveEffectiveAccess
Para evitar dependencias circulares: `effectiveAccess.ts` no puede importar `CapabilityService` (que importa Firebase) porque `effectiveAccess` también lo usa. La inversión de dependencia mantiene el núcleo puro y testeable sin mocks de Firebase.

### Compatibilidad con 9001app-firebase
Los manifiestos de SIG-Agro siguen el mismo esquema base que 9001app-firebase, con extensiones agro-específicas. Esto permite que en el futuro SIG-Agro sea un plugin registrable en el marketplace de 9001app, con un manifiesto que declares sus rutas, permisos, y eventos.

---

*Generado con plan-olas — SIG-Agro v1.0 | 2026-05-01*
