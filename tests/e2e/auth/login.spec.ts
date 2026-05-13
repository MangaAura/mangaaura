import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page.getByText(/requerido|obligatorio/i).first()).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByText(/registrarse|crear cuenta/i).first().click();
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByText(/olvidaste|recuperar/i).click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });
});
