import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  AGRO_PLUGIN_API_VERSION,
  type AgroPluginManifest,
} from '@/lib/plugins/manifestSchema';
import { AGRO_PLUGIN_BY_ID } from '@/config/plugins';
import { CapabilityService } from './CapabilityService';

export interface InstalledPlugin {
  pluginId: string;
  slug: string;
  installedAt: Timestamp;
  installedBy: string;
  enabled: boolean;
  enabledAt?: Timestamp;
  settings: Record<string, unknown>;
  version: string;
}

type InstalledPluginDocument = InstalledPlugin & {
  disabledAt?: Timestamp;
  uninstalledAt?: Timestamp;
};

class PluginLifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class PluginCompatibilityError extends PluginLifecycleError {
  constructor(public readonly errors: string[]) {
    super(`Compatibilidad fallida: ${errors.join(', ')}`);
  }
}

export class PluginAlreadyInstalledError extends PluginLifecycleError {}
export class PluginNotInstalledError extends PluginLifecycleError {}
export class PluginUninstallPolicyError extends PluginLifecycleError {}
export class PluginManifestNotFoundError extends PluginLifecycleError {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toInstalledPlugin(
  snapshot: QueryDocumentSnapshot<DocumentData> | { id: string; data(): DocumentData }
): InstalledPlugin {
  const raw = snapshot.data();
  const installedAt =
    raw.installedAt instanceof Timestamp ? raw.installedAt : Timestamp.now();
  const enabledAt = raw.enabledAt instanceof Timestamp ? raw.enabledAt : undefined;
  const settings = isRecord(raw.settings) ? raw.settings : {};

  return {
    pluginId:
      typeof raw.pluginId === 'string' && raw.pluginId.length > 0
        ? raw.pluginId
        : snapshot.id,
    slug: typeof raw.slug === 'string' ? raw.slug : '',
    installedAt,
    installedBy: typeof raw.installedBy === 'string' ? raw.installedBy : '',
    enabled: raw.enabled === true,
    enabledAt,
    settings,
    version: typeof raw.version === 'string' ? raw.version : '0.0.0',
  };
}

export class PluginLifecycleService {
  private static readonly collectionName = 'installed_plugins';

  private static pluginsCollection(orgId: string) {
    return collection(db, 'organizations', orgId, PluginLifecycleService.collectionName);
  }

  private static pluginDocument(orgId: string, pluginId: string) {
    return doc(db, 'organizations', orgId, PluginLifecycleService.collectionName, pluginId);
  }

  static async installPlugin(
    orgId: string,
    manifest: AgroPluginManifest,
    installedBy: string,
    initialSettings?: Record<string, unknown>
  ): Promise<void> {
    const pluginId = manifest.identity.plugin_id;
    const existing = await getDoc(PluginLifecycleService.pluginDocument(orgId, pluginId));

    if (existing.exists()) {
      throw new PluginAlreadyInstalledError(
        `El plugin "${pluginId}" ya esta instalado en la organizacion "${orgId}"`
      );
    }

    const { valid, errors } = await PluginLifecycleService.validateCompatibility(orgId, manifest);
    if (!valid) {
      throw new PluginCompatibilityError(errors);
    }

    const now = Timestamp.now();
    const data: InstalledPluginDocument = {
      pluginId,
      slug: manifest.identity.slug,
      installedAt: now,
      installedBy,
      enabled: true,
      enabledAt: now,
      settings: initialSettings ?? manifest.tenant_settings.defaults,
      version: manifest.versioning.plugin_version,
    };

    await setDoc(PluginLifecycleService.pluginDocument(orgId, pluginId), data);
    CapabilityService.invalidateCache(orgId);
  }

  static async enablePlugin(orgId: string, pluginId: string): Promise<void> {
    const snapshot = await getDoc(PluginLifecycleService.pluginDocument(orgId, pluginId));

    if (!snapshot.exists()) {
      throw new PluginNotInstalledError(
        `El plugin "${pluginId}" no esta instalado en la organizacion "${orgId}"`
      );
    }

    const manifest = AGRO_PLUGIN_BY_ID[pluginId];
    if (!manifest) {
      throw new PluginManifestNotFoundError(
        `No se encontro el manifest registrado para el plugin "${pluginId}"`
      );
    }

    const installedPlugin = toInstalledPlugin(snapshot);
    if (installedPlugin.enabled) {
      return;
    }

    const { valid, errors } = await PluginLifecycleService.validateCompatibility(orgId, manifest);
    if (!valid) {
      throw new PluginCompatibilityError(errors);
    }

    await updateDoc(PluginLifecycleService.pluginDocument(orgId, pluginId), {
      enabled: true,
      enabledAt: Timestamp.now(),
      disabledAt: null,
      uninstalledAt: null,
    });

    CapabilityService.invalidateCache(orgId);
  }

  static async disablePlugin(orgId: string, pluginId: string): Promise<void> {
    const snapshot = await getDoc(PluginLifecycleService.pluginDocument(orgId, pluginId));

    if (!snapshot.exists()) {
      throw new PluginNotInstalledError(
        `El plugin "${pluginId}" no esta instalado en la organizacion "${orgId}"`
      );
    }

    const installedPlugin = toInstalledPlugin(snapshot);
    if (!installedPlugin.enabled) {
      return;
    }

    const blockingDependents = await PluginLifecycleService.getBlockingDependents(orgId, pluginId);
    if (blockingDependents.length > 0) {
      throw new PluginCompatibilityError(
        blockingDependents.map(
          dependentPluginId => `El plugin "${dependentPluginId}" requiere "${pluginId}"`
        )
      );
    }

    await updateDoc(PluginLifecycleService.pluginDocument(orgId, pluginId), {
      enabled: false,
      disabledAt: Timestamp.now(),
    });

    CapabilityService.invalidateCache(orgId);
  }

  static async uninstallPlugin(
    orgId: string,
    pluginId: string,
    hardRemove = false
  ): Promise<void> {
    const snapshot = await getDoc(PluginLifecycleService.pluginDocument(orgId, pluginId));

    if (!snapshot.exists()) {
      throw new PluginNotInstalledError(
        `El plugin "${pluginId}" no esta instalado en la organizacion "${orgId}"`
      );
    }

    const manifest = AGRO_PLUGIN_BY_ID[pluginId];
    if (!manifest) {
      throw new PluginManifestNotFoundError(
        `No se encontro el manifest registrado para el plugin "${pluginId}"`
      );
    }

    const blockingDependents = await PluginLifecycleService.getBlockingDependents(orgId, pluginId);
    if (blockingDependents.length > 0) {
      throw new PluginCompatibilityError(
        blockingDependents.map(
          dependentPluginId => `El plugin "${dependentPluginId}" requiere "${pluginId}"`
        )
      );
    }

    if (
      hardRemove &&
      manifest.uninstall_strategy.mode !== 'hard_remove'
    ) {
      throw new PluginUninstallPolicyError(
        `El plugin "${pluginId}" no permite hard remove segun su politica de desinstalacion`
      );
    }

    if (hardRemove) {
      await deleteDoc(PluginLifecycleService.pluginDocument(orgId, pluginId));
    } else {
      await updateDoc(PluginLifecycleService.pluginDocument(orgId, pluginId), {
        enabled: false,
        disabledAt: Timestamp.now(),
        uninstalledAt: Timestamp.now(),
      });
    }

    CapabilityService.invalidateCache(orgId);
  }

  static async getInstalledPlugins(orgId: string): Promise<InstalledPlugin[]> {
    const snapshot = await getDocs(PluginLifecycleService.pluginsCollection(orgId));
    return snapshot.docs.map(toInstalledPlugin);
  }

  static async isPluginEnabled(orgId: string, pluginId: string): Promise<boolean> {
    const snapshot = await getDoc(PluginLifecycleService.pluginDocument(orgId, pluginId));

    if (!snapshot.exists()) {
      return false;
    }

    const plugin = toInstalledPlugin(snapshot);
    return plugin.enabled;
  }

  static async validateCompatibility(
    orgId: string,
    manifest: AgroPluginManifest
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const installed = (await PluginLifecycleService.getInstalledPlugins(orgId)).filter(
      plugin => plugin.enabled
    );

    if (manifest.versioning.runtime_api_version !== AGRO_PLUGIN_API_VERSION) {
      errors.push(
        `Runtime API incompatible: requerido ${AGRO_PLUGIN_API_VERSION}, recibido ${manifest.versioning.runtime_api_version}`
      );
    }

    const enabledPluginIds = new Set(installed.map(plugin => plugin.pluginId));
    const enabledSlugs = new Set(installed.map(plugin => plugin.slug));

    for (const requiredCapability of manifest.compatibility.required_capabilities) {
      if (
        !enabledPluginIds.has(requiredCapability) &&
        !enabledSlugs.has(requiredCapability)
      ) {
        errors.push(`Requiere capability/plugin habilitado: ${requiredCapability}`);
      }
    }

    for (const incompatiblePlugin of manifest.compatibility.incompatible_plugins) {
      if (
        enabledPluginIds.has(incompatiblePlugin) ||
        enabledSlugs.has(incompatiblePlugin)
      ) {
        errors.push(`Incompatible con el plugin habilitado: ${incompatiblePlugin}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private static async getBlockingDependents(
    orgId: string,
    pluginId: string
  ): Promise<string[]> {
    const installedPlugins = await PluginLifecycleService.getInstalledPlugins(orgId);

    return installedPlugins
      .filter(plugin => plugin.enabled && plugin.pluginId !== pluginId)
      .map(plugin => AGRO_PLUGIN_BY_ID[plugin.pluginId])
      .filter((manifest): manifest is AgroPluginManifest => manifest !== undefined)
      .filter(manifest => manifest.compatibility.required_capabilities.includes(pluginId))
      .map(manifest => manifest.identity.plugin_id);
  }
}
