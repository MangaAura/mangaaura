import { prisma } from '../src/lib/prisma.js';
import crypto from 'crypto';

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { startsWith: 'verifyflow-' } },
    orderBy: { createdAt: 'desc' },
  });

  if (!user) {
    console.log('No test user found');
    return;
  }

  console.log('User:', user.email);

  // Clear old tokens
  await prisma.verificationToken.deleteMany({
    where: { identifier: user.email },
  });

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
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
