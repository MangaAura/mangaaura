// Try to register a user via the API endpoint, then save the session
const BASE = 'http://localhost:3000';

async function main() {
  const email = `csp_test_final_${Date.now()}@test.com`;
  const username = `csp_final_${Date.now()}`;
  
  // Step 1: Register via API
  console.log(`Registering: ${username} / ${email}`);
  
  const registerRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      password: 'TestPass123!',
    }),
  });
  
  const registerData = await registerRes.json();
  console.log('Register response:', registerRes.status, JSON.stringify(registerData));
  
  if (!registerRes.ok) {
    console.error('Registration failed');
    process.exit(1);
  }
  
  console.log(JSON.stringify({ username, email, password: 'TestPass123!' }));
}

main().catch(console.error);
