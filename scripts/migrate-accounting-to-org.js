/* eslint-disable no-console */
const admin = require('firebase-admin');
const path = require('node:path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyProducerArg = args.find((a) => a.startsWith('--producer='));
const onlyProducer = onlyProducerArg ? onlyProducerArg.split('=')[1] : null;

function initAdmin() {
  if (admin.apps.length) return;

  const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

function mapOldAccountToNew(old, orgId) {
  const moneda = old.moneda === 'USD' ? 'USD' : 'ARS';
  return {
    orgId,
    codigo: old.codigo,
    nombre: old.nombre,
    tipo: old.tipo,
    naturaleza: old.naturaleza || (old.tipo === 'ingreso' || old.tipo === 'pasivo' || old.tipo === 'patrimonio' ? 'acreedora' : 'deudora'),
    nivel: old.nivel || 1,
    cuentaPadreId: old.cuentaPadreId || null,
    admiteMovimientos: !!old.admiteMovimientos,
    esCuentaStock: !!old.esCuentaStock,
    moneda,
    active: old.activa !== false,
    createdAt: old.createdAt || new Date(),
    updatedAt: new Date(),
    legacyProducerId: old.productorId || null,
  };
}

function mapOldEntryToNew(old, orgId, legacyId) {
  const lineas = Array.isArray(old.lineas) ? old.lineas : [];
  const totalDebe = old.totalDebe ?? lineas.reduce((sum, l) => sum + (l.debe || 0), 0);
  const totalHaber = old.totalHaber ?? lineas.reduce((sum, l) => sum + (l.haber || 0), 0);

  return {
    orgId,
    numero: old.numero || 0,
    fecha: old.fecha && old.fecha.toDate ? old.fecha.toDate() : (old.fecha || new Date()),
    tipo: old.tipo || 'operativo',
    concepto: old.concepto || 'Asiento migrado',
    lineas: lineas.map((l) => ({
      cuentaId: l.cuentaId || l.cuentaCodigo || '',
      cuentaNombre: l.cuentaNombre || l.cuentaCodigo || 'Cuenta migrada',
      debe: l.debe || 0,
      haber: l.haber || 0,
    })),
    totalDebe,
    totalHaber,
    estado: old.estado || 'borrador',
    createdAt: old.createdAt && old.createdAt.toDate ? old.createdAt.toDate() : (old.createdAt || new Date()),
    updatedAt: new Date(),
    legacyAsientoId: legacyId,
    legacyProducerId: old.productorId || null,
  };
}

async function migrateProducer(db, producerId) {
  const userSnap = await db.collection('users').doc(producerId).get();
  if (!userSnap.exists) {
    console.log(`- ${producerId}: skip (no users/${producerId})`);
    return { accounts: 0, entries: 0, skipped: true };
  }

  const orgId = userSnap.data().organizationId;
  if (!orgId) {
    console.log(`- ${producerId}: skip (user without organizationId)`);
    return { accounts: 0, entries: 0, skipped: true };
  }

  const oldAccountsSnap = await db.collection('agro_productores').doc(producerId).collection('cuentas').get();
  const oldEntriesSnap = await db.collection('agro_productores').doc(producerId).collection('asientos').get();

  let accountsMigrated = 0;
  let entriesMigrated = 0;

  for (const oldAccDoc of oldAccountsSnap.docs) {
    const old = oldAccDoc.data();
    const mapped = mapOldAccountToNew(old, orgId);

    const exists = await db
      .collection(`organizations/${orgId}/accounts`)
      .where('codigo', '==', mapped.codigo)
      .limit(1)
      .get();

    if (!exists.empty) continue;
    if (!dryRun) {
      await db.collection(`organizations/${orgId}/accounts`).add(mapped);
    }
    accountsMigrated++;
  }

  for (const oldEntryDoc of oldEntriesSnap.docs) {
    const old = oldEntryDoc.data();
    const mapped = mapOldEntryToNew(old, orgId, oldEntryDoc.id);

    const exists = await db
      .collection(`organizations/${orgId}/journal_entries`)
      .where('legacyAsientoId', '==', oldEntryDoc.id)
      .limit(1)
      .get();

    if (!exists.empty) continue;
    if (!dryRun) {
      await db.collection(`organizations/${orgId}/journal_entries`).add(mapped);
    }
    entriesMigrated++;
  }

  const maxNumero = oldEntriesSnap.docs.reduce((max, d) => Math.max(max, d.data().numero || 0), 0);
  if (maxNumero > 0 && !dryRun) {
    await db.doc(`organizations/${orgId}/system/accounting_counter`).set(
      { journalEntryNumber: maxNumero, updatedAt: new Date(), migratedFromProducerId: producerId },
      { merge: true }
    );
  }

  console.log(`- ${producerId} -> ${orgId}: accounts=${accountsMigrated}, entries=${entriesMigrated}${dryRun ? ' (dry-run)' : ''}`);
  return { accounts: accountsMigrated, entries: entriesMigrated, skipped: false };
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  const producersSnap = onlyProducer
    ? await db.collection('agro_productores').where(admin.firestore.FieldPath.documentId(), '==', onlyProducer).get()
    : await db.collection('agro_productores').get();

  if (producersSnap.empty) {
    console.log('No agro_productores found');
    return;
  }

  console.log(`Migrating accounting for ${producersSnap.size} producer(s). dryRun=${dryRun}`);

  let totalAccounts = 0;
  let totalEntries = 0;
  let skipped = 0;

  for (const producerDoc of producersSnap.docs) {
    const result = await migrateProducer(db, producerDoc.id);
    totalAccounts += result.accounts;
    totalEntries += result.entries;
    if (result.skipped) skipped += 1;
  }

  console.log('---');
  console.log(`Done. accounts=${totalAccounts}, entries=${totalEntries}, skipped=${skipped}, dryRun=${dryRun}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
