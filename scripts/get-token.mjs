import { readFileSync } from 'fs';
import { createRequire } from 'module';

// Read DATABASE_URL from .env.local
const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const match = envContent.match(/DATABASE_URL="?([^"\n]+)/);
process.env.DATABASE_URL = match ? match[1] : '';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../src/generated/prisma/client.js');
const prisma = new PrismaClient();

try {
  const tokens = await prisma.verificationToken.findMany({
    where: { identifier: { startsWith: 'verifyflow-' } },
    orderBy: { expires: 'desc' },
    take: 1,
  });
  
  if (tokens.length > 0) {
    console.log('TOKEN:', tokens[0].token);
    console.log('VERIFY_URL:', `http://localhost:3000/es/auth/verify?token=${tokens[0].token}`);
  } else {
    console.log('No tokens found');
  }
} finally {
  await prisma.$disconnect();
}
