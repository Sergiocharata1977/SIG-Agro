'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerPluginsActivos } from '@/services/plugins';
import type { PluginId } from '@/types/plugins';

interface PluginsContextValue {
  pluginsActivos: PluginId[];
  isActive: (pluginId: PluginId) => boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

const PluginsContext = createContext<PluginsContextValue>({
  pluginsActivos: [],
  isActive: () => false,
  loading: true,
  refetch: async () => {},
});

export function PluginsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pluginsActivos, setPluginsActivos] = useState<PluginId[]>([]);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    if (!user?.organizationId) {
      setPluginsActivos([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const activos = await obtenerPluginsActivos(user.organizationId);
      setPluginsActivos(activos);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, [user?.organizationId]);

  return (
    <PluginsContext.Provider
      value={{
        pluginsActivos,
        isActive: (pluginId) => pluginsActivos.includes(pluginId),
        loading,
        refetch: cargar,
      }}
    >
      {children}
    </PluginsContext.Provider>
  );
}

export function usePlugins() {
  return useContext(PluginsContext);
}
