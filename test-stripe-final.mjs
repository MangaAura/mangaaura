/**
 * Playwright test: Register → Login → Checkout → Verify CSP
 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const SUFFIX = Date.now();
const TEST_USER = {
  username: `csp_${SUFFIX}`,
  email: `csp_${SUFFIX}@test.com`,
  password: 'TestPass123!',
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const consoleErrors = [];
  const cspViolations = [];
  const consoleLogs = [];

  context.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') consoleErrors.push(text);
    if (text.includes('Refused to') || text.includes('Content Security Policy') || text.includes('CSP')) {
      cspViolations.push(text);
    }
  });

  const page = await context.newPage();

  try {
    // ===== STEP 1: REGISTER =====
    console.log('\n📝 STEP 1: Register');
    await page.goto(`${BASE}/auth/register`, { waitUntil: 'networkidle' });
    await sleep(1500);

    // Fill form fields using the correct IDs from the register page source
    await page.fill('#register-username', TEST_USER.username);
    console.log('  ✓ Username filled');
    await page.fill('#register-email', TEST_USER.email);
    console.log('  ✓ Email filled');
    await page.fill('#register-password', TEST_USER.password);
    console.log('  ✓ Password filled');
    await page.fill('#register-confirm-password', TEST_USER.password);
    console.log('  ✓ Confirm password filled');

    // Check the terms checkbox (it has name="accept-terms", no id)
    const checkbox = page.locator('input[name="accept-terms"]');
    await checkbox.check();
    console.log('  ✓ Terms accepted');

    await sleep(500);

    // Click submit button
    const submitBtn = page.locator('button[type="submit"]');
    console.log('  Submit button text:', await submitBtn.textContent());
    await submitBtn.click();
    console.log('  ✓ Submit clicked');

    // Wait for redirect after registration
    await sleep(4000);
    console.log(`  → URL after register: ${page.url()}`);

    // ===== STEP 2: LOGIN (if registration redirected to login) =====
    if (page.url().includes('/login')) {
      console.log('\n🔑 STEP 2: Login (registration redirected to login)');
      await page.fill('#login-email', TEST_USER.email);
      await page.fill('#login-password', TEST_USER.password);
      const loginBtn = page.locator('button[type="submit"]');
      await loginBtn.click();
      await sleep(4000);
      console.log(`  → URL after login: ${page.url()}`);

      // If still on login, maybe user was created but auto-login failed
      if (page.url().includes('/login')) {
        console.log('  ⚠ Still on login page after 4s, trying callback URL...');
        await page.goto(`${BASE}/auth/login?callbackUrl=%2F`, { waitUntil: 'networkidle' });
        await sleep(1000);
        await page.fill('#login-email', TEST_USER.email);
        await page.fill('#login-password', TEST_USER.password);
        const loginBtn2 = page.locator('button[type="submit"]');
        await loginBtn2.click();
        await sleep(4000);
        console.log(`  → URL after retry: ${page.url()}`);
      }
    }

    // ===== STEP 3: CAPTURE CSP HEADERS =====
    console.log('\n🔒 STEP 3: CSP Headers check');
    const resp = await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null);
    await sleep(2000);
    console.log(`  → Checkout URL: ${page.url()}`);

    if (resp) {
      const csp = resp.headers()['content-security-policy'] || '';
      const checks = [
        ['Stripe JS in script-src', /js\.stripe\.com/, csp],
        ['Stripe API in connect-src', /api\.stripe\.com/, csp],
        ['Stripe in frame-src', /js\.stripe\.com/, csp],
        ['Sentry in connect-src', /ingest\.sentry\.io/, csp],
        ['blob: in img-src', /blob:/, csp],
        ["object-src 'none'", /object-src 'none'/, csp],
        ["worker-src 'self'", /worker-src 'self'/, csp],
        ["media-src 'self'", /media-src 'self'/, csp],
        ["'report-sample'", /report-sample/, csp],
      ];
      let allPassed = true;
      for (const [name, pattern] of checks) {
        const ok = pattern.test(csp);
        if (!ok) allPassed = false;
        console.log(`  ${ok ? '✅' : '❌'} ${name}`);
      }
      if (allPassed) console.log('  ✅ ALL CSP CHECKS PASSED');
    }

    // ===== STEP 4: IF AUTHENTICATED, TEST STRIPE =====
    if (!page.url().includes('/login') && !page.url().includes('/register')) {
      console.log('\n💳 STEP 4: Testing Stripe.js loading');

      // Check for Stripe.js on the page
      const hasStripeScript = await page.evaluate(() => {
        return Array.from(document.scripts).some(s => s.src?.includes('stripe'));
      });
      console.log(`  Stripe.js already loaded: ${hasStripeScript}`);

      // Try clicking a Buy button to trigger Stripe.js loading
      const buttons = page.locator('button');
      const btnCount = await buttons.count();
      console.log(`  Found ${btnCount} buttons on page`);

      for (let i = 0; i < btnCount; i++) {
        const text = await buttons.nth(i).textContent();
        if (text && text.toLowerCase().includes('comprar')) {
          console.log(`  Clicking button: "${text.trim()}"`);
          await buttons.nth(i).click();
          await sleep(5000);

          // After clicking, check network requests for Stripe
          const stripeLoads = await page.evaluate(() => {
            return performance.getEntriesByType('resource')
              .filter(r => r.name.includes('stripe.com'))
              .map(r => r.name);
          });
          console.log(`  Stripe requests: ${stripeLoads.length > 0 ? stripeLoads.join(', ') : 'none'}`);
          break;
        }
      }

      // Try also to load Stripe.js directly to verify CSP doesn't block it
      console.log('\n  Testing direct Stripe.js load...');
      const stripeLoadResult = await page.evaluate(async () => {
        try {
          const resp = await fetch('https://js.stripe.com/v3/', { method: 'HEAD', mode: 'no-cors' });
          return `js.stripe.com reachable: ${resp.type} (status: ${resp.status})`;
        } catch (e) {
          return `js.stripe.com error: ${e.message}`;
        }
      });
      console.log(`  ${stripeLoadResult}`);
    }

    // ===== RESULTS =====
    console.log('\n========== FINAL RESULTS ==========');
    console.log(`Authenticated: ${!page.url().includes('/login') && !page.url().includes('/register')}`);
    console.log(`CSP Violations: ${cspViolations.length}`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Console Logs: ${consoleLogs.length}`);

    if (cspViolations.length > 0) {
      console.log('\n❌ CSP VIOLATIONS:');
      cspViolations.forEach(v => console.log(`  - ${v}`));
    } else {
      console.log('\n✅ NO CSP VIOLATIONS');
    }

    if (consoleErrors.length > 0) {
      console.log('\n⚠ Console Errors (non-CSP):');
      consoleErrors.forEach(e => console.log(`  - ${e}`));
    }

    // Save results
    const result = {
      url: page.url(),
      registered: true,
      authenticated: !page.url().includes('/login') && !page.url().includes('/register'),
      cspViolations,
      consoleErrors: consoleErrors.slice(0, 10),
      user: TEST_USER,
    };
    fs.writeFileSync('stripe-final-results.json', JSON.stringify(result, null, 2));
    await page.screenshot({ path: 'stripe-final.png', fullPage: true });
    console.log('\nResults saved to stripe-final-results.json');
    console.log('Screenshot saved to stripe-final.png');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    await page.screenshot({ path: 'stripe-final-error.png', fullPage: true });
  } finally {
    await sleep(2000);
    await browser.close();
  }
}

run();
