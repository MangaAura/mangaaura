/**
 * Notifica nuevos artículos y capítulos a un canal de Discord via Webhook.
 *
 * Modo 1 — Una vez: npx tsx scripts/discord/notify-new-content.ts
 * Modo 2 — Cron (Vercel): curl https://mangaaura.es/api/cron/discord-notify
 * Modo 3 — Manual: pasa un slug con --article=<slug>
 *
 * Requisitos:
 *   DISCORD_WEBHOOK_URL=   (en .env.local o variables de Vercel)
 *
 * La webhook la creas en Discord:
 *   Server Settings → Integrations → Webhooks → New Webhook
 */

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../src/generated/prisma/client.js';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

interface DiscordEmbed {
  title: string;
  description: string;
  url: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  image?: { url: string };
  footer?: { text: string };
  timestamp?: string;
}

const COLORS = {
  blog: 0x6366f1,    // indigo
  chapter: 0x22c55e,  // green
  news: 0xf59e0b,     // amber
};

async function sendDiscord(content: string, embeds: DiscordEmbed[]) {
  if (!WEBHOOK_URL) {
    console.log('[Discord] No DISCORD_WEBHOOK_URL set — printing to console:');
    console.log(JSON.stringify({ content, embeds }, null, 2));
    return { sent: false, reason: 'no webhook URL' };
  }

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, embeds, username: 'MangaAura', avatar_url: `${SITE_URL}/icons/icon-192x192.png` }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Discord] Error ${res.status}: ${text}`);
    return { sent: false, reason: text };
  }

  console.log('[Discord] Notificación enviada correctamente');
  return { sent: true };
}

async function notifyArticle(slug?: string) {
  const where = slug ? { slug, isPublished: true } : { isPublished: true };
  const article = await prisma.newsArticle.findFirst({
    where,
    orderBy: slug ? undefined : { publishedAt: 'desc' },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      coverUrl: true,
      category: true,
      publishedAt: true,
      author: { select: { username: true, displayName: true } },
    },
  });

  if (!article) {
    console.log('[Discord] No se encontró artículo');
    return;
  }

  const authorName = article.author?.displayName || article.author?.username || 'MangaAura';
  const embed: DiscordEmbed = {
    title: article.title,
    description: (article.excerpt || '').slice(0, 300),
    url: `${SITE_URL}/blog/${article.slug}`,
    color: COLORS.blog,
    fields: [
      { name: '📂 Categoría', value: article.category, inline: true },
      { name: '✍️ Autor', value: authorName, inline: true },
    ],
    footer: { text: 'MangaAura — Blog' },
    timestamp: article.publishedAt?.toISOString() || new Date().toISOString(),
  };

  if (article.coverUrl) {
    embed.image = { url: article.coverUrl };
  }

  await sendDiscord(`📖 **Nuevo artículo en el blog**`, [embed]);
}

async function notifyRecentChapters(count = 3) {
  const chapters = await prisma.chapter.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take: count,
    select: {
      id: true,
      chapterNumber: true,
      title: true,
      createdAt: true,
      manga: { select: { title: true, slug: true, coverUrl: true } },
    },
  });

  if (chapters.length === 0) {
    console.log('[Discord] No hay capítulos recientes');
    return;
  }

  const embeds: DiscordEmbed[] = chapters.map((ch) => ({
    title: `${ch.manga.title} — Cap. ${ch.chapterNumber}`,
    description: ch.title || '',
    url: `${SITE_URL}/${ch.manga.slug}-${ch.chapterNumber}`,
    color: COLORS.chapter,
    image: ch.manga.coverUrl ? { url: ch.manga.coverUrl } : undefined,
    timestamp: ch.createdAt.toISOString(),
  }));

  await sendDiscord(`📚 **Últimos capítulos publicados**`, embeds);
}

async function main() {
  const args = process.argv.slice(2);
  const articleFlag = args.find((a) => a.startsWith('--article='));
  const chapterFlag = args.find((a) => a === '--chapters');

  if (articleFlag) {
    const slug = articleFlag.split('=')[1];
    await notifyArticle(slug);
  } else if (chapterFlag) {
    await notifyRecentChapters();
  } else {
    await notifyArticle();
    console.log('');
    await notifyRecentChapters();
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('[Discord] Error:', e);
  process.exit(1);
});
