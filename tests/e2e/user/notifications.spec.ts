import { test, expect } from '@playwright/test';

test.describe('Notificaciones', () => {
  test('debe mostrar la campana de notificaciones', async ({ page }) => {
    await page.goto('/');
    const bellButton = page.getByLabel(/notificaciones|notifications/i);
    await expect(bellButton).toBeVisible();
  });

  test('debe mostrar el panel de notificaciones al hacer clic', async ({ page }) => {
    await page.goto('/');
    const bellButton = page.getByLabel(/notificaciones|notifications/i);
    if (await bellButton.isVisible()) {
      await bellButton.click();
      await expect(page.getByText(/notificaciones|sin notificaciones|notifications|no notifications/i)).toBeVisible();
    }
  });
});
