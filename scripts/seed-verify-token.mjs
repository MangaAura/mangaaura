import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';

async function main() {
  // Create a test user via the register API
  const email = `verifytest-${Date.now()}@example.com`;
  const username = `verifyuser${Date.now()}`;

  console.log(`Registering user: ${email} / ${username}`);

  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      username,
      password: 'TestPass123!',
    }),
  });

  const data = await res.json();
  console.log('Register status:', res.status);
  console.log('User ID:', data.user?.id);

  if (res.status === 201) {
    // The token is created by the server but we need to capture it.
    // The registration API creates the token via prisma.verificationToken.create()
    // but doesn't return it. We need a different approach.
    console.log('User registered. Token was stored in database by the server.');
    console.log('EMAIL:', email);
  }
}

main().catch(console.error);
