/**
 * Genera posts para redes sociales a partir de artículos del blog de MangaAura.
 *
 * Uso: npx tsx scripts/social/generate-posts.ts
 *
 * Salida: ./scripts/social/out/posts-[fecha].md listo para copiar y pegar
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

const templates: Record<string, (title: string, slug: string, excerpt: string) => string[]> = {
  tweet: (title, slug, excerpt) => [
    `📖 "${title}"\n\n${excerpt}\n\nLee el artículo completo 👇\n${BASE_URL}/blog/${slug}`,
    `¿Sabías que...? ${excerpt}\n\nEntra aquí para leer más: ${BASE_URL}/blog/${slug}`,
    `Nuevo en el blog de MangaAura 📝\n\n"${title}"\n\n${excerpt}\n${BASE_URL}/blog/${slug}`,
  ],
  thread: (title, slug, excerpt) => {
    const lines = excerpt.split('. ').filter(Boolean);
    const thread: string[] = [
      `🧵 ${title}\n\n${lines[0] || excerpt}`,
    ];
    for (let i = 1; i < Math.min(lines.length, 4); i++) {
      thread.push(lines[i]);
    }
    thread.push(`\nLee el artículo completo aquí 👇\n${BASE_URL}/blog/${slug}\n\n#Manga #MangaAura`);
    return thread;
  },
  instagram: (title, slug, excerpt) => [
    `📖 "${title}"\n\n${excerpt.slice(0, 200)}...\n\n👇 Lee más en MangaAura\n${BASE_URL}/blog/${slug}`,
  ],
};

async function main() {
  const articles = await prisma.newsArticle.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      publishedAt: true,
    },
  });

  if (articles.length === 0) {
    console.log('No hay artículos publicados.');
    await prisma.$disconnect();
    return;
  }

  const lines: string[] = [];
  lines.push('# Posts generados para redes sociales — MangaAura');
  lines.push(`# Fecha: ${new Date().toISOString().split('T')[0]}`);
  lines.push('');

  for (const article of articles) {
    const { title, slug, excerpt } = article;

    lines.push(`## ${title}`);
    lines.push(`Slug: ${slug}`);
    lines.push('');

    // Tweet
    lines.push('### Tweet (X)');
    const tweetOptions = templates.tweet(title, slug, excerpt);
    tweetOptions.forEach((t, i) => {
      lines.push(`Opción ${i + 1}:`);
      lines.push(t);
      lines.push('');
    });

    // Thread
    lines.push('### Hilo (X)');
    const thread = templates.thread(title, slug, excerpt);
    thread.forEach((t, i) => {
      lines.push(`[${i + 1}/${thread.length}] ${t}`);
      lines.push('');
    });

    lines.push('---');
    lines.push('');
  }

  const fs = await import('fs');
  const path = await import('path');
  const outDir = path.join(import.meta.dirname, 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const outFile = path.join(outDir, `posts-${dateStr}.md`);
  fs.writeFileSync(outFile, lines.join('\n'), 'utf-8');
  console.log(`✅ Posts generados: ${outFile}`);
  console.log(`   ${articles.length} artículos procesados`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
