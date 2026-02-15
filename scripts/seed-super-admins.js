const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const users = [];

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--user' && args[i + 1]) {
      const raw = args[i + 1];
      const [email, password, displayName] = raw.split(':');
      if (email && password) {
        users.push({
          email,
          password,
          displayName: displayName || email.split('@')[0],
        });
      }
      i += 1;
    }
  }

  if (users.length === 0) {
    users.push({
      email: 'superadmin@donjuangis.com',
      password: 'AgroAdmin#2026',
      displayName: 'Super Admin Principal',
    });
    users.push({
      email: 'admin.sigagro@donjuangis.com',
      password: 'AgroAdmin#2026B',
      displayName: 'Super Admin Backup',
    });
  }

  return users;
}

function initAdmin() {
  if (admin.apps.length) return admin.app();

  loadEnvFile();

  const projectId = process.env.FIREBASE_PROJECT_ID || 'sig-agro-83adc';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }

  const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    const sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return admin.initializeApp({
      credential: admin.credential.cert(sa),
    });
  }

  return admin.initializeApp({ projectId });
}

async function upsertSuperAdmin(auth, db, userSeed) {
  let userRecord;

  try {
    userRecord = await auth.getUserByEmail(userSeed.email);
    await auth.updateUser(userRecord.uid, {
      password: userSeed.password,
      displayName: userSeed.displayName,
      disabled: false,
    });
  } catch (error) {
    if (error && error.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({
        email: userSeed.email,
        password: userSeed.password,
        displayName: userSeed.displayName,
        emailVerified: true,
        disabled: false,
      });
    } else {
      throw error;
    }
  }

  await auth.setCustomUserClaims(userRecord.uid, { role: 'super_admin' });

  await db.collection('users').doc(userRecord.uid).set(
    {
      email: userSeed.email,
      displayName: userSeed.displayName,
      role: 'super_admin',
      status: 'active',
      organizationId: '',
      organizationIds: [],
      accessAllOrganizations: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    uid: userRecord.uid,
    email: userSeed.email,
    password: userSeed.password,
    displayName: userSeed.displayName,
  };
}

async function main() {
  const users = parseArgs();
  const app = initAdmin();
  const auth = admin.auth(app);
  const db = admin.firestore(app);

  const results = [];
  for (const userSeed of users) {
    const result = await upsertSuperAdmin(auth, db, userSeed);
    results.push(result);
  }

  console.log('Super admins provisionados:');
  for (const item of results) {
    console.log(`- ${item.email} | password: ${item.password} | uid: ${item.uid}`);
  }
}

main().catch((err) => {
  console.error('Error creando super admins:', err);
  process.exit(1);
});
