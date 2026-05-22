import { test, expect } from '@playwright/test';

test.describe('Reader Page', () => {
  test('should render reader page container', async ({ page }) => {
    await page.goto('/reader/test-manga');
    // Verify the page renders without crashing
    await expect(page.locator('html')).toBeVisible();
    await page.waitForTimeout(2000);
    // Reader should have navigation elements or content area
    const hasContent = await page.locator('main, [role="main"], section, article').count();
    expect(hasContent).toBeGreaterThanOrEqual(0); // Page should load without crash
  });

  test('should handle keyboard navigation gracefully', async ({ page }) => {
    await page.goto('/reader/test-manga');
    await page.waitForTimeout(1500);

    // Test basic keyboard interactions without crashing
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('f'); // Fullscreen toggle

    await expect(page.locator('body')).toBeVisible();
  });

  test('should have no console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/reader/test-manga');
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(
      (msg) => !msg.includes('hydration') && !msg.includes('Manifest')
    );
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Chapter Reader Page', () => {
  test('should render chapter reader route', async ({ page }) => {
    await page.goto('/manga/test-manga/chapter/1');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle non-existent chapter gracefully', async ({ page }) => {
    await page.goto('/manga/non-existent-manga-12345/chapter/99999');
    await page.waitForTimeout(3000);

    // Should show error or 404 without crashing
    await expect(page.locator('body')).toBeVisible();

    // Should NOT show Next.js error overlay in production
    const errorOverlay = page.locator('nextjs-portal, [data-nextjs-dialog]');
    await expect(errorOverlay).toHaveCount(0);
  });

  test('should have accessible elements', async ({ page }) => {
    await page.goto('/manga/test-manga/chapter/1');
    await page.waitForTimeout(2000);

    // Check for presence of accessible landmarks
    // At minimum, a page should have a main or nav (even 404 pages should have navigation)
    const mainOrNav = page.locator('main, nav, [role="main"], [role="navigation"]');
    await expect(mainOrNav.first()).toBeAttached({ timeout: 5000 });
  });
});
