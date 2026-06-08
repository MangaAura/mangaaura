import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const THUMBS = 'https://www.animenewsnetwork.com/thumbnails/';
const SITE_NAME = 'MangaAura';

const categoryMap: Record<string, string> = {
  anime: 'platform', manga: 'community', industry: 'tools',
  'asian-events': 'contest', events: 'contest', games: 'mobile',
  music: 'community', 'dvds-bluray': 'platform', figures: 'community',
  videos: 'platform', merchandise: 'community',
};

function mapCategory(cats: string[]): string {
  const joined = cats.join(' ').toLowerCase();
  for (const [key, val] of Object.entries(categoryMap)) {
    if (joined.includes(key)) return val;
  }
  return 'platform';
}

function slugify(text: string): string {
  return (text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)) || 'article';
}

async function scrapeImageSrc(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const html = await res.text();
    const match = html.match(/<link\s+rel="image_src"\s+href="([^"]+)"/i);
    if (match?.[1]) {
      const raw = match[1];
      if (raw.startsWith(THUMBS)) return raw;
      if (raw.startsWith('/thumbnails/')) return THUMBS + raw.slice('/thumbnails/'.length);
      return raw;
    }
  } catch {
    // Individual scrape failure isn't fatal
  }
  return null;
}

const TYPE_KEYWORDS: { words: string[]; type: string }[] = [
  { words: ['review', 'blu-ray', 'dvd', 'bd-box', 'disc'], type: 'review' },
  { words: ['interview'], type: 'interview' },
  { words: ['trailer', 'pv', 'preview', 'teaser'], type: 'trailer' },
  { words: ['season', 'sequel', '2nd', 'second', 'return', 'revival', 'reboot'], type: 'sequel' },
  { words: ['adaptation', 'webtoon', 'manga', 'anime', 'live-action', 'film'], type: 'adaptation' },
  { words: ['announced', 'announce', 'reveal', 'unveil'], type: 'announcement' },
  { words: ['launch', 'release', 'premier', 'debut', 'opens', 'premiere'], type: 'launch' },
];

function detectType(title: string): string {
  const lower = title.toLowerCase();
  for (const t of TYPE_KEYWORDS) {
    if (t.words.some(w => lower.includes(w))) return t.type;
  }
  return 'news';
}

function spanishFallback(enTitle: string, enDesc: string): { title: string; excerpt: string; content: string } {
  const clean = enTitle.replace(/\s*\(Updated\)\s*/i, '').replace(/\s*\(Update\)\s*/i, '').trim();
  const type = detectType(clean);

  const subject = clean.length > 70 ? clean.slice(0, 67) + '...' : clean;

  const titles: Record<string, string> = {
    review: `Reseña: ${subject}`,
    interview: `Entrevista: ${subject}`,
    trailer: `Nuevo tráiler: ${subject}`,
    sequel: `Regresa: ${subject}`,
    adaptation: `Llega la adaptación de ${subject}`,
    announcement: `Anuncio: ${subject}`,
    launch: `Ya disponible: ${subject}`,
  };
  const title = (titles[type] || subject).slice(0, 200);

  const shortDesc = enDesc.length > 250 ? enDesc.slice(0, 247) + '...' : enDesc;
  const excerpt = shortDesc;

  const verbPhrases: Record<string, string> = {
    review: 'publica su análisis',
    interview: 'comparte una entrevista exclusiva',
    trailer: 'presenta un nuevo avance',
    sequel: 'confirma el regreso',
    adaptation: 'anuncia su adaptación',
    announcement: 'revela los detalles',
    launch: 'informa del lanzamiento',
  };
  const verb = verbPhrases[type] || 'publica una noticia';

  const body = enDesc.length > 900 ? enDesc.slice(0, 897) + '...' : enDesc;

  const content = [
    `La industria del anime y el manga no se detiene. Anime News Network ${verb} de ${subject}, una historia que los fans estaban esperando.`,
    '',
    body,
    '',
    `En ${SITE_NAME} estaremos atentos a cualquier novedad sobre esta historia. Visítanos regularmente para mantenerte al día con lo último del mundo del anime, el manga y la cultura japonesa.`,
  ].join('\n');

  return { title, excerpt, content };
}

async function translateWithNvidia(title: string, description: string) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  const prompt = `Eres un periodista de anime y manga. Reescribe esta noticia en español con storytelling atractivo para hispanohablantes. Conecta con nostalgia, hype o significado cultural.

Título original: ${title}
Descripción original: ${description}

Responde solo con este formato (sin markdown):
TÍTULO: [título atractivo en español, máx 120 caracteres]
RESUMEN: [2-3 oraciones, máx 200 caracteres]
CUERPO: [3-5 párrafos, 250-400 palabras, solo texto plano. No inventes datos.]`;

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      console.error('[FetchNews] NVIDIA error:', res.status);
      return null;
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    if (!text) return null;

    const titleMatch = text.match(/TÍTULO:\s*(.+?)(?:\n|$)/i);
    const excerptMatch = text.match(/RESUMEN:\s*(.+?)(?:\n|$)/i);
    const bodyMatch = text.match(/CUERPO:\s*([\s\S]+)/i);

    const result: { title?: string; excerpt?: string; content?: string } = {};
    if (titleMatch) result.title = titleMatch[1].trim().slice(0, 200);
    if (excerptMatch) result.excerpt = excerptMatch[1].trim().slice(0, 300);
    if (bodyMatch) result.content = bodyMatch[1].trim().slice(0, 5000);

    if (Object.keys(result).length === 0) return null;
    return result;
  } catch (err) {
    console.error('[FetchNews] NVIDIA call failed:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (!authHeader || !expectedAuth || authHeader.length !== expectedAuth.length || !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const MAX_ARTICLES = 5;
    const ANN_RSS = 'https://www.animenewsnetwork.com/all/rss.xml';

    const RssParser = (await import('rss-parser')) as unknown as { default: new () => { parseURL: (url: string) => Promise<{ items: any[] }> } };
    const parser = new RssParser.default();
    const feed = await parser.parseURL(ANN_RSS);

    const admin = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'OWNER'] } },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json({ success: false, error: 'No admin user found' }, { status: 500 });
    }

    const results: { title: string; status: string; error?: string; source: 'nvidia' | 'fallback' }[] = [];
    let created = 0;
    let skipped = 0;

    for (const item of feed.items.slice(0, MAX_ARTICLES)) {
      const entryTitle = item.title || 'Untitled';
      const entryLink = item.link || '';
      const entryDesc = item.contentSnippet || item.content || '';
      const entryPubDate = item.pubDate || item.isoDate || null;
      const entryCategories = item.categories || [];
      const slug = slugify(entryTitle);

      const existing = await prisma.newsArticle.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existing) {
        results.push({ title: entryTitle, status: 'skipped (exists)', source: 'fallback' });
        skipped++;
        continue;
      }

      const [coverUrl, aiSpanish] = await Promise.all([
        scrapeImageSrc(entryLink),
        translateWithNvidia(entryTitle, entryDesc.slice(0, 500)),
      ]);

      // Siempre español: NVIDIA si funciona, fallback template si no
      const spanish = aiSpanish || spanishFallback(entryTitle, entryDesc);
      const source = aiSpanish ? 'nvidia' : 'fallback';
      const category = mapCategory(entryCategories);

      try {
        const publishedAt = entryPubDate ? new Date(entryPubDate) : new Date();

        const safeTitle = spanish.title?.slice(0, 200) || entryTitle.slice(0, 200);
        const safeExcerpt = spanish.excerpt?.slice(0, 300) || entryDesc.slice(0, 300);
        const safeContent = spanish.content?.slice(0, 5000) || entryDesc.slice(0, 5000);

        await prisma.newsArticle.create({
          data: {
            title: safeTitle,
            slug,
            excerpt: safeExcerpt,
            content: safeContent,
            titleEn: entryTitle,
            excerptEn: entryDesc.slice(0, 300),
            coverUrl,
            category,
            authorId: admin.id,
            isPublished: true,
            isFeatured: false,
            publishedAt,
          },
        });

        results.push({ title: entryTitle, status: 'created', source });
        created++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ title: entryTitle, status: 'failed', error: msg, source: 'fallback' });
        console.error(`[FetchNews] Error creating "${entryTitle}":`, msg);
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed: feed.items.length,
      created,
      skipped,
      results,
    });
  } catch (error) {
    console.error('[CRON] fetch-news error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
