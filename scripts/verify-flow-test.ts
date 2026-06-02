/**
 * Complete verification flow test
 * 
 * Tests the full flow:
 * 1. Register a new user via /api/auth/register (POST)
 * 2. Retrieve the verification token from the database
 * 3. Verify via GET /api/auth/verify?token=xxx
 * 4. Verify via POST /api/auth/verify (with { token: "xxx" })
 * 5. Confirm user.emailVerified is set
 * 6. Clean up: delete the test user
 */

import { prisma } from '../src/lib/prisma';
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const TEST_EMAIL = `verifyflow-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@test.mangaaura.com`;
const TEST_USERNAME = `verifyflow-${Date.now().toString(36)}`;
const TEST_PASSWORD = 'TestPassword123!@#';

interface ApiResponse {
  status: number;
  body: any;
}

async function api(method: string, path: string, body?: any): Promise<ApiResponse> {
  const url = `${BASE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(url, options);
  const text = await res.text();
  let parsedBody: any;
  try {
    parsedBody = JSON.parse(text);
  } catch {
    parsedBody = { raw: text };
  }
  
  return { status: res.status, body: parsedBody };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function main() {
  console.log('='.repeat(70));
  console.log('🧪 COMPLETE VERIFICATION FLOW TEST');
  console.log('='.repeat(70));
  console.log();
  console.log(`Test email:    ${TEST_EMAIL}`);
  console.log(`Test username: ${TEST_USERNAME}`);
  console.log(`Base URL:      ${BASE_URL}`);
  console.log();

  // ── Step 1: Register a new user ──────────────────────────────────
  console.log('─'.repeat(50));
  console.log('STEP 1: Register a new user');
  console.log('─'.repeat(50));

  const registerRes = await api('POST', '/api/auth/register', {
    email: TEST_EMAIL,
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
  });

  assert(registerRes.status === 201, `Register API returns 201 (got ${registerRes.status})`);
  assert(registerRes.body.user?.email === TEST_EMAIL, 'User email matches');
  assert(registerRes.body.user?.username === TEST_USERNAME, 'Username matches');
  assert(registerRes.body.message === 'Usuario registrado exitosamente', 'Success message is correct');
  
  const userId = registerRes.body.user.id;
  console.log(`  User ID: ${userId}`);
  console.log();

  // ── Step 2: Retrieve verification token from database ─────────────
  console.log('─'.repeat(50));
  console.log('STEP 2: Get verification token from database');
  console.log('─'.repeat(50));

  // Wait a moment for the fire-and-forget DB write to complete
  await new Promise(r => setTimeout(r, 2000));

  const verificationToken = await prisma.verificationToken.findFirst({
    where: { identifier: TEST_EMAIL },
    orderBy: { expires: 'desc' },
  });

  assert(verificationToken !== null, 'Verification token exists in database');
  assert(verificationToken!.token.length > 0, 'Token is not empty');
  assert(new Date(verificationToken!.expires) > new Date(), 'Token has not expired');
  assert(verificationToken!.identifier === TEST_EMAIL, 'Token identifier matches user email');

  const token = verificationToken!.token;
  
  // Also check that the user is NOT verified yet
  const userBeforeVerify = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
    select: { emailVerified: true },
  });
  assert(userBeforeVerify?.emailVerified === null, 'User email is NOT verified before verification');

  console.log(`  Token: ${token.substring(0, 16)}...`);
  console.log(`  Verify URL: ${BASE_URL}/auth/verify?token=${token}`);
  console.log();

  // ── Step 3: Verify via GET endpoint ────────────────────────────────
  console.log('─'.repeat(50));
  console.log('STEP 3: Verify via GET /api/auth/verify?token=xxx');
  console.log('─'.repeat(50));

  const verifyGetRes = await api('GET', `/api/auth/verify?token=${encodeURIComponent(token)}`);
  
  assert(verifyGetRes.status === 200, `GET verify returns 200 (got ${verifyGetRes.status})`);
  assert(verifyGetRes.body.message === 'Email verificado exitosamente', 'Success message is correct');

  // Check user is now verified after GET
  const userAfterGet = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
    select: { emailVerified: true },
  });
  assert(userAfterGet?.emailVerified !== null, 'User email IS verified after GET verification');

  console.log(`  emailVerified: ${userAfterGet!.emailVerified}`);
  console.log();

  // ── Step 4: Verify via POST endpoint ───────────────────────────────
  console.log('─'.repeat(50));
  console.log('STEP 4: Verify via POST /api/auth/verify (token already consumed)');
  console.log('─'.repeat(50));

  // After successful GET verification, the token should have been deleted.
  // POST with the same token should return 400.
  const verifyPostRes = await api('POST', '/api/auth/verify', { token });

  assert(verifyPostRes.status === 400, `POST verify returns 400 for consumed token (got ${verifyPostRes.status})`);
  
  // Check error message (should say token invalid/expired since it was deleted)
  const possibleErrors = ['Token inválido o expirado'];
  const errorMatches = possibleErrors.some(e => verifyPostRes.body.error?.includes(e));
  assert(errorMatches, `Error message indicates token is consumed: "${verifyPostRes.body.error}"`);
  console.log();

  // ── Step 5: Verify re-verification with fresh token ────────────────
  console.log('─'.repeat(50));
  console.log('STEP 5: Re-verify with a fresh token (already verified user)');
  console.log('─'.repeat(50));

  // Create a fresh token for the already-verified user
  const crypto = await import('crypto');
  const freshToken = crypto.default.randomBytes(32).toString('hex');
  await prisma.verificationToken.create({
    data: {
      identifier: TEST_EMAIL,
      token: freshToken,
      expires: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  const reVerifyRes = await api('GET', `/api/auth/verify?token=${encodeURIComponent(freshToken)}`);

  assert(reVerifyRes.status === 200, `Re-verify returns 200 for already verified user (got ${reVerifyRes.status})`);
  assert(reVerifyRes.body.message === 'El email ya fue verificado', 'Message indicates email was already verified');

  // Verify the fresh token was deleted
  const deletedToken = await prisma.verificationToken.findUnique({
    where: { token: freshToken },
  });
  assert(deletedToken === null, 'Fresh token was deleted after re-verification');
  console.log();

  // ── Summary ────────────────────────────────────────────────────────
  console.log('='.repeat(70));
  console.log('✅ ALL TESTS PASSED');
  console.log('='.repeat(70));
  console.log(`
Test Summary:
  ✓ Registration: User created successfully (201)
  ✓ Token: Verification token stored in database
  ✓ GET Verify: Token consumed, emailVerified set (200)
  ✓ POST Verify: Returns error for consumed token (400)
  ✓ Re-verify: Already-verified user returns success with "ya fue verificado"
  ✓ Token cleanup: Tokens deleted after use
  `);
}

main()
  .catch((e) => {
    console.error('\n❌ TEST FAILED:', e.message);
    console.error(e.stack);
    process.exit(1);
  })
  .finally(async () => {
    // Clean up: remove test user
    try {
      // Delete verification tokens for the test email
      await prisma.verificationToken.deleteMany({
        where: { identifier: TEST_EMAIL },
      });
      
      // Delete the test user (cascades to all related records)
      await prisma.user.deleteMany({
        where: { email: TEST_EMAIL },
      });

      console.log('🧹 Cleanup complete: test user and tokens removed.');
    } catch (e) {
      console.error('⚠️  Cleanup warning:', e instanceof Error ? e.message : e);
    }
    
    await prisma.$disconnect();
  });
