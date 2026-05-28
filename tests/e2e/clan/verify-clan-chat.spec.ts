import { test, expect } from '@playwright/test';

test('clan chat appears in messages page', async ({ page }) => {
  const apiCalls: { url: string; status: number; body: string }[] = [];

  page.on('response', async (response) => {
    if (response.url().includes('/api/')) {
      try {
        const body = await response.text();
        apiCalls.push({ url: response.url(), status: response.status(), body: body.substring(0, 500) });
      } catch {}
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[CONSOLE ERROR] ${msg.text()}`);
  });

  // Log in
  await page.goto('/es/auth/login');
  await page.waitForTimeout(1000);

  const emailInput = page.locator('input[type="email"]').or(page.locator('input[name="email"]')).first();
  const passwordInput = page.locator('input[type="password"]').first();

  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailInput.fill('admin@mangaaura.com');
    await passwordInput.fill('Admin123!');
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(3000);
  }

  // Navigate to messages
  await page.goto('/es/messages');
  await page.waitForTimeout(5000); // Wait for all fetches to complete

  console.log('=== FINAL URL ===', page.url());

  for (const call of apiCalls) {
    console.log(`${call.status} ${call.url}`);
    if (call.url.includes('/api/user/clan') || call.url.includes('/api/clans/')) {
      console.log(`  Body: ${call.body}`);
    }
  }

  // Take screenshot
  await page.screenshot({ path: 'test-results/clan-chat-messages.png', fullPage: true });
  await page.screenshot({ path: 'test-results/clan-chat-viewport.png' });

  // Check for clan chat indicators
  const pageText = await page.locator('body').textContent().catch(() => '');
  console.log('\n=== PAGE TEXT ANALYSIS ===');
  
  const hasSinMensajes = pageText?.includes('Sin mensajes');
  const hasClanBadge = pageText?.includes('Clan');
  const hasChatea = pageText?.includes('Chatea con tu clan');
  const hasDadwa = pageText?.includes('dadwa');
  const hasMangaAuraLegends = pageText?.includes('MangaAura Legends');
  
  console.log('Sin mensajes:', hasSinMensajes);
  console.log('Clan badge:', hasClanBadge);
  console.log('Chatea con tu clan:', hasChatea);
  console.log('dadwa:', hasDadwa);
  console.log('MangaAura Legends:', hasMangaAuraLegends);

  // Test should pass regardless of clan chat visibility (we're debugging)
  expect(page.url()).toContain('/messages');
});
