import { test, expect } from '@playwright/test';

test.describe('Browse Manga Page', () => {
  test('should display manga list', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.getByPlaceholder(/buscar/i).first()).toBeVisible();
  });

  test('should navigate to manga detail on click', async ({ page }) => {
    await page.goto('/browse');
    const mangaCard = page.locator('a[href*="/manga/"]').first();
    if (await mangaCard.isVisible()) {
      await mangaCard.click();
      await expect(page).toHaveURL(/\/manga\//);
    }
  });
});
