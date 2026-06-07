import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// Runtime: node (fetch to Discord webhook)
export const runtime = 'nodejs';
export const maxDuration = 30;

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';
const CRON_SECRET = process.env.CRON_SECRET;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

async function sendToDiscord(content: string, embeds: unknown[]) {
  if (!WEBHOOK_URL) return { sent: false, reason: 'no webhook URL' };

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      embeds,
      username: 'MangaAura',
      avatar_url: `${SITE_URL}/icons/icon-192x192.png`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Cron Discord] Error ${res.status}: ${text}`);
    return { sent: false, reason: text };
  }

  return { sent: true };
}

export async function GET(request: Request) {
  // Auth: CRON_SECRET en query param o header
  const { searchParams } = new URL(request.url);
  const auth = searchParams.get('secret') || request.headers.get('x-cron-secret');
  if (CRON_SECRET && auth !== CRON_SECRET) return unauthorized();

  const results: string[] = [];

  // 1. Último artículo del blog
  const article = await prisma.newsArticle.findFirst({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    select: { title: true, slug: true, excerpt: true, coverUrl: true, category: true, publishedAt: true },
  });

  if (article) {
    const embed: Record<string, unknown> = {
      title: article.title,
      description: (article.excerpt || '').slice(0, 300),
      url: `${SITE_URL}/blog/${article.slug}`,
      color: 0x6366f1,
      fields: [
        { name: '📂 Categoría', value: article.category, inline: true },
      ],
      footer: { text: 'MangaAura — Blog' },
      timestamp: article.publishedAt?.toISOString() || new Date().toISOString(),
    };
    if (article.coverUrl) embed.image = { url: article.coverUrl };

    const r = await sendToDiscord('📖 **Nuevo artículo en el blog**', [embed]);
    results.push(`article: ${r.sent ? 'ok' : 'fail: ' + r.reason}`);
  }

  // 2. Últimos capítulos
  const chapters = await prisma.chapter.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      chapterNumber: true,
      title: true,
      createdAt: true,
      manga: { select: { title: true, slug: true, coverUrl: true } },
    },
  });

  if (chapters.length > 0) {
    const embeds: Record<string, unknown>[] = chapters.map((ch) => ({
      title: `${ch.manga.title} — Cap. ${ch.chapterNumber}`,
      description: ch.title || '',
      url: `${SITE_URL}/${ch.manga.slug}-${ch.chapterNumber}`,
      color: 0x22c55e,
      image: ch.manga.coverUrl ? { url: ch.manga.coverUrl } : undefined,
      timestamp: ch.createdAt.toISOString(),
    }));

    const r = await sendToDiscord('📚 **Últimos capítulos publicados**', embeds);
    results.push(`chapters: ${r.sent ? 'ok' : 'fail: ' + r.reason}`);
  }

  return NextResponse.json({ ok: true, results });
}
