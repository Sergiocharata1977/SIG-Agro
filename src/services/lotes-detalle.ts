import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { LoteDetalle, LoteGeometryVersion } from '@/types/domain-model';

const COLLECTION = 'lotes_detalle';

interface GeometryValidationResult {
  valid: boolean;
  errors: string[];
  areaHa: number;
}

interface PolygonGeoJSON {
  type: 'Polygon';
  coordinates: number[][][];
}

function parsePolygon(geoJson: string): PolygonGeoJSON | null {
  try {
    const parsed = JSON.parse(geoJson) as PolygonGeoJSON;
    if (parsed?.type !== 'Polygon' || !Array.isArray(parsed.coordinates)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function shoelaceArea(coords: number[][]): number {
  let area = 0;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

function degrees2ToHa(areaDeg2: number, latitude = -27): number {
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((latitude * Math.PI) / 180);
  const m2 = areaDeg2 * metersPerDegLat * metersPerDegLng;
  return m2 / 10000;
}

export function validarGeometriaLote(geometryGeoJSON: string): GeometryValidationResult {
  const errors: string[] = [];
  const polygon = parsePolygon(geometryGeoJSON);

  if (!polygon) {
    return { valid: false, errors: ['GeoJSON invalido o no es Polygon'], areaHa: 0 };
  }

  const ring = polygon.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4) {
    errors.push('El poligono debe tener al menos 4 vertices');
  }

  const first = ring?.[0];
  const last = ring?.[ring.length - 1];
  if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) {
    errors.push('El poligono debe estar cerrado (primer y ultimo vertice iguales)');
  }

  for (const point of ring || []) {
    const [lng, lat] = point;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      errors.push('Coordenadas fuera de rango valido');
      break;
    }
  }

  let areaHa = 0;
  if (errors.length === 0) {
    const areaDeg2 = shoelaceArea(ring);
    areaHa = Number(degrees2ToHa(areaDeg2, ring[0][1]).toFixed(4));
    if (areaHa <= 0) {
      errors.push('El area geometrica debe ser mayor a cero');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    areaHa,
  };
}

export async function crearLoteDetalle(
  orgId: string,
  payload: Omit<LoteDetalle, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'geometryHistory'>
): Promise<string> {
  const validation = validarGeometriaLote(payload.currentGeometryGeoJSON);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' | '));
  }

  const now = new Date();
  const history: LoteGeometryVersion[] = [
    {
      version: 1,
      geometryGeoJSON: payload.currentGeometryGeoJSON,
      changedAt: now,
      changedBy: payload.createdBy,
      reason: 'Version inicial',
    },
  ];

  const docRef = await addDoc(collection(db, `organizations/${orgId}/${COLLECTION}`), {
    ...payload,
    areaHa: validation.areaHa,
    geometryHistory: history,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function obtenerLotesDetalle(
  orgId: string,
  filters?: { fieldId?: string; plotId?: string }
): Promise<LoteDetalle[]> {
  const col = collection(db, `organizations/${orgId}/${COLLECTION}`);
  const constraints = [];
  if (filters?.fieldId) constraints.push(where('fieldId', '==', filters.fieldId));
  if (filters?.plotId) constraints.push(where('plotId', '==', filters.plotId));

  const q = constraints.length ? query(col, ...constraints) : query(col);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...(data as Omit<LoteDetalle, 'id' | 'createdAt' | 'updatedAt'>),
      createdAt: (data.createdAt as Timestamp | undefined)?.toDate?.() || (data.createdAt as Date),
      updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate?.() || (data.updatedAt as Date),
      geometryHistory: (data.geometryHistory || []).map((g: LoteGeometryVersion) => ({
        ...g,
        changedAt: (g.changedAt as unknown as Timestamp)?.toDate?.() || (g.changedAt as Date),
      })),
    } as LoteDetalle;
  });
}

export async function versionarGeometriaLote(
  orgId: string,
  loteDetalleId: string,
  geometryGeoJSON: string,
  changedBy: string,
  reason?: string
): Promise<void> {
  const validation = validarGeometriaLote(geometryGeoJSON);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' | '));
  }

  const ref = doc(db, `organizations/${orgId}/${COLLECTION}/${loteDetalleId}`);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('Lote no encontrado');

  const data = snapshot.data();
  const history = ((data.geometryHistory || []) as LoteGeometryVersion[]).map((g) => ({
    ...g,
    changedAt: (g.changedAt as unknown as Timestamp)?.toDate?.() || (g.changedAt as Date),
  }));

  const nextVersion = (history[history.length - 1]?.version || 0) + 1;
  history.push({
    version: nextVersion,
    geometryGeoJSON,
    changedAt: new Date(),
    changedBy,
    reason,
  });

  await updateDoc(ref, {
    currentGeometryGeoJSON: geometryGeoJSON,
    areaHa: validation.areaHa,
    geometryHistory: history,
    updatedAt: new Date(),
    updatedBy: changedBy,
  });
}

export function compararVersionesLote(
  lote: LoteDetalle,
  fromVersion: number,
  toVersion: number
): { areaFromHa: number; areaToHa: number; deltaHa: number; deltaPercent: number } {
  const from = lote.geometryHistory.find((h) => h.version === fromVersion);
  const to = lote.geometryHistory.find((h) => h.version === toVersion);
  if (!from || !to) {
    throw new Error('Versiones no encontradas en el historial del lote');
  }

  const areaFrom = validarGeometriaLote(from.geometryGeoJSON).areaHa;
  const areaTo = validarGeometriaLote(to.geometryGeoJSON).areaHa;
  const delta = areaTo - areaFrom;
  const deltaPercent = areaFrom > 0 ? (delta / areaFrom) * 100 : 0;

  return {
    areaFromHa: areaFrom,
    areaToHa: areaTo,
    deltaHa: Number(delta.toFixed(4)),
    deltaPercent: Number(deltaPercent.toFixed(2)),
  };
}

export async function eliminarLoteDetalle(orgId: string, loteDetalleId: string): Promise<void> {
  await deleteDoc(doc(db, `organizations/${orgId}/${COLLECTION}/${loteDetalleId}`));
}
