import { test, expect } from '@playwright/test';

test.describe('Registration Page', () => {
  test('should display register form', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByRole('heading', { name: /crear cuenta|registro|create account|register/i })).toBeVisible();
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Different1!');
    await page.getByRole('button', { name: /crear cuenta|registrarse|create account|sign up/i }).click();
    await expect(page.getByText(/no coinciden|match/i)).toBeVisible();
  });

  test('should require accepted terms', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    await page.getByRole('button', { name: /crear cuenta|registrarse|create account|sign up/i }).click();
    await expect(page.getByText(/términos|obligatorio|terms|required/i)).toBeVisible();
  });
});
