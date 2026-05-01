'use client';

import type { ReactNode } from 'react';
import { useEffectiveAccess } from '@/hooks/useEffectiveAccess';

interface PluginGuardProps {
  pluginSlug: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PluginGuard({ pluginSlug, fallback, children }: PluginGuardProps) {
  const { hasPlugin, isLoading } = useEffectiveAccess();

  if (isLoading) {
    return (
      <div className="space-y-3 p-6" data-testid="plugin-loading">
        <div className="h-4 w-2/3 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!hasPlugin(pluginSlug)) {
    return fallback ?? (
      <div
        className="rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-8 text-amber-950 shadow-sm"
        data-testid="plugin-not-enabled"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
          Plugin no habilitado
        </p>
        <h2 className="mt-3 text-2xl font-semibold">
          Esta funcionalidad todavia no esta activa para tu organizacion.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-900/80">
          Pedi la habilitacion desde configuracion de plugins o contacta a un
          administrador con permisos sobre la organizacion activa.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
