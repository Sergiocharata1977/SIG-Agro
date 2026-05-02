import {
  collection,
  getDocs,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { obtenerCrops } from '@/services/crops';
import { obtenerPlots } from '@/services/plots';
import type { AsientoAutomatico, TipoOperacion } from '@/types/contabilidad-simple';
import type { Crop, Plot } from '@/types/sig-agro';

export interface ConceptoResultado {
  categoria: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  cantidadOperaciones: number;
}

export interface ResultadoLote {
  loteId: string;
  loteNombre: string;
  hectareas?: number;
  totalIngresos: number;
  totalGastos: number;
  margenBruto: number;
  costoPorHa?: number;
  margenPorHa?: number;
  desglose: ConceptoResultado[];
}

export interface ResultadoCampana {
  campaniaId: string;
  campaniaNombre: string;
  totalIngresos: number;
  totalGastos: number;
  margenBruto: number;
  desglose: ConceptoResultado[];
  porLote: ResultadoLote[];
  hectareas?: number;
  costoPorHectarea?: number;
  margenPorHectarea?: number;
}

interface CategoriaOperacion {
  categoria: string;
  tipo: 'ingreso' | 'gasto' | 'neutro';
}

interface MetadataCampania {
  nombre: string;
  hectareas?: number;
}

const CATEGORIAS_POR_OPERACION: Record<string, CategoriaOperacion> = {
  compra_insumo: { categoria: 'Insumos', tipo: 'gasto' },
  aplicacion_insumo: { categoria: 'Insumos aplicados', tipo: 'gasto' },
  cosecha: { categoria: 'Cosecha', tipo: 'neutro' },
  venta: { categoria: 'Ventas granos', tipo: 'ingreso' },
  entrega_acopiador: { categoria: 'Ventas granos', tipo: 'ingreso' },
  cobro: { categoria: 'Cobranzas', tipo: 'ingreso' },
  pago: { categoria: 'Pagos', tipo: 'gasto' },
  gasto_general: { categoria: 'Gastos generales', tipo: 'gasto' },
};

const CATEGORIA_OTROS: CategoriaOperacion = {
  categoria: 'Otros',
  tipo: 'gasto',
};

function getAsientosCollection(orgId: string) {
  return collection(db, 'organizations', orgId, 'asientos_auto');
}

function toNumber(value: number): number {
  return Number(value.toFixed(2));
}

function parseCampaniaLabel(campaniaId: string): number {
  const match = campaniaId.match(/(\d{4})/);
  return match ? Number(match[1]) : 0;
}

function normalizarAsiento(raw: Record<string, unknown>, id: string): AsientoAutomatico {
  return {
    ...(raw as Omit<AsientoAutomatico, 'id' | 'fecha' | 'createdAt'>),
    id,
    fecha: raw.fecha instanceof Date ? raw.fecha : (
      (raw.fecha as { toDate?: () => Date } | undefined)?.toDate?.() || new Date()
    ),
    createdAt: raw.createdAt instanceof Date ? raw.createdAt : (
      (raw.createdAt as { toDate?: () => Date } | undefined)?.toDate?.() || new Date()
    ),
  };
}

async function obtenerAsientosAutomaticos(
  orgId: string,
  filtros?: { campaniaId?: string; loteId?: string }
): Promise<AsientoAutomatico[]> {
  const constraints: QueryConstraint[] = [];

  if (filtros?.campaniaId) {
    constraints.push(where('campaniaId', '==', filtros.campaniaId));
  }

  if (filtros?.loteId) {
    constraints.push(where('loteId', '==', filtros.loteId));
  }

  const snapshot = constraints.length > 0
    ? await getDocs(query(getAsientosCollection(orgId), ...constraints))
    : await getDocs(getAsientosCollection(orgId));

  return snapshot.docs.map((doc) => normalizarAsiento(doc.data(), doc.id));
}

function obtenerCategoria(tipoOperacion: TipoOperacion): CategoriaOperacion {
  return CATEGORIAS_POR_OPERACION[tipoOperacion] || CATEGORIA_OTROS;
}

function obtenerMontoResultado(asiento: AsientoAutomatico): number {
  if (asiento.tipoOperacion === 'cosecha') {
    return 0;
  }

  if (asiento.tipoOperacion === 'entrega_acopiador') {
    const tieneLineaDeVenta = asiento.lineas.some(
      (linea) => linea.cuentaId === '4.1.1' || linea.cuentaNombre === 'Ventas de granos'
    );

    return tieneLineaDeVenta ? toNumber(Math.max(asiento.totalDebe, asiento.totalHaber)) : 0;
  }

  return toNumber(Math.max(asiento.totalDebe, asiento.totalHaber));
}

function calcularDesglose(asientos: AsientoAutomatico[]): {
  desglose: ConceptoResultado[];
  totalIngresos: number;
  totalGastos: number;
} {
  const acumulado = new Map<string, ConceptoResultado>();
  let totalIngresos = 0;
  let totalGastos = 0;

  for (const asiento of asientos) {
    const { categoria, tipo } = obtenerCategoria(asiento.tipoOperacion);
    const monto = obtenerMontoResultado(asiento);

    if (tipo === 'ingreso') {
      totalIngresos += monto;
    } else if (tipo === 'gasto') {
      totalGastos += monto;
    }

    if (tipo === 'neutro') {
      continue;
    }

    const current = acumulado.get(categoria);

    if (current) {
      current.monto = toNumber(current.monto + monto);
      current.cantidadOperaciones += 1;
      continue;
    }

    acumulado.set(categoria, {
      categoria,
      tipo,
      monto,
      cantidadOperaciones: 1,
    });
  }

  const desglose = Array.from(acumulado.values()).sort((a, b) => {
    if (a.tipo !== b.tipo) {
      return a.tipo === 'ingreso' ? -1 : 1;
    }

    return b.monto - a.monto;
  });

  return {
    desglose,
    totalIngresos: toNumber(totalIngresos),
    totalGastos: toNumber(totalGastos),
  };
}

function crearIndiceLotes(plots: Plot[]): Map<string, Plot> {
  return new Map(plots.map((plot) => [plot.id, plot]));
}

function resolverHectareasCampania(campaniaId: string, plotsIndex: Map<string, Plot>, crops: Crop[]): number | undefined {
  const plotIds = new Set(crops.filter((crop) => crop.campania === campaniaId).map((crop) => crop.plotId));

  if (plotIds.size === 0) {
    return undefined;
  }

  let hectareas = 0;

  for (const plotId of plotIds) {
    hectareas += plotsIndex.get(plotId)?.superficie || 0;
  }

  return hectareas > 0 ? toNumber(hectareas) : undefined;
}

function resolverMetadataCampania(
  campaniaId: string,
  crops: Crop[],
  plotsIndex: Map<string, Plot>
): MetadataCampania {
  const cropsCampania = crops.filter((crop) => crop.campania === campaniaId);
  const nombre = cropsCampania.find((crop) => crop.nombreCampania?.trim())?.nombreCampania?.trim() || campaniaId;
  const hectareas = resolverHectareasCampania(campaniaId, plotsIndex, cropsCampania);

  return { nombre, hectareas };
}

function construirResultadoLote(
  loteId: string,
  asientos: AsientoAutomatico[],
  plotsIndex: Map<string, Plot>
): ResultadoLote {
  const plot = plotsIndex.get(loteId);
  const hectareas = plot?.superficie && plot.superficie > 0 ? toNumber(plot.superficie) : undefined;
  const { desglose, totalIngresos, totalGastos } = calcularDesglose(asientos);
  const margenBruto = toNumber(totalIngresos - totalGastos);

  return {
    loteId,
    loteNombre: plot?.nombre || (loteId === 'sin-lote' ? 'Sin lote asignado' : loteId),
    hectareas,
    totalIngresos,
    totalGastos,
    margenBruto,
    costoPorHa: hectareas ? toNumber(totalGastos / hectareas) : undefined,
    margenPorHa: hectareas ? toNumber(margenBruto / hectareas) : undefined,
    desglose,
  };
}

function agruparPorLote(asientos: AsientoAutomatico[], plotsIndex: Map<string, Plot>): ResultadoLote[] {
  const grouped = new Map<string, AsientoAutomatico[]>();

  for (const asiento of asientos) {
    const loteId = asiento.loteId || 'sin-lote';
    const current = grouped.get(loteId) || [];
    current.push(asiento);
    grouped.set(loteId, current);
  }

  return Array.from(grouped.entries())
    .map(([loteId, items]) => construirResultadoLote(loteId, items, plotsIndex))
    .sort((a, b) => b.margenBruto - a.margenBruto);
}

export async function obtenerResultadoCampana(orgId: string, campaniaId: string): Promise<ResultadoCampana> {
  const [asientos, plots, crops] = await Promise.all([
    obtenerAsientosAutomaticos(orgId, { campaniaId }),
    obtenerPlots(orgId),
    obtenerCrops(orgId, { campania: campaniaId }),
  ]);

  const plotsIndex = crearIndiceLotes(plots);
  const { desglose, totalIngresos, totalGastos } = calcularDesglose(asientos);
  const metadata = resolverMetadataCampania(campaniaId, crops, plotsIndex);
  const margenBruto = toNumber(totalIngresos - totalGastos);
  const porLote = agruparPorLote(asientos, plotsIndex);

  return {
    campaniaId,
    campaniaNombre: metadata.nombre,
    totalIngresos,
    totalGastos,
    margenBruto,
    desglose,
    porLote,
    hectareas: metadata.hectareas,
    costoPorHectarea: metadata.hectareas ? toNumber(totalGastos / metadata.hectareas) : undefined,
    margenPorHectarea: metadata.hectareas ? toNumber(margenBruto / metadata.hectareas) : undefined,
  };
}

export async function obtenerResultadoLote(
  orgId: string,
  loteId: string,
  campaniaId?: string
): Promise<ResultadoLote> {
  const [asientos, plots] = await Promise.all([
    obtenerAsientosAutomaticos(orgId, { loteId }),
    obtenerPlots(orgId),
  ]);

  const filtrados = campaniaId
    ? asientos.filter((asiento) => asiento.campaniaId === campaniaId)
    : asientos;

  return construirResultadoLote(loteId, filtrados, crearIndiceLotes(plots));
}

export async function obtenerResumenCampanas(
  orgId: string
): Promise<Array<{ campaniaId: string; campaniaNombre: string; margenBruto: number; hectareas?: number }>> {
  const [asientos, plots, crops] = await Promise.all([
    obtenerAsientosAutomaticos(orgId),
    obtenerPlots(orgId),
    obtenerCrops(orgId),
  ]);

  const plotsIndex = crearIndiceLotes(plots);
  const campanias = new Set<string>();

  for (const asiento of asientos) {
    if (asiento.campaniaId) {
      campanias.add(asiento.campaniaId);
    }
  }

  for (const crop of crops) {
    if (crop.campania) {
      campanias.add(crop.campania);
    }
  }

  return Array.from(campanias)
    .map((campaniaId) => {
      const metadata = resolverMetadataCampania(campaniaId, crops, plotsIndex);
      const asientosCampania = asientos.filter((asiento) => asiento.campaniaId === campaniaId);
      const { totalIngresos, totalGastos } = calcularDesglose(asientosCampania);

      return {
        campaniaId,
        campaniaNombre: metadata.nombre,
        margenBruto: toNumber(totalIngresos - totalGastos),
        hectareas: metadata.hectareas,
      };
    })
    .sort((a, b) => parseCampaniaLabel(b.campaniaId) - parseCampaniaLabel(a.campaniaId));
}
