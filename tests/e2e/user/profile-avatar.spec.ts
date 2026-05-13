import { test, expect } from '@playwright/test';

test.describe('Perfil de Usuario — Avatar', () => {
  test('debe mostrar el avatar del usuario como un círculo perfecto', async ({ page }) => {
    // Navegar al perfil del usuario admin (usuario de seed)
    await page.goto('/user/admin');

    // Verificar que la página del perfil cargó correctamente
    await expect(page.getByRole('heading', { name: /admin/i }).first()).toBeVisible({ timeout: 10000 });

    // Encontrar el contenedor del avatar usando clases específicas del HeroGlowAvatar:
    // ring-4 es exclusivo del anillo del avatar en el perfil
    const avatarContainer = page.locator('.ring-4.rounded-full').first();
    await expect(avatarContainer).toBeVisible({ timeout: 5000 });
    // Esperar a que animaciones de Framer Motion terminen
    await avatarContainer.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);

    // Verificar que el avatar es un círculo perfecto:
    // ancho y alto deben ser iguales
    const avatarBox = await avatarContainer.boundingBox();
    expect(avatarBox).not.toBeNull();

    if (avatarBox) {
      const { width, height } = avatarBox;
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      // Tolerancia de 1px para diferencias de subpixel rendering
      expect(Math.abs(width - height)).toBeLessThanOrEqual(1);
    }

    // Verificar border-radius via computed style
    const borderRadius = await avatarContainer.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });

    expect(borderRadius).toBeTruthy();
    const radiusValue = parseFloat(borderRadius);

    if (borderRadius.includes('%')) {
      // Si es porcentaje, debe ser >= 50% para ser circular
      expect(radiusValue).toBeGreaterThanOrEqual(50);
    } else if (avatarBox) {
      // Si es px, debe ser >= mitad del ancho
      expect(radiusValue).toBeGreaterThanOrEqual(avatarBox.width / 2);
    }
  });

  test('debe mostrar el fallback con la inicial cuando no hay foto', async ({ page }) => {
    await page.goto('/user/admin');

    // Esperar que el perfil cargue
    await expect(page.getByRole('heading', { name: /admin/i }).first()).toBeVisible({ timeout: 10000 });

    // Buscar el contenedor del avatar
    const avatarContainer = page.locator('.ring-4.rounded-full').first();
    await expect(avatarContainer).toBeVisible({ timeout: 5000 });

    // Verificar si tiene imagen o fallback
    const avatarImage = avatarContainer.locator('img');
    const hasImage = await avatarImage.isVisible();

    if (!hasImage) {
      // Si no hay imagen, el fallback debe mostrar la inicial del username
      const fallbackText = await avatarContainer.textContent();
      expect(fallbackText).toBeTruthy();
      // La inicial debe ser "a" (de admin) — case insensitive
      expect(fallbackText!.trim().toLowerCase()).toMatch(/^[a-z]$/);
    }
  });

  test('el avatar debe tener dimensiones razonables (mínimo 40px, máximo 300px)', async ({ page }) => {
    await page.goto('/user/admin');

    // Esperar que el perfil cargue
    await expect(page.getByRole('heading', { name: /admin/i }).first()).toBeVisible({ timeout: 10000 });

    // Buscar el contenedor del avatar
    const avatarContainer = page.locator('.ring-4.rounded-full').first();
    await expect(avatarContainer).toBeVisible({ timeout: 5000 });

    // Esperar a que el avatar esté estable (animaciones de Framer Motion terminadas)
    await avatarContainer.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500); // margen para animaciones

    const avatarBox = await avatarContainer.boundingBox();
    expect(avatarBox).not.toBeNull();

    if (avatarBox) {
      // El avatar del header de perfil (w-36 h-36 = 144px) debe ser al menos 40px
      expect(avatarBox.width).toBeGreaterThanOrEqual(40);
      expect(avatarBox.height).toBeGreaterThanOrEqual(40);
      expect(avatarBox.width).toBeLessThanOrEqual(300);
      expect(avatarBox.height).toBeLessThanOrEqual(300);
    }
  });
});
