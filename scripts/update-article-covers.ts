/**
 * Assign cover images to articles that don't have one.
 * Uses MangaAura brand assets and manga covers from the database — no external stock imagery.
 */

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Available MangaAura brand assets ──────────────────────────────
const BRAND = {
  og: '/og-image.webp',
  logo: '/MangaAura_logo.svg',
  logoCircular: '/MangaAura_logo_circular.svg',
} as const;

/**
 * Category-based fallback covers — all using MangaAura brand identity.
 */
const CATEGORY_COVERS: Record<string, string> = {
  platform: BRAND.logo,
  community: BRAND.logoCircular,
  tools: BRAND.og,
  mobile: BRAND.logoCircular,
  contest: BRAND.logo,
  comparison: BRAND.og,
  features: BRAND.logo,
  technology: BRAND.og,
  creator: BRAND.logoCircular,
};

/**
 * Topic keyword → cover mapping using MangaAura brand assets.
 * No stock photos — all project-branded imagery.
 */
const TOPIC_COVERS: Record<string, string> = {
  // MangaAura platform
  mangaaura: BRAND.logo,
  'manga aura': BRAND.logo,
  plataforma: BRAND.logo,
  gamificacion: BRAND.logo,
  xp: BRAND.logo,
  logros: BRAND.logo,
  niveles: BRAND.logo,
  nivel: BRAND.logo,
  clanes: BRAND.logoCircular,
  clan: BRAND.logoCircular,
  ranking: BRAND.logoCircular,
  aura: BRAND.logo,

  // Reading / platform
  leer: BRAND.og,
  lectura: BRAND.og,
  online: BRAND.og,
  legal: BRAND.og,
  gratis: BRAND.og,

  // Community
  comunidad: BRAND.logoCircular,
  foros: BRAND.logoCircular,
  social: BRAND.logoCircular,

  // Guides / tutorials
  guia: BRAND.og,
  guía: BRAND.og,
  tutorial: BRAND.og,
  como: BRAND.og,
  diferencias: BRAND.og,

  // Writing / creating
  crear: BRAND.og,
  dibujar: BRAND.og,
  dibujo: BRAND.og,
  arte: BRAND.og,
  guion: BRAND.og,
  escribir: BRAND.og,
  publicar: BRAND.og,

  // Monetization
  dinero: BRAND.og,
  ganar: BRAND.og,
  crowdfunding: BRAND.og,
  monetizar: BRAND.og,

  // Comparisons
  'vs ': BRAND.og,
  comparativa: BRAND.og,
  comparison: BRAND.og,

  // AI / tech
  inteligencia: BRAND.og,
  tecnologia: BRAND.og,
  tech: BRAND.og,
  herramientas: BRAND.og,
  ia: BRAND.og,

  // Contest / competitions
  concurso: BRAND.logo,
  competencia: BRAND.logo,
  competencia: BRAND.logo,
  torneo: BRAND.logo,
};

/**
 * Find the best cover for an article.
 * Strategy: manga DB lookup → topic keyword match → category → brand fallback.
 */
async function resolveCover(article: {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  slug: string;
}): Promise<string | null> {
  const text = `${article.title} ${article.excerpt}`.toLowerCase();

  // 1. Try to find a matching manga cover from the database
  const mangaTitles = [
    'one piece', 'jujutsu kaisen', 'berserk', 'naruto', 'naruto shippuden',
    'dragon ball', 'demon slayer', 'kimetsu no yaiba',
    'my hero academia', 'boku no hero academia',
    'attack on titan', 'shingeki no kyojin',
    'vinland saga', 'tokyo ghoul', 'fullmetal alchemist',
    'sailor moon', 'fruits basket',
    'death note', 'code geass', 'one punch man',
    'slam dunk', 'haikyuu', 'spy x family',
    'chainsaw man', 'solo leveling', 'tower of god',
    'horimiya', 'kaguya-sama', 'made in abyss',
    'promised neverland', 'violet evergarden',
  ];

  for (const mangaTitle of mangaTitles) {
    if (text.includes(mangaTitle)) {
      try {
        const manga = await prisma.mangaSeries.findFirst({
          where: {
            title: { contains: mangaTitle, mode: 'insensitive' },
            coverUrl: { not: null },
          },
          select: { coverUrl: true },
        });
        if (manga?.coverUrl) return manga.coverUrl;
      } catch {
        // DB error — try next manga title instead of aborting
        continue;
      }
    }
  }

  // 2. Topic keyword match (brand assets)
  for (const [keyword, url] of Object.entries(TOPIC_COVERS)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
    if (pattern.test(text)) {
      return url;
    }
  }

  // 3. Category-based fallback
  const catUrl = CATEGORY_COVERS[article.category];
  if (catUrl) return catUrl;

  // 4. Ultimate fallback
  return BRAND.og;
}

async function main() {
  const articles = await prisma.newsArticle.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      coverUrl: true,
    },
  });

  if (articles.length === 0) {
    console.log('No articles found in database.');
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    // Skip articles that already have a project-based cover (not Unsplash)
    if (article.coverUrl && !article.coverUrl.includes('unsplash')) {
      skipped++;
      continue;
    }

    const coverUrl = await resolveCover(article);
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

  console.log(
    `\nDone: ${updated} updated, ${skipped} skipped (already had non-Unsplash covers).`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
