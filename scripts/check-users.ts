import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  console.log('Total users:', count);
  
  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, email: true, username: true },
  });
  
  console.log('Users:', JSON.stringify(users));
}

main().catch(console.error).finally(() => prisma.$disconnect());
