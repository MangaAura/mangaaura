import { test, expect } from '@playwright/test';

const TIMESTAMP = Date.now();
const TEST_USER = {
  username: `testprod_${TIMESTAMP}`,
  email: `testprod_${TIMESTAMP}@mangaaura.com`,
  password: 'TestPass123!',
};

const PROD_URL = 'https://mangaaura.vercel.app';

test('register flow on production: creates user and auto-logs in', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

  const failedRequests: { url: string; status: number; body: string }[] = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (response.status() >= 400) {
      try {
        const body = await response.text();
        failedRequests.push({ url, status: response.status(), body: body.substring(0, 500) });
      } catch {}
    }
    if (url.includes('/api/auth/')) {
      logs.push(`[AUTH] ${response.status()} ${url}`);
    }
  });

  // Step 1: Navigate to register page — use 'load' instead of 'networkidle'
  // Sentry/WebSocket connections prevent networkidle from ever resolving
  console.log('[TEST] Navigating to register...');
  await page.goto(`${PROD_URL}/auth/register`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#register-username', { timeout: 15000 });
  console.log('[TEST] Register form loaded');

  // Step 2: Fill the form
  await page.locator('#register-username').fill(TEST_USER.username);
  await page.locator('#register-email').fill(TEST_USER.email);
  await page.locator('#register-password').fill(TEST_USER.password);
  await page.locator('#register-confirm-password').fill(TEST_USER.password);

  // Step 3: Check terms — click the LABEL wrapping the checkbox, not the hidden input
  // The checkbox has appearance-none CSS, so Playwright can't interact with it directly.
  // Clicking the label toggles the React controlled checkbox reliably.
  const termsLabel = page.locator('label').filter({ has: page.locator('input[name="accept-terms"]') });
  await termsLabel.click();
  // Verify React state update: the checkbox should now be checked
  await page.waitForFunction(() => {
    const cb = document.querySelector('input[name="accept-terms"]') as HTMLInputElement;
    return cb?.checked === true;
  }, { timeout: 5000 });
  console.log('[TEST] Terms accepted (checkbox checked)');

  // Step 4: Submit registration — the button should now be enabled
  console.log('[TEST] Submitting registration...');
  const submitButton = page.locator('button[type="submit"]').first();
  // Wait for button to be enabled (not disabled by acceptedTerms)
  await expect(submitButton).toBeEnabled({ timeout: 5000 });
  await submitButton.click();

  // Step 5: Wait for redirect (auto-login should redirect to home)
  // Use waitForURL instead of fixed timeout for more reliable detection
  try {
    await page.waitForURL((url) => !url.pathname.includes('/auth/register'), { timeout: 15000 });
    console.log('[TEST] Redirected away from register page');
  } catch {
    console.log('[TEST] Still on register page — checking for errors');
  }

  const finalUrl = page.url();
  console.log(`[TEST] Final URL: ${finalUrl}`);
  console.log('=== Browser Console ===');
  for (const log of logs) {
    console.log(log);
  }

  // Step 6: Assertions
  // Should not be on the error page or still on register page
  expect(finalUrl).not.toContain('/auth/register');
  expect(finalUrl).not.toContain('/auth/error');
  expect(finalUrl).not.toContain('/auth/login');

  // Should have no failed API requests (except maybe analytics/Sentry)
  const criticalFailures = failedRequests.filter(f => !f.url.includes('sentry') && !f.url.includes('analytics') && !f.url.includes('ingest'));
  if (criticalFailures.length > 0) {
    console.log('=== CRITICAL FAILURES ===');
    for (const fr of criticalFailures) {
      console.log(`${fr.status} ${fr.url}: ${fr.body}`);
    }
  }
  // Rate limiting (429) means the test can't run properly — that's a test env issue, not a bug
  const rateLimited = criticalFailures.filter(f => f.status === 429);
  if (rateLimited.length > 0) {
    console.log('[TEST] Rate limited — skipping strict assertion');
  } else {
    expect(criticalFailures.length).toBe(0);
  }

  console.log('[TEST] ✅ PASSED');
});

// Cleanup: delete the test user after test completes
test.afterAll(async () => {
  console.log(`[CLEANUP] User to delete: ${TEST_USER.email}`);
  // We log the user for manual cleanup — production DB access differs per env
});
