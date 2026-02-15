/**
 * Modelo de datos v1 para dominios operativos de SIG Agro.
 * A1 - Arquitectura y Datos
 */

export type DomainDocStatus = 'active' | 'archived';

export interface DomainAuditable {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  status: DomainDocStatus;
}

export interface CostBreakdown {
  directCostsARS: number;
  indirectCostsARS: number;
  laborCostsARS: number;
  machineryCostsARS: number;
  logisticsCostsARS: number;
  notes?: string;
}

export interface FieldLogbookEntry extends DomainAuditable {
  id: string;
  organizationId: string;
  campaignId: string;
  fieldId: string;
  plotId?: string;
  loteDetalleId?: string;
  activityType:
    | 'siembra'
    | 'fertilizacion'
    | 'riego'
    | 'aplicacion'
    | 'scouting'
    | 'cosecha'
    | 'mantenimiento'
    | 'otro';
  startDate: Date;
  endDate?: Date;
  description: string;
  operatorIds: string[];
  machineryIds?: string[];
  evidenceUrls?: string[];
  cost: CostBreakdown;
  source: 'manual' | 'sensor' | 'integration' | 'dss';
}

export interface TreatmentApplication extends DomainAuditable {
  id: string;
  organizationId: string;
  campaignId: string;
  fieldId: string;
  plotId: string;
  loteDetalleId?: string;
  mode: 'manual' | 'bulk';
  issueType: 'plaga' | 'enfermedad' | 'maleza' | 'nutricion' | 'otro';
  productName: string;
  activeIngredient?: string;
  dosagePerHa: number;
  dosageUnit: 'l_ha' | 'kg_ha' | 'cc_ha' | 'g_ha';
  appliedAreaHa: number;
  applicationDate: Date;
  operatorIds: string[];
  recommendationId?: string;
  notes?: string;
}

export interface IrrigationPlan extends DomainAuditable {
  id: string;
  organizationId: string;
  campaignId: string;
  fieldId: string;
  plotId: string;
  loteDetalleId?: string;
  planDate: Date;
  targetMm: number;
  appliedMm?: number;
  executionStatus: 'planned' | 'running' | 'completed' | 'cancelled';
  method?: 'goteo' | 'aspersor' | 'pivot' | 'surco' | 'otro';
  deviationMm?: number;
}

export interface LoteGeometryVersion {
  version: number;
  geometryGeoJSON: string;
  changedAt: Date;
  changedBy: string;
  reason?: string;
}

export interface LoteDetalle extends DomainAuditable {
  id: string;
  organizationId: string;
  fieldId: string;
  plotId: string;
  name: string;
  code: string;
  areaHa: number;
  currentGeometryGeoJSON: string;
  geometryHistory: LoteGeometryVersion[];
}

export interface SensorReading extends DomainAuditable {
  id: string;
  organizationId: string;
  provider: string;
  sourceDeviceId: string;
  fieldId?: string;
  plotId?: string;
  loteDetalleId?: string;
  metric:
    | 'soil_moisture'
    | 'air_temperature'
    | 'soil_temperature'
    | 'rain_mm'
    | 'humidity'
    | 'wind_speed'
    | 'pressure'
    | 'ndvi_proxy'
    | 'other';
  value: number;
  unit: string;
  quality: 'good' | 'suspect' | 'invalid';
  measuredAt: Date;
  rawPayload?: string;
}

export interface ProfitabilitySnapshot extends DomainAuditable {
  id: string;
  organizationId: string;
  campaignId: string;
  fieldId?: string;
  plotId?: string;
  cropType?: string;
  period: {
    year: number;
    season?: string;
  };
  totalRevenueARS: number;
  totalCostsARS: number;
  grossMarginARS: number;
  grossMarginPerHaARS?: number;
  roiPercent?: number;
  notes?: string;
}

export interface DomainSchemaVersion {
  version: string;
  releasedAt: Date;
  notes: string;
}


