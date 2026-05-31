import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXTAUTH_URL || 'https://mangaaura.es';

/**
 * XML-escapes a string for safe inclusion in XML output.
 */
function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    // Google News Sitemap requirement: only articles from the last 48 hours
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const articles = await prisma.newsArticle.findMany({
      where: {
        isPublished: true,
        publishedAt: {
          not: null,
          gte: fortyEightHoursAgo,
        },
      },
      select: {
        slug: true,
        title: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 1000,
    });

    const urlEntries = articles
      .filter((a): a is typeof a & { publishedAt: Date } => a.publishedAt !== null)
      .map((article) => {
        const pubDate = article.publishedAt;
        const [year, month] = pubDate.toISOString().split('T')[0].split('-');
        const canonical = `/news/${year}/${month}/${article.slug}`;
        const pubDateIso = pubDate.toISOString();

        return `  <url>
    <loc>${xmlEscape(BASE_URL + canonical)}</loc>
    <news:news>
      <news:publication>
        <news:name>MangaAura</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${xmlEscape(pubDateIso)}</news:publication_date>
      <news:title>${xmlEscape(article.title)}</news:title>
    </news:news>
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlEntries || '  <!-- No news articles from the last 48 hours -->'}
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    // Return an empty sitemap on error so Google doesn't get a 500
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`;

    return new NextResponse(emptyXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'X-Robots-Tag': 'noindex',
      },
    });
  }
}
