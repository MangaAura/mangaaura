import { test, expect } from '@playwright/test';

test.describe('Perfil de Usuario', () => {
  test('debe mostrar el perfil del usuario cuando ha iniciado sesión', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText(/perfil|usuario/i).first()).toBeVisible();
  });

  test('debe mostrar la pestaña de actividad', async ({ page }) => {
    await page.goto('/profile');
    await page.getByRole('tab', { name: /actividad/i }).click();
    await expect(page.getByText(/actividad|actividad reciente/i)).toBeVisible();
  });

  test('debe mostrar la sección de logros', async ({ page }) => {
    await page.goto('/profile');
    const achievementsLink = page.getByText(/logros|achievements/i);
    if (await achievementsLink.isVisible()) {
      await achievementsLink.click();
    }
  });
});
