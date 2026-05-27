import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

    const chapters = await prisma.chapter.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        viewCount: true,
        createdAt: true,
        mangaId: true,
        manga: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverUrl: true,
            authorName: true,
          },
        },
      },
    });

    const newsArticles = await prisma.newsArticle.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverUrl: true,
        publishedAt: true,
        author: { select: { username: true } },
      },
    });

    const escapeXml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

    const items: string[] = [];

    for (const ch of chapters) {
      items.push(`    <item>
      <title>${escapeXml(ch.manga.title)} - Cap. ${ch.chapterNumber}${ch.title ? ': ' + escapeXml(ch.title) : ''}</title>
      <link>${escapeXml(siteUrl)}/manga/${escapeXml(ch.manga.slug)}/${ch.id}</link>
      <description>${escapeXml(`Nuevo capítulo de ${ch.manga.title}`)}</description>
      <guid isPermaLink="false">chapter-${ch.id}</guid>
      <pubDate>${new Date(ch.createdAt).toUTCString()}</pubDate>
      <author>${escapeXml(ch.manga.authorName || 'Anónimo')}</author>
      <category>Capítulo</category>
      <enclosure url="${escapeXml(ch.manga.coverUrl || siteUrl + '/og-image.png')}" type="image/jpeg" length="0"/>
    </item>`);
    }

    for (const article of newsArticles) {
      items.push(`    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(siteUrl)}/news/${article.slug}</link>
      <description>${escapeXml(article.excerpt)}</description>
      <guid isPermaLink="false">news-${article.id}</guid>
      <pubDate>${article.publishedAt ? new Date(article.publishedAt).toUTCString() : ''}</pubDate>
      <author>${escapeXml(article.author?.username || 'MangaAura')}</author>
      <category>Noticia</category>
    </item>`);
    }

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>MangaAura - Actualizaciones</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Últimos capítulos de manga y noticias en MangaAura</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/api/feed/rss" rel="self" type="application/rss+xml"/>
    <image>
      <url>${escapeXml(siteUrl)}/og-image.png</url>
      <title>MangaAura</title>
      <link>${escapeXml(siteUrl)}</link>
    </image>
${items.join('\n')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('RSS feed error:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
