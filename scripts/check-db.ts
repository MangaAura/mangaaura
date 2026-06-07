import { PrismaClient } from "../src/generated/prisma/client.js";
const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
async function main() {
  const users = await prisma.user.findMany({ take: 5, select: { id: true, username: true, email: true, role: true } });
  console.log('USERS:', JSON.stringify(users, null, 2));
  const articles = await prisma.newsArticle.findMany({ take: 5, select: { id: true, title: true, slug: true, isPublished: true } });
  console.log('ARTICLES:', JSON.stringify(articles, null, 2));
  await prisma.$disconnect();
}
main().catch(e => { console.error('ERROR:', e); process.exit(1); });
