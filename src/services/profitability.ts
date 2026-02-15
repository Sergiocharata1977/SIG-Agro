import { obtenerCrops } from '@/services/crops';
import { obtenerPlots } from '@/services/plots';
import type { Crop, Plot } from '@/types/sig-agro';

export interface RentabilidadKpis {
  totalRevenueARS: number;
  totalCostsARS: number;
  grossMarginARS: number;
  totalAreaHa: number;
  costPerHaARS: number;
  marginPerHaARS: number;
  roiPercent: number;
}

export interface RentabilidadResumen {
  campaignId: string;
  kpis: RentabilidadKpis;
  byCrop: Array<{
    cultivo: string;
    revenueARS: number;
    costsARS: number;
    marginARS: number;
    areaHa: number;
    roiPercent: number;
  }>;
}

function buildAreaIndex(plots: Plot[]): Record<string, number> {
  const index: Record<string, number> = {};
  for (const plot of plots) {
    index[plot.id] = plot.superficie || 0;
  }
  return index;
}

function aggregate(crops: Crop[], areaIndex: Record<string, number>): RentabilidadResumen['kpis'] {
  let totalRevenueARS = 0;
  let totalCostsARS = 0;
  let totalAreaHa = 0;

  for (const crop of crops) {
    const revenue = crop.ingresoTotal || 0;
    const costs = crop.costoTotal || 0;

    totalRevenueARS += revenue;
    totalCostsARS += costs;
    totalAreaHa += areaIndex[crop.plotId] || 0;
  }

  const grossMarginARS = totalRevenueARS - totalCostsARS;
  const costPerHaARS = totalAreaHa > 0 ? totalCostsARS / totalAreaHa : 0;
  const marginPerHaARS = totalAreaHa > 0 ? grossMarginARS / totalAreaHa : 0;
  const roiPercent = totalCostsARS > 0 ? (grossMarginARS / totalCostsARS) * 100 : 0;

  return {
    totalRevenueARS: Number(totalRevenueARS.toFixed(2)),
    totalCostsARS: Number(totalCostsARS.toFixed(2)),
    grossMarginARS: Number(grossMarginARS.toFixed(2)),
    totalAreaHa: Number(totalAreaHa.toFixed(2)),
    costPerHaARS: Number(costPerHaARS.toFixed(2)),
    marginPerHaARS: Number(marginPerHaARS.toFixed(2)),
    roiPercent: Number(roiPercent.toFixed(2)),
  };
}

function byCrop(crops: Crop[], areaIndex: Record<string, number>): RentabilidadResumen['byCrop'] {
  const grouped: Record<string, { revenueARS: number; costsARS: number; areaHa: number }> = {};

  for (const crop of crops) {
    if (!grouped[crop.cultivo]) {
      grouped[crop.cultivo] = { revenueARS: 0, costsARS: 0, areaHa: 0 };
    }

    grouped[crop.cultivo].revenueARS += crop.ingresoTotal || 0;
    grouped[crop.cultivo].costsARS += crop.costoTotal || 0;
    grouped[crop.cultivo].areaHa += areaIndex[crop.plotId] || 0;
  }

  return Object.entries(grouped).map(([cultivo, values]) => {
    const marginARS = values.revenueARS - values.costsARS;
    const roiPercent = values.costsARS > 0 ? (marginARS / values.costsARS) * 100 : 0;

    return {
      cultivo,
      revenueARS: Number(values.revenueARS.toFixed(2)),
      costsARS: Number(values.costsARS.toFixed(2)),
      marginARS: Number(marginARS.toFixed(2)),
      areaHa: Number(values.areaHa.toFixed(2)),
      roiPercent: Number(roiPercent.toFixed(2)),
    };
  }).sort((a, b) => b.marginARS - a.marginARS);
}

export async function obtenerResumenRentabilidad(
  orgId: string,
  campaignId: string
): Promise<RentabilidadResumen> {
  const [crops, plots] = await Promise.all([
    obtenerCrops(orgId, { campania: campaignId }),
    obtenerPlots(orgId, { activo: true }),
  ]);

  const areaIndex = buildAreaIndex(plots);

  return {
    campaignId,
    kpis: aggregate(crops, areaIndex),
    byCrop: byCrop(crops, areaIndex),
  };
}

export async function obtenerComparativaInteranual(
  orgId: string,
  currentCampaignId: string,
  previousCampaignId: string
): Promise<{
  current: RentabilidadResumen;
  previous: RentabilidadResumen;
  deltaMarginPercent: number;
  deltaRoiPercent: number;
}> {
  const [current, previous] = await Promise.all([
    obtenerResumenRentabilidad(orgId, currentCampaignId),
    obtenerResumenRentabilidad(orgId, previousCampaignId),
  ]);

  const deltaMarginPercent = previous.kpis.grossMarginARS !== 0
    ? ((current.kpis.grossMarginARS - previous.kpis.grossMarginARS) / Math.abs(previous.kpis.grossMarginARS)) * 100
    : 0;

  const deltaRoiPercent = current.kpis.roiPercent - previous.kpis.roiPercent;

  return {
    current,
    previous,
    deltaMarginPercent: Number(deltaMarginPercent.toFixed(2)),
    deltaRoiPercent: Number(deltaRoiPercent.toFixed(2)),
  };
}
