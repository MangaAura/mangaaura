/**
 * Unified display model used by the news UI.
 * All articles come from the database.
 */
export interface DisplayNewsItem {
  id: string;
  slug: string;
  category: string;
  title: string;              // Spanish text
  description: string;        // Spanish excerpt
  body?: string;              // Spanish content
  titleEn?: string | null;       // English text
  descriptionEn?: string | null; // English excerpt
  bodyEn?: string | null;        // English content
  iconType: string;
  date: string;
  coverUrl: string | null;
  isFeatured: boolean;
  authorName?: string | null;
  authorUsername?: string | null;
}

/** Predefined mapping from category → iconType */
export const categoryIconMap: Record<string, string> = {
  platform: 'platform',
  community: 'community',
  tools: 'tools',
  mobile: 'mobile',
  contest: 'contest',
};

/** Override icon type based on the article's own iconType if it differs from category */
export function resolveIconType(category: string, articleIconType?: string | null): string {
  return articleIconType || categoryIconMap[category] || category;
}

/** Convert a DB article (from API or Prisma) into a DisplayNewsItem */
export function dbArticleToDisplayItem(
  dbArticle: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content?: string;
    titleEn?: string | null;
    excerptEn?: string | null;
    contentEn?: string | null;
    coverUrl: string | null;
    category: string;
    publishedAt: Date | string | null;
    createdAt: Date | string;
    isFeatured?: boolean;
    author?: {
      displayName?: string | null;
      username?: string | null;
    } | null;
  },
): DisplayNewsItem {
  const fmtDate = (d: Date | string) =>
    typeof d === 'string' ? d.split('T')[0] : d.toISOString().split('T')[0];
  const dateStr = dbArticle.publishedAt
    ? fmtDate(dbArticle.publishedAt)
    : fmtDate(dbArticle.createdAt);
  // Always store Spanish in title/description/body; English in titleEn/descriptionEn/bodyEn.
  // Client components pick the right language based on useLocale().
  return {
    id: dbArticle.id,
    slug: dbArticle.slug,
    category: dbArticle.category,
    title: dbArticle.title,
    description: dbArticle.excerpt,
    body: dbArticle.content ?? undefined,
    titleEn: dbArticle.titleEn ?? null,
    descriptionEn: dbArticle.excerptEn ?? null,
    bodyEn: dbArticle.contentEn ?? null,
    iconType: resolveIconType(dbArticle.category),
    date: dateStr,
    coverUrl: dbArticle.coverUrl,
    isFeatured: dbArticle.isFeatured ?? false,
    authorName: dbArticle.author?.displayName || dbArticle.author?.username || null,
    authorUsername: dbArticle.author?.username || null,
  };
}

/** Build the article detail URL from a DisplayNewsItem */
export function getArticlePath(article: DisplayNewsItem): string {
  const [year, month] = article.date.split('-');
  return `/news/${year}/${month}/${article.slug}`;
}
