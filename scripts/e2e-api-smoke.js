/* eslint-disable no-console */
const { spawn } = require('node:child_process');

const PORT = Number(process.env.E2E_PORT || (4100 + Math.floor(Math.random() * 200)));
const BASE_URL = `http://127.0.0.1:${PORT}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.status < 500) return;
    } catch {
      // retry
    }
    await sleep(1000);
  }
  throw new Error(`Server did not start within ${timeoutMs}ms`);
}

async function run() {
  console.log(`[E2E] Starting Next server on port ${PORT}...`);

  const server = spawn('npm', ['run', 'start', '--', '-p', String(PORT)], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'pipe',
    env: process.env,
  });

  server.stdout.on('data', (chunk) => {
    const line = String(chunk).trim();
    if (line) console.log(`[server] ${line}`);
  });
  server.stderr.on('data', (chunk) => {
    const line = String(chunk).trim();
    if (line) console.error(`[server:err] ${line}`);
  });

  try {
    await waitForServer(`${BASE_URL}/`);
    console.log('[E2E] Server is up. Running API checks...');

    const r1 = await fetch(`${BASE_URL}/api/alerts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId: 'smoke-a1',
        canal: 'push',
        alerta: { titulo: 't', descripcion: 'd', tipo: 'clima', severidad: 'warning' },
        destino: {},
      }),
    });
    if (r1.status !== 400) throw new Error(`Expected 400 for push without targetUserId, got ${r1.status}`);

    const r2 = await fetch(`${BASE_URL}/api/alerts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId: 'smoke-a2',
        canal: 'email',
        alerta: { titulo: 't', descripcion: 'd', tipo: 'clima', severidad: 'warning' },
        destino: { email: 'qa@example.com' },
      }),
    });
    if (r2.status !== 503) throw new Error(`Expected 503 for email without provider credentials, got ${r2.status}`);

    const r3 = await fetch(`${BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: 'u1' }),
    });
    if (r3.status !== 400) throw new Error(`Expected 400 for invalid notifications payload, got ${r3.status}`);

    console.log('[E2E] PASS - API smoke checks completed');
  } finally {
    console.log('[E2E] Stopping server...');
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(server.pid), '/f', '/t'], { shell: true, stdio: 'ignore' });
    } else {
      server.kill('SIGTERM');
    }
  }
}

run().catch((error) => {
  console.error(`[E2E] FAIL - ${error.message}`);
  process.exitCode = 1;
});
