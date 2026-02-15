#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * A1 migration: normaliza usuarios multi-organizacion y registra version de esquema.
 *
 * Uso:
 *   npm run migrate:a1:dry
 *   npm run migrate:a1
 */

const fs = require('fs');
const path = require('path');
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const dryRun = process.argv.includes('--dry-run');

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

async function migrateUsers(db) {
  const usersSnap = await db.collection('users').get();
  let patched = 0;

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const patch = {};

    if (typeof data.organizationId === 'string' && data.organizationId.trim()) {
      if (!Array.isArray(data.organizationIds) || data.organizationIds.length === 0) {
        patch.organizationIds = [data.organizationId];
      }
    }

    if (typeof data.accessAllOrganizations !== 'boolean') {
      patch.accessAllOrganizations = true;
    }

    if (Object.keys(patch).length > 0) {
      patched += 1;
      if (!dryRun) {
        await doc.ref.set(
          {
            ...patch,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  }

  return patched;
}

async function registerSchemaVersion(db) {
  if (dryRun) return;

  await db
    .collection('system')
    .doc('domain_schema')
    .set(
      {
        version: 'a1-v1.0.0',
        releasedAt: FieldValue.serverTimestamp(),
        notes: 'Modelo base A1: logbooks, treatments, irrigation, subplots, sensor_readings, profitability_snapshots',
      },
      { merge: true }
    );
}

async function run() {
  const serviceAccount = loadServiceAccount();

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }

  const db = getFirestore();

  console.log(`Proyecto: ${serviceAccount.project_id}`);
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APLICAR'}`);

  const usersPatched = await migrateUsers(db);
  await registerSchemaVersion(db);

  console.log('Migracion A1 finalizada.');
  console.log(`Usuarios a normalizar: ${usersPatched}`);
}

run().catch((error) => {
  console.error('Error migracion A1:', error.message);
  process.exit(1);
});
