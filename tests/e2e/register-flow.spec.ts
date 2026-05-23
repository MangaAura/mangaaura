import { test, expect } from '@playwright/test';

const TEST_USER = {
  username: `testflow_${Date.now()}`,
  email: `testflow_${Date.now()}@mangaaura.com`,
  password: 'TestPass123!',
};

test('register flow: debug signIn failure', async ({ page }) => {
  // Capture ALL console output
  const logs: string[] = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

  // Capture network failures
  const failedRequests: { url: string; status: number; body: string }[] = [];
  page.on('response', async (response) => {
    if (response.status() >= 400) {
      try {
        const body = await response.text();
        failedRequests.push({ url: response.url(), status: response.status(), body: body.substring(0, 500) });
      } catch {}
    }
    if (response.url().includes('/api/auth/callback') || response.url().includes('/api/auth/csrf')) {
      logs.push(`[NETWORK] ${response.status()} ${response.url()}`);
      try {
        const body = await response.text();
        logs.push(`[NETWORK BODY] ${body.substring(0, 300)}`);
      } catch {}
    }
  });

  // Navigate to register page
  await page.goto('/auth/register');
  await page.waitForSelector('#register-username', { timeout: 10000 });

  // Type into fields
  await page.locator('#register-username').click();
  await page.locator('#register-username').fill(TEST_USER.username);
  await page.waitForTimeout(200);

  await page.locator('#register-email').click();
  await page.locator('#register-email').fill(TEST_USER.email);
  await page.waitForTimeout(200);

  await page.locator('#register-password').click();
  await page.locator('#register-password').fill(TEST_USER.password);
  await page.waitForTimeout(200);

  await page.locator('#register-confirm-password').click();
  await page.locator('#register-confirm-password').fill(TEST_USER.password);
  await page.waitForTimeout(200);

  // Check terms — click the LABEL wrapping the checkbox, not the hidden input
  // The checkbox has appearance-none CSS, so Playwright can't interact with it directly.
  // Clicking the label toggles the React controlled checkbox reliably.
  const termsLabel = page.locator('label').filter({ has: page.locator('input[name="accept-terms"]') });
  await termsLabel.click();
  // Verify React state update: the checkbox should now be checked
  await page.waitForFunction(() => {
    const cb = document.querySelector('input[name="accept-terms"]') as HTMLInputElement;
    return cb?.checked === true;
  }, { timeout: 5000 });

  // Submit
  const submitButton = page.locator('button[type="submit"]').first();
  console.log('Submitting...');
  await submitButton.click();

  // Wait for response
  await page.waitForTimeout(5000);

  // Dump all logs
  console.log('=== ALL LOGS ===');
  for (const log of logs) {
    console.log(log);
  }

  // Dump failed requests
  console.log('=== FAILED REQUESTS ===');
  for (const fr of failedRequests) {
    console.log(`${fr.status} ${fr.url}`);
    console.log(`Body: ${fr.body}`);
  }

  // Current URL
  console.log('=== FINAL URL ===');
  console.log(page.url());

  // Check if user was created
  console.log('=== USER CREATED? (check by looking for toast/success message) ===');
});
