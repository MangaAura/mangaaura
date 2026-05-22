import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const genres = await prisma.genre.findMany({ orderBy: { name: "asc" } });
  console.log("Total genres:", genres.length);
  for (const g of genres) {
    console.log(`  - ${g.slug} (${g.name})`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
