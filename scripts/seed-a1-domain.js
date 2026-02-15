#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Seed tecnico A1 para dominios operativos.
 * Crea 1 registro demo por coleccion de dominio en una organizacion objetivo.
 *
 * Uso:
 *   ORG_ID=<orgId> npm run seed:a1
 */

const fs = require('fs');
const path = require('path');
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const ORG_ID = process.env.ORG_ID || 'org-agro-don-juan';
const USER_ID = process.env.USER_ID || 'seed-a1';
const CAMPAIGN_ID = process.env.CAMPAIGN_ID || '2025-2026';
const FIELD_ID = process.env.FIELD_ID || 'field-demo';
const PLOT_ID = process.env.PLOT_ID || 'plot-demo';

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }

  const local = path.resolve(process.cwd(), 'service-account.json');
  if (fs.existsSync(local)) {
    return JSON.parse(fs.readFileSync(local, 'utf8'));
  }

  throw new Error('Falta FIREBASE_SERVICE_ACCOUNT_KEY o service-account.json local.');
}

async function run() {
  const serviceAccount = loadServiceAccount();

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();
  const now = FieldValue.serverTimestamp();

  const orgRef = db.collection('organizations').doc(ORG_ID);

  await orgRef.collection('field_logbooks').doc('logbook-demo').set(
    {
      organizationId: ORG_ID,
      campaignId: CAMPAIGN_ID,
      fieldId: FIELD_ID,
      plotId: PLOT_ID,
      activityType: 'siembra',
      startDate: new Date('2026-01-12T08:00:00Z'),
      description: 'Registro inicial A1',
      operatorIds: [USER_ID],
      source: 'manual',
      cost: {
        directCostsARS: 120000,
        indirectCostsARS: 25000,
        laborCostsARS: 18000,
        machineryCostsARS: 14000,
        logisticsCostsARS: 6000,
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: USER_ID,
    },
    { merge: true }
  );

  await orgRef.collection('treatments').doc('treatment-demo').set(
    {
      organizationId: ORG_ID,
      campaignId: CAMPAIGN_ID,
      fieldId: FIELD_ID,
      plotId: PLOT_ID,
      mode: 'manual',
      issueType: 'maleza',
      productName: 'Herbicida Demo',
      dosagePerHa: 2,
      dosageUnit: 'l_ha',
      appliedAreaHa: 50,
      applicationDate: new Date('2026-01-18T10:00:00Z'),
      operatorIds: [USER_ID],
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: USER_ID,
    },
    { merge: true }
  );

  await orgRef.collection('irrigation_plans').doc('irrigation-demo').set(
    {
      organizationId: ORG_ID,
      campaignId: CAMPAIGN_ID,
      fieldId: FIELD_ID,
      plotId: PLOT_ID,
      planDate: new Date('2026-01-20T00:00:00Z'),
      targetMm: 28,
      appliedMm: 26,
      executionStatus: 'completed',
      method: 'pivot',
      deviationMm: -2,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: USER_ID,
    },
    { merge: true }
  );

  await orgRef.collection('lotes_detalle').doc('lote-detalle-demo').set(
    {
      organizationId: ORG_ID,
      fieldId: FIELD_ID,
      plotId: PLOT_ID,
      name: 'lote Norte',
      code: 'SP-N-001',
      areaHa: 22.5,
      currentGeometryGeoJSON: '{"type":"Polygon","coordinates":[[[-58.9,-27.4],[-58.89,-27.4],[-58.89,-27.41],[-58.9,-27.41],[-58.9,-27.4]]]}',
      geometryHistory: [
        {
          version: 1,
          geometryGeoJSON: '{"type":"Polygon","coordinates":[[[-58.9,-27.4],[-58.89,-27.4],[-58.89,-27.41],[-58.9,-27.41],[-58.9,-27.4]]]}',
          changedAt: new Date('2026-01-10T00:00:00Z'),
          changedBy: USER_ID,
          reason: 'Version inicial',
        },
      ],
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: USER_ID,
    },
    { merge: true }
  );

  await orgRef.collection('sensor_readings').doc('sensor-demo').set(
    {
      organizationId: ORG_ID,
      provider: 'demo-provider',
      sourceDeviceId: 'station-01',
      fieldId: FIELD_ID,
      plotId: PLOT_ID,
      metric: 'soil_moisture',
      value: 31.2,
      unit: '%',
      quality: 'good',
      measuredAt: new Date('2026-01-20T09:30:00Z'),
      rawPayload: '{"sensor":"station-01","metric":"soil_moisture","value":31.2}',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: USER_ID,
    },
    { merge: true }
  );

  await orgRef.collection('profitability_snapshots').doc('profitability-demo').set(
    {
      organizationId: ORG_ID,
      campaignId: CAMPAIGN_ID,
      fieldId: FIELD_ID,
      plotId: PLOT_ID,
      cropType: 'soja',
      period: { year: 2026, season: 'verano' },
      totalRevenueARS: 980000,
      totalCostsARS: 615000,
      grossMarginARS: 365000,
      grossMarginPerHaARS: 16222,
      roiPercent: 59.35,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: USER_ID,
    },
    { merge: true }
  );

  console.log('Seed A1 completado.');
  console.log(`Organizacion: ${ORG_ID}`);
}

run().catch((error) => {
  console.error('Error seed A1:', error.message);
  process.exit(1);
});


