/**
 * Blog article cover image resolver.
 * Uses MangaAura brand assets and manga covers from the DB instead of external stock images.
 */

const BRAND = {
  /** MangaAura OG banner (landscape 1200x630) — best for article covers */
  og: '/og-image.webp',
  /** Main logo SVG — use for MangaAura platform articles */
  logo: '/MangaAura_logo.svg',
  /** Circular logo variant */
  logoCircular: '/MangaAura_logo_circular.svg',
} as const;

/**
 * Slug-specific cover assignments.
 * For articles about specific manga/anime, we try DB lookup first,
 * then fall back to these branded images.
 */
const SLUG_COVERS: Record<string, string> = {
  // === MangaAura platform articles ===
  'donde-leer-manga-online-gratis-legal-2026': BRAND.logo,
  'gamificacion-lectura-xp-logros-manga': BRAND.logo,
  'manga-vs-webtoon-diferencias-ventajas': BRAND.og,
  'guia-generos-manga-shonen-shojo-seinen': BRAND.og,
  'como-crear-tu-propio-manga-guia-completa': BRAND.og,
  'mejores-paginas-leer-manga-espanol': BRAND.og,
  'comunidad-manga-online-foros-clanes': BRAND.logoCircular,
  'manga-y-lectura-digital-beneficios': BRAND.og,

  // === Genre articles — will try DB manga cover first ===
  'mejor-manga-romance-2026': BRAND.og,
  'manga-seinen-recomendado': BRAND.og,
  'mejores-mangas-fantasia-epica': BRAND.og,
  'manga-terror-psicologico': BRAND.og,
  'manhwa-recomendado-2026': BRAND.og,
  'mejor-manga-accion-2026': BRAND.og,
  'webtoon-recomendado-2026': BRAND.og,
  'mejores-mangas-cortos': BRAND.og,
  'manga-aoi-superacion': BRAND.og,
  'manga-comedia-romance-recomendado': BRAND.og,
  'manga-isekai-recomendado': BRAND.og,
  'mejores-mangas-deporte': BRAND.og,
  'manga-slice-of-life': BRAND.og,
  'manga-drama-recomendado': BRAND.og,
  'mejor-manga-suspense': BRAND.og,
  'manga-shoujo-recomendado': BRAND.og,
  'manga-aventura-epica': BRAND.og,
  'mejores-manhwa-fantasia': BRAND.og,
  'manga-psicologico-recomendado': BRAND.og,

  // === Creator/tool articles ===
  'aplicaciones-dibujar-manga-pc-tablet': BRAND.og,
  'como-ganar-dinero-dibujando-manga-2026': BRAND.og,
  'mejores-plataformas-publicar-manga-online': BRAND.og,
  'crowdfunding-manga-como-funciona': BRAND.og,
  'herramientas-ia-crear-manga-2026': BRAND.og,
  'como-escribir-guion-manga': BRAND.og,
  'consejos-dibujo-digital-manga': BRAND.og,
};

/**
 * Get the best cover for an article — tries DB manga lookup first,
 * then falls back to the static slug map, then brand fallback.
 *
 * @param slug   Article slug
 * @param title  Article title (for DB manga matching)
 * @param excerpt Article excerpt (for DB manga matching)
 * @param prisma Optional PrismaClient instance for DB lookup
 */
export async function getArticleCover(
  slug: string,
  title?: string,
  excerpt?: string,
  prisma?: { mangaSeries: { findFirst: (args: unknown) => Promise<{ coverUrl: string | null } | null> } },
): Promise<string> {
  // 1. Try to find a matching manga from the DB based on article content
  if (prisma && (title || excerpt)) {
    const searchText = `${title ?? ''} ${excerpt ?? ''}`.toLowerCase();

    // Known manga title keywords we can search for in the DB
    const mangaKeywords = [
      'one piece', 'jujutsu', 'kaisen', 'berserk', 'naruto', 'dragon ball',
      'demon slayer', 'kimetsu', 'my hero academia', 'boku no hero',
      'attack on titan', 'shingeki', 'vinland saga', 'tokyo ghoul',
      'fullmetal alchemist', 'hagane no renkinjutsushi',
      'sailor moon', 'fruits basket', 'kimi ni todoke',
      'monster', 'death note', 'code geass', 'steins;gate',
      're:zero', 'mushoku tensei', 'konosuba',
      'evangelion', 'gundam', 'one punch man', 'mob psycho',
      'slam dunk', 'haikyuu', 'kuroko no basket',
      'spy x family', 'chainsaw man', 'dandadan',
      'solo leveling', 'tower of god', 'the god of high school',
      'horimiya', 'tonikaku kawaii', 'kaguya-sama',
      'made in abyss', 'promised neverland',
      'violet evergarden', 'your lie in april', 'shigatsu wa kimi no uso',
    ];

    for (const keyword of mangaKeywords) {
      if (searchText.includes(keyword)) {
        try {
          // Try to find a manga whose title contains this keyword
          const manga = await prisma.mangaSeries.findFirst({
            where: {
              title: { contains: keyword, mode: 'insensitive' },
              coverUrl: { not: null },
            },
            select: { coverUrl: true },
          });
          if (manga?.coverUrl) return manga.coverUrl;
        } catch {
          // DB lookup failed, try next keyword
          continue;
        }
      }
    }
  }

  // 2. Static slug map
  if (SLUG_COVERS[slug]) return SLUG_COVERS[slug];

  // 3. Ultimate brand fallback
  return BRAND.og;
}

// Legacy static map for backward compatibility (seed scripts that don't use async)
export const BLOG_COVERS: Record<string, string> = { ...SLUG_COVERS };
