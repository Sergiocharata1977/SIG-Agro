import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';
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

export class PluginLifecycleService {
  private static pluginsPath(orgId: string) {
    return `organizations/${orgId}/installed_plugins`;
  }

  static async installPlugin(
    orgId: string,
    manifest: AgroPluginManifest,
    installedBy: string,
    initialSettings?: Record<string, unknown>
  ): Promise<void> {
    const { valid, errors } = await PluginLifecycleService.validateCompatibility(orgId, manifest);
    if (!valid) throw new Error(`Compatibilidad fallida: ${errors.join(', ')}`);

    const pluginId = manifest.identity.plugin_id;
    const docRef = doc(db, PluginLifecycleService.pluginsPath(orgId), pluginId);

    const data: InstalledPlugin = {
      pluginId,
      slug: manifest.identity.slug,
      installedAt: Timestamp.now(),
      installedBy,
      enabled: true,
      enabledAt: Timestamp.now(),
      settings: initialSettings ?? manifest.tenant_settings.defaults,
      version: manifest.versioning.plugin_version,
    };

    await setDoc(docRef, data);
    CapabilityService.invalidateCache(orgId);
  }

  static async enablePlugin(orgId: string, pluginId: string): Promise<void> {
    const docRef = doc(db, PluginLifecycleService.pluginsPath(orgId), pluginId);
    await updateDoc(docRef, { enabled: true, enabledAt: Timestamp.now() });
    CapabilityService.invalidateCache(orgId);
  }

  static async disablePlugin(orgId: string, pluginId: string): Promise<void> {
    const docRef = doc(db, PluginLifecycleService.pluginsPath(orgId), pluginId);
    await updateDoc(docRef, { enabled: false });
    CapabilityService.invalidateCache(orgId);
  }

  static async uninstallPlugin(
    orgId: string,
    pluginId: string,
    hardRemove = false
  ): Promise<void> {
    const docRef = doc(db, PluginLifecycleService.pluginsPath(orgId), pluginId);
    if (hardRemove) {
      await deleteDoc(docRef);
    } else {
      await updateDoc(docRef, { enabled: false, uninstalledAt: Timestamp.now() });
    }
    CapabilityService.invalidateCache(orgId);
  }

  static async getInstalledPlugins(orgId: string): Promise<InstalledPlugin[]> {
    const colRef = collection(db, PluginLifecycleService.pluginsPath(orgId));
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => d.data() as InstalledPlugin);
  }

  static async isPluginEnabled(orgId: string, pluginId: string): Promise<boolean> {
    const docRef = doc(db, PluginLifecycleService.pluginsPath(orgId), pluginId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return false;
    return (snap.data() as InstalledPlugin).enabled === true;
  }

  private static async validateCompatibility(
    orgId: string,
    manifest: AgroPluginManifest
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const enabled = await CapabilityService.getEnabledPlugins(orgId);

    for (const required of manifest.compatibility.required_capabilities) {
      if (!enabled.includes(required)) {
        errors.push(`Requiere plugin: ${required}`);
      }
    }
    for (const incompatible of manifest.compatibility.incompatible_plugins) {
      if (enabled.includes(incompatible)) {
        errors.push(`Incompatible con: ${incompatible}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
