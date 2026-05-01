/**
 * E2E — Flujos principales de SIG Agro
 *
 * Prerequisito: variables de entorno de test en .env.test.local
 *   E2E_EMAIL=<productor-de-prueba@test.com>
 *   E2E_PASSWORD=<password>
 *
 * Ejecutar: npx playwright test
 */

import { test, expect, Page } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL ?? 'test@sigagro.com';
const PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123';

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  // Esperar redirección al dashboard
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

// ─── Login ────────────────────────────────────────────────────────────────────

test('login con credenciales validas redirige al dashboard', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator('text=Dashboard').first()).toBeVisible();
});

test('login con credenciales invalidas muestra error', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'noexiste@test.com');
  await page.fill('input[type="password"]', 'wrongpass');
  await page.click('button[type="submit"]');
  await expect(page.locator('[class*="rose"], [class*="error"], [role="alert"]').first()).toBeVisible({ timeout: 8_000 });
});

// ─── Organizaciones ──────────────────────────────────────────────────────────

test('crear nueva organizacion desde el dialog', async ({ page }) => {
  await login(page);
  await page.goto('/organizaciones');

  await page.click('button:has-text("Nueva organizacion")');
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  const ts = Date.now();
  await page.fill('input[placeholder=""]', `Org Test ${ts}`, { force: true });
  // Completar campos del dialog por label
  const labels = page.locator('[role="dialog"] label');
  await labels.filter({ hasText: 'Nombre' }).locator('input').fill(`Org Test ${ts}`);
  await labels.filter({ hasText: 'Email' }).locator('input').fill(`org${ts}@test.com`);
  await labels.filter({ hasText: 'Provincia' }).locator('input').fill('Chaco');

  await page.click('[role="dialog"] button[type="submit"]');
  // Debe aparecer en la tabla tras crear
  await page.waitForTimeout(2000);
  await expect(page.locator(`text=Org Test ${ts}`)).toBeVisible({ timeout: 10_000 });
});

// ─── Campos ───────────────────────────────────────────────────────────────────

test('abrir dialog de nuevo campo y cancelar', async ({ page }) => {
  await login(page);
  await page.goto('/campos');

  await page.click('button:has-text("Nuevo campo")');
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('[role="dialog"] text=Nuevo campo')).toBeVisible();

  await page.click('[role="dialog"] button:has-text("Cancelar")');
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
});

test('crear campo basico desde el dialog', async ({ page }) => {
  await login(page);
  await page.goto('/campos');

  await page.click('button:has-text("Nuevo campo")');
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  const ts = Date.now();
  const nombre = `Campo E2E ${ts}`;

  await page.locator('[role="dialog"] input').first().fill(nombre);
  // Seleccionar departamento
  await page.locator('[role="dialog"] [role="combobox"]').first().click();
  await page.locator('[role="option"]').first().click();

  await page.click('[role="dialog"] button[type="submit"]');
  await expect(page.locator(`text=${nombre}`)).toBeVisible({ timeout: 10_000 });
});

// ─── Campañas ─────────────────────────────────────────────────────────────────

test('abrir dialog de nueva campana', async ({ page }) => {
  await login(page);
  await page.goto('/campanias');

  await page.click('button:has-text("Nueva campana")');
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('[role="dialog"] text=Nueva campana')).toBeVisible();

  await page.click('[role="dialog"] button:has-text("Cancelar")');
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
});

// ─── Navegacion dashboard ─────────────────────────────────────────────────────

test('navegar entre modulos principales sin pantalla en blanco', async ({ page }) => {
  await login(page);

  const rutas = ['/dashboard', '/campos', '/campanias'];
  for (const ruta of rutas) {
    await page.goto(ruta);
    // Ninguna ruta debe mostrar error 500 ni pantalla completamente en blanco
    await expect(page.locator('body')).not.toBeEmpty();
    const status = page.url();
    expect(status).not.toContain('500');
    expect(status).not.toContain('error');
  }
});
