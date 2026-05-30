import fs from 'fs';
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const results = {};

  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));

  // 1. Check homepage
  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    results.homepage = { status: page.url(), title: await page.title() };
    console.log(`✅ Homepage: ${page.url()}`);
  } catch (e) {
    results.homepage = { error: e.message };
    console.log(`❌ Homepage: ${e.message}`);
  }

  // 2. Navigate to register page
  try {
    await page.goto(`${BASE}/auth/register`, { waitUntil: 'networkidle', timeout: 30000 });
    results.registerPage = { status: page.url() };
    console.log(`✅ Register page: ${page.url()}`);
  } catch (e) {
    results.registerPage = { error: e.message };
  }

  // 3. Fill register form
  const timestamp = Date.now();
  const username = `test_auth_${timestamp}`;
  const email = `${username}@test.com`;
  const password = 'TestPass123!';
  console.log(`📝 Registering: ${username} / ${email}`);

  try {
    // Try filling by placeholder or label
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields on register page`);
    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder');
      const id = await input.getAttribute('id');
      const type = await input.getAttribute('type');
      console.log(`  Input: id=${id}, type=${type}, placeholder=${placeholder}`);
    }

    // Find and fill fields
    // Find and fill fields using Playwright's built-in text matching (case-insensitive by default with getByRole)
    const usernameInput = page.locator('input[id="register-username"]').first().or(page.getByPlaceholder(/usuari|username/i).first());
    const emailInput = page.locator('input[id="register-email"]').first().or(page.getByPlaceholder(/email|correo|mail/i).first());
    const passwordInput = page.locator('input[id="register-password"]').first().or(page.locator('input[type="password"]').first());
    const confirmInput = page.locator('input[id="register-confirm-password"]').first().or(page.getByPlaceholder(/confirm|repetir/i).first());
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    const submitBtn = page.getByRole('button', { name: /registrarme|crear cuenta|register|submit/i }).first().or(page.locator('button[type="submit"]').first());

    await usernameInput.fill(username);
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await confirmInput.fill(password);
    await termsCheckbox.check();
    
    // Take screenshot before submit
    await page.screenshot({ path: 'test-auth-before.png' });

    await submitBtn.click();
    console.log('✅ Register form submitted');
    await sleep(3000);
    
    const afterUrl = page.url();
    console.log(`📍 After register URL: ${afterUrl}`);
    results.registerSubmit = { url: afterUrl };
    
    // If redirected to login, we need to login manually
    if (afterUrl.includes('/auth/login') || afterUrl.includes('login')) {
      console.log('⚠️ Redirected to login page - auto-login after registration may not work, filling login form');
      results.registerAutoLogin = false;
      
      // Fill login form
      const loginEmail = page.locator('input[type="email"], input[name="email"]').first();
      const loginPassword = page.locator('input[type="password"]').first();
      const loginBtn = page.locator('button[type="submit"], button:has-text("iniciar" i), button:has-text("login" i)').first();
      
      await loginEmail.fill(email);
      await loginPassword.fill(password);
      await loginBtn.click();
      console.log('✅ Login form submitted');
      await sleep(3000);
      console.log(`📍 After login URL: ${page.url()}`);
      results.loginSubmit = { url: page.url() };
    } else {
      results.registerAutoLogin = true;
    }
  } catch (e) {
    console.log(`❌ Register/login error: ${e.message}`);
    results.registerError = e.message;
  }

  // 4. Check session by calling session API
  try {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`📍 On homepage: ${page.url()}`);
    
    // Try to get session data via the page
    const sessionResult = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        return { authenticated: !!data.user, user: data.user };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log(`📊 Session check: ${JSON.stringify(sessionResult)}`);
    results.session = sessionResult;
    
    // Check cookies
    const cookies = await context.cookies();
    results.cookies = cookies.map(c => ({ name: c.name, domain: c.domain, path: c.path, httpOnly: c.httpOnly, sameSite: c.sameSite }));
    
  } catch (e) {
    console.log(`❌ Session check error: ${e.message}`);
    results.sessionError = e.message;
  }

  // 5. Try to access /checkout (should redirect to login if not authenticated)
  try {
    await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`📍 Checkout page URL: ${page.url()}`);
    
    // Check if redirected to login
    if (page.url().includes('/auth/login')) {
      console.log('⚠️ /checkout redirected to login - session not recognized on checkout page');
      results.checkoutAccess = { status: 'redirected_to_login', url: page.url() };
    } else if (page.url().includes('/checkout')) {
      console.log('✅ On checkout page - authenticated!');
      results.checkoutAccess = { status: 'authenticated', url: page.url() };
    } else {
      console.log(`⚠️ Unexpected URL for checkout: ${page.url()}`);
      results.checkoutAccess = { status: 'unexpected', url: page.url() };
    }
  } catch (e) {
    console.log(`❌ Checkout access error: ${e.message}`);
    results.checkoutAccess = { error: e.message };
  }

  // 6. Check console for errors
  const cspErrors = consoleLogs.filter(l => l.text.includes('Refused to') || l.text.includes('CSP') || l.text.includes('Content Security Policy'));
  results.consoleErrors = consoleLogs.filter(l => l.type === 'error').map(l => l.text);
  results.cspErrors = cspErrors.map(l => l.text);

  results.consoleLogsSummary = {
    total: consoleLogs.length,
    errors: consoleLogs.filter(l => l.type === 'error').length,
    warnings: consoleLogs.filter(l => l.type === 'warning').length,
  };

  // Save results
  fs.writeFileSync('test-auth-results.json', JSON.stringify(results, null, 2));
  console.log('\n=== TEST COMPLETE ===');
  console.log(`Registration: ${results.registerAutoLogin ? '✅ Auto-login worked' : results.loginSubmit ? '✅ Login after registration worked' : '❌ Failed'}`);
  console.log(`Session auth: ${results.session?.authenticated ? '✅ Authenticated' : '❌ Not authenticated'}`);
  console.log(`Checkout access: ${results.checkoutAccess?.status}`);
  if (results.cspErrors?.length > 0) {
    console.log(`❌ CSP errors: ${results.cspErrors.length}`);
  } else {
    console.log('✅ No CSP errors');
  }

  await browser.close();
  console.log('Browser closed');
})();
