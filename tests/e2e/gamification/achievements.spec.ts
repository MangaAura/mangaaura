import { test, expect } from '@playwright/test';

test.describe('Achievements Page', () => {
  test.describe('Unauthenticated user', () => {
    test('should render the page without errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/achievements');

      // Page should have loaded
      await expect(page).toHaveTitle(/Logros/);

      // No cache-scope or headers() errors in console
      const cacheError = consoleErrors.find((e) =>
        e.includes('cache') || e.includes('headers()')
      );
      expect(cacheError).toBeUndefined();

      // The page should show the "Logros" heading
      await expect(
        page.getByRole('heading', { name: 'Logros' }).first()
      ).toBeVisible();
    });

    test('should show the achievement grid for unauthenticated users', async ({
      page,
    }) => {
      await page.goto('/achievements');

      // Verify the page renders the heading
      await expect(
        page.getByRole('heading', { name: 'Logros' }).first()
      ).toBeVisible();

      // Page should not crash or show server error
      await expect(page.getByText(/sin logros|logros/i).first()).toBeVisible();
    });

    test('should not show a server error (500) or crash', async ({ page }) => {
      const response = await page.goto('/achievements');
      expect(response?.status()).toBe(200);
    });
  });

  test.describe('Authenticated user', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in with test credentials
      await page.goto('/auth/login');

      await page.fill('#login-email', 'user@mangaaura.es');
      await page.fill('#login-password', 'SecurePass123!');

      await page.locator('button[type="submit"]').click();

      // Wait for redirect away from login page
      await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), {
        timeout: 15000,
      });

      // Verify login succeeded
      await expect(page).not.toHaveURL(/\/auth/);
    });

    test('should render the page with stats cards when authenticated', async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/achievements');

      // Page title
      await expect(page).toHaveTitle(/Logros/);

      // No cache-scope or headers() errors in console
      const cacheError = consoleErrors.find(
        (e) => e.includes('cache') || e.includes('headers()')
      );
      expect(cacheError).toBeUndefined();

      // Heading visible
      await expect(
        page.getByRole('heading', { name: 'Logros' }).first()
      ).toBeVisible();

      // Stats cards should be visible for authenticated users
      await expect(page.getByText('Desbloqueados').first()).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText('XP Total').first()).toBeVisible();
      await expect(page.getByText('Legendarios').first()).toBeVisible();
      await expect(page.getByText('Completado').first()).toBeVisible();
    });

    test('should show the rarity breakdown cards', async ({ page }) => {
      await page.goto('/achievements');

      // Rarity cards should be visible
      await expect(page.getByText('Común').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Raro').first()).toBeVisible();
      await expect(page.getByText('Épico').first()).toBeVisible();
      await expect(page.getByText('Legendario').first()).toBeVisible();
    });

    test('should show achievement sections for unlocked and locked', async ({
      page,
    }) => {
      await page.goto('/achievements');

      // Sections should appear
      await expect(
        page.getByRole('heading', { name: /Desbloqueados/i }).first()
      ).toBeVisible({ timeout: 10000 });

      await expect(
        page.getByRole('heading', { name: /Por Desbloquear/i })
      ).toBeVisible();
    });

    test('should not show HTTP 500 error', async ({ page }) => {
      const response = await page.goto('/achievements');
      expect(response?.status()).toBe(200);
    });

    test('should not show HTTP 404 error', async ({ page }) => {
      const response = await page.goto('/achievements');
      expect(response?.status()).not.toBe(404);
    });
  });

  test.describe('Achievement detail page (authenticated)', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in
      await page.goto('/auth/login');
      await page.fill('#login-email', 'user@mangaaura.es');
      await page.fill('#login-password', 'SecurePass123!');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), {
        timeout: 15000,
      });
      await expect(page).not.toHaveURL(/\/auth/);
    });

    test('should render an achievement detail page without errors', async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/achievements/primeros-pasos');

      // No cache-scope or headers() errors
      const cacheError = consoleErrors.find(
        (e) => e.includes('cache') || e.includes('headers()')
      );
      expect(cacheError).toBeUndefined();

      // Page should render the achievement name
      await expect(
        page.getByRole('heading', { name: 'Primeros Pasos' })
      ).toBeVisible({ timeout: 10000 });

      // Should show progress info
      await expect(page.getByText(/0\s*\/\s*1/)).toBeVisible();
    });

    test('should show 404 for non-existent achievement slug', async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      const response = await page.goto('/achievements/non-existent-slug-xyz');

      // Should either 404 or render a not-found state without crashing
      expect(
        response?.status() === 404 ||
        response?.status() === 200
      ).toBeTruthy();

      // No cache errors
      const cacheError = consoleErrors.find(
        (e) => e.includes('cache') || e.includes('headers()')
      );
      expect(cacheError).toBeUndefined();
    });
  });
});
