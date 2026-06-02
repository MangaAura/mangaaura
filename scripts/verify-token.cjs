const crypto = require('crypto');
const path = require('path');

// Load .env.local
const fs = require('fs');
const envLocal = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const dbMatch = envLocal.match(/DATABASE_URL=([^\n]+)/);
process.env.DATABASE_URL = dbMatch ? dbMatch[1].trim() : '';

async function main() {
  const { PrismaClient } = require(path.join(__dirname, '..', 'src', 'generated', 'prisma', 'client.js'));
  const prisma = new PrismaClient();

  const user = await prisma.user.findFirst({
    where: { email: { startsWith: 'verifyflow-' } },
    orderBy: { createdAt: 'desc' },
  });

  if (!user) {
    console.log('No test user found');
    await prisma.$disconnect();
    return;
  }

  console.log('User:', user.email);

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      expires: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  console.log('TOKEN:', token);
  console.log('VERIFY_URL:', `http://localhost:3000/es/auth/verify?token=${token}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
