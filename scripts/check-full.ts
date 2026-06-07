import { PrismaClient } from "../src/generated/prisma/client.js";
const { PrismaPg } = require("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
async function main() {
  const manga = await prisma.mangaSeries.findMany({ take: 5, select: { id: true, title: true, slug: true, status: true } });
  console.log('MANGA:', JSON.stringify(manga, null, 2));
  const chapters = await prisma.chapter.findMany({ take: 5, select: { id: true, chapterNumber: true, mangaId: true } });
  console.log('CHAPTERS:', JSON.stringify(chapters, null, 2));
  const genres = await prisma.genre.findMany({ take: 10, select: { id: true, name: true, slug: true } });
  console.log('GENRES:', JSON.stringify(genres, null, 2));
  const achievements = await prisma.achievementDefinition.findMany({ take: 10, select: { id: true, name: true, slug: true } });
  console.log('ACHIEVEMENTS:', JSON.stringify(achievements, null, 2));
  await prisma.$disconnect();
}
main().catch(e => { console.error('ERROR:', e); process.exit(1); });
