import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { OrganizationPlugins, PluginId } from '@/types/plugins';

const getPluginsDocRef = (orgId: string) =>
  doc(db, 'organizations', orgId, 'settings', 'plugins');

interface OrganizationPluginsDocument {
  organizationId?: unknown;
  pluginsActivos?: unknown;
  updatedAt?: unknown;
  updatedBy?: unknown;
}

function normalizarPluginsActivos(value: unknown): PluginId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(value.filter((pluginId): pluginId is PluginId => typeof pluginId === 'string'))
  );
}

function normalizarOrganizationPlugins(
  orgId: string,
  data: OrganizationPluginsDocument | undefined
): OrganizationPlugins {
  const updatedAt = data?.updatedAt instanceof Timestamp
    ? data.updatedAt.toDate()
    : new Date();

  return {
    organizationId:
      typeof data?.organizationId === 'string' && data.organizationId.length > 0
        ? data.organizationId
        : orgId,
    pluginsActivos: normalizarPluginsActivos(data?.pluginsActivos),
    updatedAt,
    updatedBy: typeof data?.updatedBy === 'string' ? data.updatedBy : '',
  };
}

export async function obtenerPluginsActivos(orgId: string): Promise<PluginId[]> {
  const snapshot = await getDoc(getPluginsDocRef(orgId));

  if (!snapshot.exists()) {
    return [];
  }

  const organizationPlugins = normalizarOrganizationPlugins(
    orgId,
    snapshot.data() as OrganizationPluginsDocument
  );

  return organizationPlugins.pluginsActivos;
}

export async function activarPlugin(
  orgId: string,
  pluginId: PluginId,
  userId: string
): Promise<void> {
  const pluginsActivos = await obtenerPluginsActivos(orgId);

  if (pluginsActivos.includes(pluginId)) {
    return;
  }

  await setPluginsActivos(orgId, [...pluginsActivos, pluginId], userId);
}

export async function desactivarPlugin(
  orgId: string,
  pluginId: PluginId,
  userId: string
): Promise<void> {
  const pluginsActivos = await obtenerPluginsActivos(orgId);
  const nextPlugins = pluginsActivos.filter((activePluginId) => activePluginId !== pluginId);

  if (nextPlugins.length === pluginsActivos.length) {
    return;
  }

  await setPluginsActivos(orgId, nextPlugins, userId);
}

export async function setPluginsActivos(
  orgId: string,
  plugins: PluginId[],
  userId: string
): Promise<void> {
  await setDoc(
    getPluginsDocRef(orgId),
    {
      organizationId: orgId,
      pluginsActivos: normalizarPluginsActivos(plugins),
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    },
    { merge: true }
  );
}

export function tienePlugin(pluginsActivos: PluginId[], pluginId: PluginId): boolean {
  return pluginsActivos.includes(pluginId);
}
