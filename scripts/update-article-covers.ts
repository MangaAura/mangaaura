import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const W = 'w=800&h=450&fit=crop&auto=format';
const U = (id: string) => `https://images.unsplash.com/photo-${id}?${W}`;

/**
 * Category-based fallback covers.
 * Used when an article has no explicit coverUrl and no slug match in BLOG_COVERS.
 */
const CATEGORY_COVERS: Record<string, string> = {
  platform: U('1517694712202-14dd9538aa97'),   // laptop / tech
  community: U('1529156065264-49936e8a5dd5'),   // people / community
  tools: U('1460661419201-fd4cecdf8a8b'),       // drawing / creativity
  mobile: U('1512941937609-c9ea9696c20e'),      // phone / mobile
  contest: U('1499755312798-5a3f6fdde72b'),     // awards / competition
  comparison: U('1517245386807-bb43f82c33c4'),   // comparison / contrast
  features: U('1498050108023-c5249f4df085'),     // tablet / features
  technology: U('1518770660439-4636190af475'),    // tech / AI
  creator: U('1513364776144-60967b0f800f'),      // artist / creator
};

/**
 * Topic keyword → cover mapping for more specific matching.
 * Key namespace: lowercase keywords found in title/excerpt.
 */
const TOPIC_COVERS: Record<string, string> = {
  // Romance
  romance: U('1494979118697-1deb2bb55138'),
  amor: U('1494979118697-1deb2bb55138'),
  pareja: U('1494979118697-1deb2bb55138'),

  // Seinen / mature
  seinen: U('1532153975070-2e9ab71f1b14'),
  adulto: U('1532153975070-2e9ab71f1b14'),

  // Fantasy
  fantasia: U('1518709263855-3f8e6b71b9d3'),
  fantasy: U('1518709263855-3f8e6b71b9d3'),
  magia: U('1518709263855-3f8e6b71b9d3'),
  epica: U('1518709263855-3f8e6b71b9d3'),

  // Horror / terror / psychological
  terror: U('1509245312802-0c6ed7e8b97d'),
  horror: U('1509245312802-0c6ed7e8b97d'),
  psicologico: U('1434030216411-0b793f4b4173'),
  psychological: U('1434030216411-0b793f4b4173'),

  // Action
  accion: U('1487189343488-9ef409b9c3e3'),
  action: U('1487189343488-9ef409b9c3e3'),
  batalla: U('1487189343488-9ef409b9c3e3'),

  // Webtoon / manhwa
  webtoon: U('1521737604893-d14cc237f11d'),
  manhwa: U('1498050108023-c5249f4df085'),

  // Comedia / humor
  comedia: U('1456513080510-7bf3a84b82f8'),
  comedy: U('1456513080510-7bf3a84b82f8'),
  humor: U('1456513080510-7bf3a84b82f8'),

  // Isekai
  isekai: U('1513364776144-60967b0f800f'),

  // Deporte / sports
  deporte: U('1461891615477-2be42682f3f4'),
  sports: U('1461891615477-2be42682f3f4'),

  // Slice of life
  'slice-of-life': U('1499755312798-5a3f6fdde72b'),
  cotidiana: U('1499755312798-5a3f6fdde72b'),

  // Drama
  drama: U('1488192014695-8fabc3dfd5b0'),

  // Suspense / mystery
  suspense: U('1506905925346-21ef0ad8f3a9'),
  misterio: U('1506905925346-21ef0ad8f3a9'),
  mystery: U('1506905925346-21ef0ad8f3a9'),

  // Shoujo
  shoujo: U('1513295230947-9cb0c8adfcef'),
  shojo: U('1513295230947-9cb0c8adfcef'),

  // Adventure
  aventura: U('1501785888046-af2a7f4d6b3f'),
  adventure: U('1501785888046-af2a7f4d6b3f'),

  // Guion / writing
  guion: U('1455390588535-5b9c1b2a7b0e'),
  escribir: U('1455390588535-5b9c1b2a7b0e'),
  writing: U('1455390588535-5b9c1b2a7b0e'),

  // Dibujo / drawing
  dibujo: U('1460661419201-fd4cecdf8a8b'),
  drawing: U('1460661419201-fd4cecdf8a8b'),
  arte: U('1460661419201-fd4cecdf8a8b'),

  // Dinero / monetization
  dinero: U('1553729786-e1d9e2a7aa9f'),
  ganar: U('1553729786-e1d9e2a7aa9f'),
  monetizar: U('1553729786-e1d9e2a7aa9f'),
  crowdfunding: U('1553729786-e1d9e2a7aa9f'),

  // AI / tecnologia
  ia: U('1677442136019-21780ecad995'),
  ai: U('1677442136019-21780ecad995'),
  inteligencia: U('1677442136019-21780ecad995'),
  tecnologia: U('1677442136019-21780ecad995'),
  tech: U('1677442136019-21780ecad995'),

  // Gamificacion / reading
  gamificacion: U('1517694712202-14dd9538aa97'),
  xp: U('1517694712202-14dd9538aa97'),
  logros: U('1517694712202-14dd9538aa97'),
  levels: U('1517694712202-14dd9538aa97'),
  nivel: U('1517694712202-14dd9538aa97'),

  // Guide / tutorial / howto
  guia: U('1495446815901-a7297e633e8d'),
  guide: U('1495446815901-a7297e633e8d'),
  tutorial: U('1495446815901-a7297e633e8d'),
  'como ': U('1495446815901-a7297e633e8d'),
  diferencias: U('1517245386807-bb43f82c33c4'),
  vs: U('1517245386807-bb43f82c33c4'),

  // Lectura / reading
  leer: U('1523240795612-9a054b0db644'),
  lectura: U('1523240795612-9a054b0db644'),
  reading: U('1523240795612-9a054b0db644'),
  online: U('1523240795612-9a054b0db644'),
  plataforma: U('1523240795612-9a054b0db644'),
  platform: U('1523240795612-9a054b0db644'),

  // Comunidad / community
  comunidad: U('1529156065264-49936e8a5dd5'),
  community: U('1529156065264-49936e8a5dd5'),
  foros: U('1529156065264-49936e8a5dd5'),
  clanes: U('1529156065264-49936e8a5dd5'),

  // Recomendaciones / recommendations
  recomendado: U('1512820790803-83ca734da794'),
  mejores: U('1512820790803-83ca734da794'),
  best: U('1512820790803-83ca734da794'),

  // Cortos / short
  cortos: U('1512820790803-83ca734da794'),
  corto: U('1512820790803-83ca734da794'),

  // Superacion
  superacion: U('1507003211169-0a1dd7228f2d'),
};

/**
 * Find the best cover for an article based on its content.
 */
function resolveCover(article: { title: string; excerpt: string; category: string; slug: string }): string | null {
  const text = `${article.title} ${article.excerpt}`.toLowerCase();

  // 1. Try topic keyword match first (most specific)
  //    Uses word-boundary regex to avoid false positives from short keywords.
  for (const [keyword, url] of Object.entries(TOPIC_COVERS)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
    if (pattern.test(text)) {
      return url;
    }
  }

  // 2. Fall back to category-based cover
  const catUrl = CATEGORY_COVERS[article.category];
  if (catUrl) return catUrl;

  return CATEGORY_COVERS.platform; // ultimate fallback
}

async function main() {
  const articles = await prisma.newsArticle.findMany({
    select: { id: true, slug: true, title: true, excerpt: true, category: true, coverUrl: true },
  });

  if (articles.length === 0) {
    console.log('No articles found in database.');
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    if (article.coverUrl) {
      skipped++;
      continue;
    }

    const coverUrl = resolveCover(article);
    if (!coverUrl) {
      skipped++;
      continue;
    }

    await prisma.newsArticle.update({
      where: { id: article.id },
      data: { coverUrl },
    });

    console.log(`  ✓ ${article.slug} → ${coverUrl}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped (already had covers).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
