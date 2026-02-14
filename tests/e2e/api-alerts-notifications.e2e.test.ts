import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

const PORT = 4010;
const BASE_URL = `http://127.0.0.1:${PORT}`;
let serverProcess: ChildProcessWithoutNullStreams | null = null;

async function waitForServer(url: string, timeoutMs = 90000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const response = await fetch(url);
            if (response.status < 500) return;
        } catch {
            // ignore until server is ready
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Server did not start within ${timeoutMs} ms`);
}

describe('E2E HTTP - alerts and notifications APIs', () => {
    beforeAll(async () => {
        if (process.platform === 'win32') {
            serverProcess = spawn('cmd', ['/c', 'npm', 'run', 'start', '--', '-p', String(PORT)], {
                cwd: process.cwd(),
                shell: false,
                stdio: 'pipe',
                env: process.env,
            });
        } else {
            serverProcess = spawn('npm', ['run', 'start', '--', '-p', String(PORT)], {
                cwd: process.cwd(),
                shell: false,
                stdio: 'pipe',
                env: process.env,
            });
        }

        await waitForServer(`${BASE_URL}/`, 90000);
    }, 180000);

    afterAll(async () => {
        if (serverProcess && !serverProcess.killed) {
            try {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t'], {
                        shell: false,
                        stdio: 'ignore',
                    });
                } else {
                    serverProcess.kill('SIGTERM');
                }
            } catch {
                // ignore teardown errors
            }
        }
    }, 180000);

    it('POST /api/alerts/send rejects push without targetUserId', async () => {
        const response = await fetch(`${BASE_URL}/api/alerts/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                alertId: 'e2e-a1',
                canal: 'push',
                alerta: {
                    titulo: 'Test',
                    descripcion: 'Test',
                    tipo: 'clima',
                    severidad: 'warning',
                },
                destino: {},
            }),
        });

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: 'targetUserId es requerido para canal push',
        });
    });

    it('POST /api/alerts/send returns 503 for email without provider credentials', async () => {
        const response = await fetch(`${BASE_URL}/api/alerts/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                alertId: 'e2e-a2',
                canal: 'email',
                alerta: {
                    titulo: 'Test email',
                    descripcion: 'Test email',
                    tipo: 'clima',
                    severidad: 'warning',
                },
                destino: { email: 'qa@example.com' },
            }),
        });

        expect(response.status).toBe(503);
        const body = await response.json();
        expect(body.error).toBe('No se pudo enviar el email de alerta');
    });

    it('POST /api/notifications/send validates required fields', async () => {
        const response = await fetch(`${BASE_URL}/api/notifications/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: 'u1' }),
        });

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: 'Missing required fields: targetUserId, type, payload',
        });
    });
});
