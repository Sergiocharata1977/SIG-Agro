import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { AGRO_PLUGIN_BY_SLUG } from '@/config/plugins';

interface CacheEntry {
  slugs: string[];
  routes: string[];
  expiresAt: number;
}

interface InstalledPluginCapabilitiesDocument {
  slug?: unknown;
  enabled?: unknown;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

export class CapabilityServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CapabilityServiceError';
  }
}

export class CapabilityService {
  private static cache = new Map<string, CacheEntry>();

  private static pluginsCollection(orgId: string) {
    return collection(db, 'organizations', orgId, 'installed_plugins');
  }

  static async getEnabledPlugins(orgId: string): Promise<string[]> {
    const cacheEntry = await CapabilityService.getCacheEntry(orgId);
    return [...cacheEntry.slugs];
  }

  static async hasCapability(orgId: string, pluginSlug: string): Promise<boolean> {
    const slugs = await CapabilityService.getEnabledPlugins(orgId);
    return slugs.includes(pluginSlug);
  }

  static invalidateCache(orgId: string): void {
    CapabilityService.cache.delete(orgId);
  }

  static async getEnabledRoutes(orgId: string): Promise<string[]> {
    const cacheEntry = await CapabilityService.getCacheEntry(orgId);
    return [...cacheEntry.routes];
  }

  private static async getCacheEntry(orgId: string): Promise<CacheEntry> {
    const now = Date.now();
    const cached = CapabilityService.cache.get(orgId);

    if (cached && cached.expiresAt > now) {
      return cached;
    }

    const loaded = await CapabilityService.loadCacheEntry(orgId, now);
    CapabilityService.cache.set(orgId, loaded);
    return loaded;
  }

  private static async loadCacheEntry(orgId: string, now: number): Promise<CacheEntry> {
    try {
      const snapshot = await getDocs(
        query(CapabilityService.pluginsCollection(orgId), where('enabled', '==', true))
      );

      const slugs = Array.from(
        new Set(
          snapshot.docs
            .map(docSnapshot =>
              CapabilityService.readSlug(
                docSnapshot.data() as InstalledPluginCapabilitiesDocument
              )
            )
            .filter((slug): slug is string => slug !== null)
        )
      );

      const routes = Array.from(
        new Set(
          slugs.flatMap(slug => {
            const manifest = AGRO_PLUGIN_BY_SLUG[slug];
            if (!manifest) {
              return [];
            }

            return [
              ...manifest.routes.navigation.map(route => route.path),
              ...manifest.routes.pages.map(route => route.path),
            ];
          })
        )
      );

      return {
        slugs,
        routes,
        expiresAt: now + CACHE_TTL_MS,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'ocurrio un error desconocido';
      throw new CapabilityServiceError(
        `No se pudieron cargar las capacidades habilitadas para "${orgId}": ${message}`
      );
    }
  }

  private static readSlug(data: InstalledPluginCapabilitiesDocument): string | null {
    if (data.enabled !== true) {
      return null;
    }

    return typeof data.slug === 'string' && data.slug.length > 0 ? data.slug : null;
  }
}
