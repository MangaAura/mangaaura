import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const genreSeeds = [
  { name: "acción", slug: "accion" },
  { name: "aventura", slug: "aventura" },
  { name: "ciencia ficción", slug: "ciencia-ficcion" },
  { name: "comedia", slug: "comedia" },
  { name: "escolar", slug: "escolar" },
  { name: "fantasía", slug: "fantasia" },
  { name: "magia", slug: "magia" },
  { name: "mecha", slug: "mecha" },
  { name: "misterio", slug: "misterio" },
  { name: "oscuro", slug: "oscuro" },
  { name: "policíaco", slug: "policiaco" },
  { name: "robots", slug: "robots" },
  { name: "romance", slug: "romance" },
  { name: "slice of life", slug: "slice-of-life" },
  { name: "suspenso", slug: "suspenso" },
];

async function main() {
  console.log("📂 Sembrando géneros...");
  for (const genre of genreSeeds) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: {},
      create: genre,
    });
  }
  console.log(`✅ ${genreSeeds.length} géneros sembrados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
