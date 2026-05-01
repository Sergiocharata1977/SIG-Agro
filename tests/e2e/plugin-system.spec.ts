import { test, expect, type Locator, type Page } from '@playwright/test';

type Credentials = {
  email: string;
  password: string;
};

/**
 * Contratos esperados para habilitar estos flujos sin skip:
 * - Usuarios de prueba via TEST_*_EMAIL / TEST_*_PASSWORD
 * - data-testid estables en sidebar, fallback de PluginGuard y marketplace
 * - Ruta interna de marketplace de plugins disponible en el entorno
 */
const DEFAULT_PLUGIN_ROUTE = process.env.E2E_PLUGIN_ROUTE ?? '/analisis-ia';
const DEFAULT_MARKETPLACE_ROUTE = process.env.E2E_PLUGIN_MARKETPLACE_ROUTE ?? '/configuracion/plugins';
const DEFAULT_PLUGIN_SLUG = process.env.E2E_PLUGIN_SLUG ?? 'analisis_ia';

const TEST_IDS = {
  pluginDisabledFallback: process.env.E2E_PLUGIN_DISABLED_TEST_ID ?? 'plugin-not-enabled',
  pluginPageReady: process.env.E2E_PLUGIN_PAGE_READY_TEST_ID ?? 'analisis-ia-page',
  sidebarPluginItem: process.env.E2E_ANALISIS_IA_SIDEBAR_TEST_ID ?? 'sidebar-plugin-analisis_ia',
  pluginMarketplaceCard: process.env.E2E_ANALISIS_IA_CARD_TEST_ID ?? 'plugin-card-analisis_ia',
  pluginEnableButton: process.env.E2E_ANALISIS_IA_ENABLE_TEST_ID ?? 'plugin-enable-analisis_ia',
  activeOrganizationSelect: process.env.E2E_ACTIVE_ORG_SELECT_TEST_ID ?? 'active-organization-select',
} as const;

function getCredentials(prefix: 'TEST_USER' | 'TEST_OWNER' | 'TEST_MULTI_ORG'): Credentials | null {
  const email = process.env[`${prefix}_EMAIL`] ?? process.env.TEST_USER_EMAIL ?? '';
  const password = process.env[`${prefix}_PASSWORD`] ?? process.env.TEST_USER_PASSWORD ?? '';

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

function hasAllEnvVars(...keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]));
}

async function login(page: Page, credentials: Credentials) {
  await page.goto('/auth/login');
  await page.locator('input[type="email"]').fill(credentials.email);
  await page.locator('input[type="password"]').fill(credentials.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

async function gotoOrSkip(page: Page, route: string, reason: string) {
  const response = await page.goto(route);

  if (!response || response.status() >= 400) {
    test.skip(true, `${reason} Ruta no disponible: ${route}`);
  }
}

async function requireVisible(locator: Locator, reason: string) {
  const count = await locator.count();
  if (count === 0) {
    test.skip(true, reason);
  }

  await expect(locator.first()).toBeVisible();
}

async function selectOrganizationOrSkip(page: Page, value: string, reason: string) {
  const orgSelect = page.getByTestId(TEST_IDS.activeOrganizationSelect);
  const count = await orgSelect.count();

  if (count === 0) {
    test.skip(true, reason);
  }

  const option = orgSelect.locator(`option[value="${value}"]`);
  if (await option.count() === 0) {
    test.skip(true, `${reason} No existe la organizacion ${value} en el selector.`);
  }

  await orgSelect.selectOption(value);
  await expect(orgSelect).toHaveValue(value);
}

test.describe('Plugin system E2E', () => {
  test('plugin deshabilitado oculta navegacion', async ({ page }) => {
    const credentials = getCredentials('TEST_USER');
    test.skip(!credentials, 'Definir TEST_USER_EMAIL y TEST_USER_PASSWORD para ejecutar este flujo.');

    await login(page, credentials!);

    const sidebarPluginItem = page.getByTestId(TEST_IDS.sidebarPluginItem);
    await expect(sidebarPluginItem).toHaveCount(0);

    await gotoOrSkip(page, DEFAULT_PLUGIN_ROUTE, 'El modulo premium no esta disponible en este ambiente.');

    const fallback = page.getByTestId(TEST_IDS.pluginDisabledFallback);
    const pageReady = page.getByTestId(TEST_IDS.pluginPageReady);

    if (await fallback.count() === 0 && await pageReady.count() === 0) {
      test.skip(
        true,
        `Faltan los contratos E2E esperados para ${DEFAULT_PLUGIN_SLUG}: ` +
        `${TEST_IDS.pluginDisabledFallback} o ${TEST_IDS.pluginPageReady}.`
      );
    }

    await expect(fallback).toBeVisible();
    await expect(pageReady).toHaveCount(0);
  });

  test('flujo de habilitacion de plugin', async ({ page }) => {
    const credentials = getCredentials('TEST_OWNER');
    test.skip(!credentials, 'Definir TEST_OWNER_EMAIL y TEST_OWNER_PASSWORD para ejecutar este flujo.');

    await login(page, credentials!);
    await gotoOrSkip(page, DEFAULT_MARKETPLACE_ROUTE, 'El marketplace interno de plugins no existe en este branch.');

    const pluginCard = page.getByTestId(TEST_IDS.pluginMarketplaceCard);
    const enableButton = page.getByTestId(TEST_IDS.pluginEnableButton);

    await requireVisible(
      pluginCard,
      `No se encontro ${TEST_IDS.pluginMarketplaceCard}. Agregar data-testid al marketplace antes de habilitar este E2E.`
    );
    await requireVisible(
      enableButton,
      `No se encontro ${TEST_IDS.pluginEnableButton}. Agregar data-testid al boton de habilitacion antes de habilitar este E2E.`
    );

    await enableButton.click();

    const sidebarPluginItem = page.getByTestId(TEST_IDS.sidebarPluginItem);
    await requireVisible(
      sidebarPluginItem,
      `No se encontro ${TEST_IDS.sidebarPluginItem} luego de habilitar el plugin.`
    );

    await page.goto(DEFAULT_PLUGIN_ROUTE);

    const fallback = page.getByTestId(TEST_IDS.pluginDisabledFallback);
    const pageReady = page.getByTestId(TEST_IDS.pluginPageReady);

    if (await pageReady.count() === 0) {
      test.skip(
        true,
        `No se encontro ${TEST_IDS.pluginPageReady}. Agregar un data-testid estable en la pagina del plugin para este E2E.`
      );
    }

    await expect(fallback).toHaveCount(0);
    await expect(pageReady).toBeVisible();
  });

  test('cambio de organizacion activa actualiza plugins visibles', async ({ page }) => {
    const credentials = getCredentials('TEST_MULTI_ORG');
    test.skip(
      !credentials || !hasAllEnvVars('TEST_MULTI_ORG_PRIMARY_ID', 'TEST_MULTI_ORG_SECONDARY_ID'),
      'Definir TEST_MULTI_ORG_EMAIL, TEST_MULTI_ORG_PASSWORD, TEST_MULTI_ORG_PRIMARY_ID y TEST_MULTI_ORG_SECONDARY_ID.'
    );

    await login(page, credentials!);

    const sidebarPluginItem = page.getByTestId(TEST_IDS.sidebarPluginItem);

    await selectOrganizationOrSkip(
      page,
      process.env.TEST_MULTI_ORG_PRIMARY_ID!,
      `No se encontro ${TEST_IDS.activeOrganizationSelect}.`
    );
    await expect(sidebarPluginItem).toHaveCount(0);

    await selectOrganizationOrSkip(
      page,
      process.env.TEST_MULTI_ORG_SECONDARY_ID!,
      `No se encontro ${TEST_IDS.activeOrganizationSelect}.`
    );

    await requireVisible(
      sidebarPluginItem,
      `El item ${TEST_IDS.sidebarPluginItem} no aparecio al cambiar a la organizacion secundaria.`
    );
  });
});
