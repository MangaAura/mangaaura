import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Find a recently created test user
  const user = await prisma.user.findFirst({
    where: { email: { startsWith: 'verifyflow-' } },
    orderBy: { createdAt: 'desc' },
  });

  if (!user) {
    console.log('No test user found. Register one first.');
    await prisma.$disconnect();
    return;
  }

  console.log('User:', user.email);

  // Create a fresh verification token
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
  console.error(e);
  prisma.$disconnect();
});
