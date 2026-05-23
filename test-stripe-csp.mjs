/**
 * Script de prueba: Verifica que Stripe Checkout funcione sin errores CSP
 *
 * 1. Crea una cuenta de prueba vía API
 * 2. Hace login
 * 3. Navega a /checkout
 * 4. Verifica que Stripe.js cargue sin bloqueos CSP
 * 5. Verifica headers CSP
 */

import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const TEST_USER = {
  username: `testuser_csp9238`,
  email: `testuser_csp9238@test.com`,
  password: 'TestPass123!',
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    // Capture all console messages
    // Ignore benign messages
  });

  // Track CSP violations and console errors
  const consoleErrors = [];
  const cspViolations = [];
  const allConsoleLogs = [];

  context.on('console', msg => {
    const text = msg.text();
    allConsoleLogs.push(`[${msg.type()}] ${text}`);
    
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
    
    // Check for CSP violations
    if (text.includes('Refused to') || 
        text.includes('Content Security Policy') ||
        text.includes('CSP')) {
      cspViolations.push(text);
    }
  });

  // Also listen for CSP violations via the Security panel
  context.on('page', page => {
    page.on('pageerror', err => {
      consoleErrors.push(`PAGE ERROR: ${err.message}`);
    });
  });

  const page = await context.newPage();

  try {
    // ========== STEP 1: Login with existing test account ==========
    console.log('\n=== STEP 1: Login with test account ===');
    await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle' });
    await sleep(1000);

    // Fill login form
    await page.fill('input#login-email', TEST_USER.email);
    await page.fill('input#login-password', TEST_USER.password);
    
    console.log('Filled login form, clicking submit...');
    const loginBtn = page.locator('button[type="submit"]');
    await loginBtn.click();
    
    // Wait for redirect after login
    await sleep(3000);
    console.log(`After login, URL: ${page.url()}`);
    
    // If login failed, try alternative credentials
    if (page.url().includes('/login')) {
      console.log('Login failed with first credentials, trying alternatives...');
      // Try other test accounts that were created in previous runs
      const alternatives = [
        { email: 'stripe_csp_test@test.com', pass: 'TestPass123!' },
        { email: 'test_csp_final@test.com', pass: 'TestPass123!' },
        { email: 'stripe_user_final@test.com', pass: 'TestPass123!' },
      ];
      for (const alt of alternatives) {
        console.log(`Trying ${alt.email}...`);
        await page.fill('input#login-email', alt.email);
        await page.fill('input#login-password', alt.pass);
        await loginBtn.click();
        await sleep(3000);
        if (!page.url().includes('/login')) {
          console.log(`Login successful with ${alt.email}!`);
          break;
        }
      }
    }

    // ========== STEP 3: Navigate to checkout ==========
    console.log('\n=== STEP 3: Navigate to /checkout ===');
    await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle', timeout: 15000 });
    await sleep(2000);
    console.log(`Checkout page URL: ${page.url()}`);

    // ========== STEP 4: Capture CSP Headers ==========
    console.log('\n=== STEP 4: CSP Headers ===');
    const response = await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' });
    if (response) {
      const csp = response.headers()['content-security-policy'];
      console.log('CSP Header:', csp?.substring(0, 500));
      
      // Check for required Stripe domains
      const checks = [
        { name: 'Stripe JS in script-src', pattern: /js\.stripe\.com/ },
        { name: 'Stripe API in connect-src', pattern: /api\.stripe\.com/ },
        { name: 'Stripe in frame-src', pattern: /js\.stripe\.com.*hooks\.stripe\.com/ },
        { name: 'Sentry in connect-src', pattern: /ingest\.sentry\.io/ },
        { name: 'blob: in img-src', pattern: /blob:/ },
        { name: "object-src 'none'", pattern: /object-src 'none'/ },
        { name: "worker-src 'self'", pattern: /worker-src 'self'/ },
        { name: "media-src 'self'", pattern: /media-src 'self'/ },
        { name: "'report-sample'", pattern: /report-sample/ },
      ];
      
      for (const check of checks) {
        const found = check.pattern.test(csp || '');
        console.log(`  ${found ? '✅' : '❌'} ${check.name}: ${found ? 'OK' : 'MISSING!'}`);
      }
    }

    // ========== STEP 5: Check for Stripe.js loading ==========
    console.log('\n=== STEP 5: Check Stripe.js requests ===');
    // Check for Stripe.js in loaded scripts
    const hasStripeRequest = allConsoleLogs.some(log => log.includes('stripe'));
    
    // Try to click a "Buy" button to trigger Stripe.js loading
    const buyButtons = page.locator('button:has-text("Comprar"), button:has-text("Buy"), button:has-text("checkout.buy")');
    const buyBtnCount = await buyButtons.count();
    console.log(`Found ${buyBtnCount} buy buttons`);

    // Click first buy button to trigger Stripe script loading
    if (buyBtnCount > 0) {
      console.log('Clicking buy button to trigger Stripe.js loading...');
      await buyButtons.first().click();
      await sleep(3000);
      
      // After clicking, Stripe should load - check for errors
      console.log(`Console errors after Stripe click: ${consoleErrors.length > 0 ? consoleErrors.join(' | ') : 'None'}`);
      console.log(`CSP violations: ${cspViolations.length > 0 ? cspViolations.join(' | ') : 'None ✅'}`);
    }

    // ========== RESULTS ==========
    console.log('\n========== FINAL RESULTS ==========');
    console.log(`Console errors total: ${consoleErrors.length}`);
    console.log(`CSP violations total: ${cspViolations.length}`);
    console.log(`All console logs: ${allConsoleLogs.length} messages`);

    if (cspViolations.length > 0) {
      console.log('\n❌ CSP VIOLATIONS FOUND:');
      cspViolations.forEach(v => console.log(`  - ${v}`));
    } else {
      console.log('\n✅ NO CSP VIOLATIONS DETECTED');
    }

    // Save full console log to file
    const logData = {
      url: page.url(),
      consoleErrors,
      cspViolations,
      allConsoleLogs: allConsoleLogs.slice(-50), // Last 50 messages
      user: TEST_USER,
    };
    fs.writeFileSync('test-stripe-results.json', JSON.stringify(logData, null, 2));
    console.log('\nResults saved to test-stripe-results.json');

    // Take screenshot
    await page.screenshot({ path: 'test-stripe-checkout.png', fullPage: true });
    console.log('Screenshot saved to test-stripe-checkout.png');

  } catch (err) {
    console.error('Test failed:', err);
    await page.screenshot({ path: 'test-stripe-error.png', fullPage: true });
  } finally {
    await sleep(2000);
    await browser.close();
  }
}

run().catch(console.error);
