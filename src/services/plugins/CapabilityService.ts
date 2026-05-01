import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface CacheEntry {
  slugs: string[];
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const cache = new Map<string, CacheEntry>();

export class CapabilityService {
  static async getEnabledPlugins(orgId: string): Promise<string[]> {
    const now = Date.now();
    const entry = cache.get(orgId);
    if (entry && entry.expiresAt > now) return entry.slugs;

    const colRef = collection(db, `organizations/${orgId}/installed_plugins`);
    const q = query(colRef, where('enabled', '==', true));
    const snapshot = await getDocs(q);

    const slugs = snapshot.docs.map(d => d.data().slug as string).filter(Boolean);
    cache.set(orgId, { slugs, expiresAt: now + CACHE_TTL_MS });
    return slugs;
  }

  static async hasCapability(orgId: string, pluginSlug: string): Promise<boolean> {
    const slugs = await CapabilityService.getEnabledPlugins(orgId);
    return slugs.includes(pluginSlug);
  }

  static invalidateCache(orgId: string): void {
    cache.delete(orgId);
  }

  static async getEnabledRoutes(orgId: string): Promise<string[]> {
    const { AGRO_PLUGIN_BY_SLUG } = await import('@/config/plugins');
    const slugs = await CapabilityService.getEnabledPlugins(orgId);
    return slugs.flatMap(slug => {
      const manifest = AGRO_PLUGIN_BY_SLUG[slug];
      if (!manifest) return [];
      return manifest.routes.navigation.map(r => r.path);
    });
  }
}
