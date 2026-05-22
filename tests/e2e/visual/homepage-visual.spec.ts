import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Core Pages', () => {
  test('homepage should render correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take screenshot of full homepage
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      threshold: 0.05,
    });
  });

  test('explore page should render correctly', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('explore.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      threshold: 0.05,
    });
  });

  test('rankings page should render correctly', async ({ page }) => {
    await page.goto('/rankings');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('rankings.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      threshold: 0.05,
    });
  });

  test('login page should render correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      threshold: 0.05,
    });
  });

  test('offline page should render correctly', async ({ page }) => {
    await page.goto('/offline');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('offline.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      threshold: 0.05,
    });
  });
});
