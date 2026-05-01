import type { AgroPluginManifest } from '@/lib/plugins/manifestSchema';
import { CAMPOS_MANIFEST } from './campos.manifest';
import { CAMPANIAS_MANIFEST } from './campanias.manifest';
import { CONTABILIDAD_AGRO_MANIFEST } from './contabilidad_agro.manifest';
import { ANALISIS_IA_MANIFEST } from './analisis_ia.manifest';
import { MAPA_GIS_MANIFEST } from './mapa_gis.manifest';
import { DOCUMENTOS_MANIFEST } from './documentos.manifest';
import { METRICAS_MANIFEST } from './metricas.manifest';
import { SCOUTING_MANIFEST } from './scouting.manifest';

export const AGRO_PLUGINS: AgroPluginManifest[] = [
  CAMPOS_MANIFEST,
  CAMPANIAS_MANIFEST,
  CONTABILIDAD_AGRO_MANIFEST,
  ANALISIS_IA_MANIFEST,
  MAPA_GIS_MANIFEST,
  DOCUMENTOS_MANIFEST,
  METRICAS_MANIFEST,
  SCOUTING_MANIFEST,
];

export const AGRO_PLUGIN_BY_ID: Record<string, AgroPluginManifest> = Object.fromEntries(
  AGRO_PLUGINS.map(p => [p.identity.plugin_id, p])
);

export const AGRO_PLUGIN_BY_SLUG: Record<string, AgroPluginManifest> = Object.fromEntries(
  AGRO_PLUGINS.map(p => [p.identity.slug, p])
);

export const BASE_PLUGINS = AGRO_PLUGINS.filter(p => p.identity.tier === 'base');
export const OPTIONAL_PLUGINS = AGRO_PLUGINS.filter(p => p.identity.tier === 'optional');
export const PREMIUM_PLUGINS = AGRO_PLUGINS.filter(p => p.identity.tier === 'premium');
