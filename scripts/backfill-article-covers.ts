import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";
import { BLOG_COVERS } from "./data/blog-covers.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Buscando artículos sin coverUrl...");
  const articles = await prisma.newsArticle.findMany({
    where: { coverUrl: null },
    select: { id: true, slug: true, title: true },
  });

  console.log(`Encontrados ${articles.length} artículos sin cover.`);

  let updated = 0;
  for (const article of articles) {
    const coverUrl = BLOG_COVERS[article.slug];
    if (!coverUrl) {
      console.log(`  ✗ Sin cover mapeado: "${article.title}" (${article.slug})`);
      continue;
    }
    await prisma.newsArticle.update({
      where: { id: article.id },
      data: { coverUrl },
    });
    console.log(`  ✓ Actualizado: "${article.title}"`);
    updated++;
  }

  console.log(`\n✅ ${updated} artículos actualizados con coverUrl.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
