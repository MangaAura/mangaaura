import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@mangaaura.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('Admin user already exists:', existing.id);
    return;
  }

  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const user = await prisma.user.create({
    data: {
      username: 'admin',
      email,
      displayName: 'MangaAura Admin',
      passwordHash,
      role: 'ADMIN',
      xpPoints: 0,
      inkcoinsBalance: 0,
      level: 1,
    },
  });

  console.log('Admin user created:', user.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
