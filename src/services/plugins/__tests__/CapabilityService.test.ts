import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/firebase/config', () => ({
  db: {},
}));

vi.mock('@/config/plugins', () => ({
  AGRO_PLUGIN_BY_SLUG: {
    analisis_ia: {
      routes: {
        navigation: [{ path: '/ia', label: 'IA', requiredPermissions: [] }],
        pages: [{ path: '/ia/detalle', label: 'Detalle IA', requiredPermissions: [] }],
      },
    },
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'collection-ref'),
  getDocs: vi.fn(),
  query: vi.fn(() => 'query-ref'),
  where: vi.fn(() => 'where-ref'),
}));

describe('CapabilityService', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('getEnabledPlugins retorna array vacio si no hay plugins', async () => {
    const firestore = await import('firebase/firestore');
    const { CapabilityService } = await import('@/services/plugins/CapabilityService');
    const getDocsMock = vi.mocked(firestore.getDocs);

    getDocsMock.mockResolvedValue({ docs: [] } as never);
    CapabilityService.invalidateCache('org-empty');

    await expect(CapabilityService.getEnabledPlugins('org-empty')).resolves.toEqual([]);
    expect(getDocsMock).toHaveBeenCalledTimes(1);
  });

  it('hasCapability retorna false para plugin no instalado', async () => {
    const firestore = await import('firebase/firestore');
    const { CapabilityService } = await import('@/services/plugins/CapabilityService');
    const getDocsMock = vi.mocked(firestore.getDocs);

    getDocsMock.mockResolvedValue({ docs: [] } as never);
    CapabilityService.invalidateCache('org-missing');

    await expect(
      CapabilityService.hasCapability('org-missing', 'analisis_ia')
    ).resolves.toBe(false);
  });

  it('la cache se invalida correctamente con invalidateCache()', async () => {
    const firestore = await import('firebase/firestore');
    const { CapabilityService } = await import('@/services/plugins/CapabilityService');
    const getDocsMock = vi.mocked(firestore.getDocs);

    getDocsMock
      .mockResolvedValueOnce({
        docs: [
          {
            data: () => ({ slug: 'analisis_ia', enabled: true }),
          },
        ],
      } as never)
      .mockResolvedValueOnce({ docs: [] } as never);

    CapabilityService.invalidateCache('org-cache');

    await expect(CapabilityService.getEnabledPlugins('org-cache')).resolves.toEqual([
      'analisis_ia',
    ]);
    await expect(CapabilityService.getEnabledPlugins('org-cache')).resolves.toEqual([
      'analisis_ia',
    ]);
    expect(getDocsMock).toHaveBeenCalledTimes(1);

    CapabilityService.invalidateCache('org-cache');

    await expect(CapabilityService.getEnabledPlugins('org-cache')).resolves.toEqual([]);
    expect(getDocsMock).toHaveBeenCalledTimes(2);
  });
});
