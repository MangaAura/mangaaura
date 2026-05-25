import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  console.log('Existing users:', count);

  const email = 'pw_csp_final@test.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('User exists:', JSON.stringify({ id: existing.id, username: existing.username }));
    return;
  }

  const passwordHash = await bcrypt.hash('TestPass123!', 12);
  const user = await prisma.user.create({
    data: {
      username: 'pw_csp_final',
      email,
      displayName: 'PW CSP Final',
      passwordHash,
      role: 'USER',
      xpPoints: 0,
      auraBalance: 100,
      level: 1,
    },
  });

  console.log('Created:', JSON.stringify({ id: user.id, username: user.username }));
}

main().catch(console.error).finally(() => prisma.$disconnect());
