import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const THUMBS = 'https://www.animenewsnetwork.com/thumbnails/';
const SITE_NAME = 'MangaAura';
const MAX_ARTICLES = 15;
const ANN_RSS = 'https://www.animenewsnetwork.com/all/rss.xml';
const NVIDIA_API = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL = 'meta/llama-3.1-70b-instruct';
const NVIDIA_TIMEOUT = 60000;
const CONCURRENCY = 3;

const categoryMap: Record<string, string> = {
  anime: 'platform', manga: 'community', industry: 'tools',
  'asian-events': 'contest', events: 'contest', games: 'mobile',
  music: 'community', 'dvds-bluray': 'platform', figures: 'community',
  videos: 'platform', merchandise: 'community',
  game: 'mobile', nintendo: 'mobile', playstation: 'mobile',
  xbox: 'mobile', sega: 'mobile', bandai: 'mobile',
  square: 'mobile', capcom: 'mobile', atlus: 'mobile',
  korean: 'community', 'light-novel': 'community', novel: 'community',
  'live-action': 'community', people: 'tools',
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

function extractDomainImage(html: string, url: string): string | null {
  const match = html.match(/<link\s+rel="image_src"\s+href="([^"]+)"/i);
  if (!match?.[1]) return null;
  const raw = match[1];
  if (raw.startsWith(THUMBS)) return raw;
  if (raw.startsWith('/thumbnails/')) return THUMBS + raw.slice('/thumbnails/'.length);
  if (raw.startsWith('//')) return 'https:' + raw;
  if (raw.startsWith('/')) return new URL(raw, url).href;
  return raw;
}

async function scrapeImageSrc(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return extractDomainImage(await res.text(), url);
  } catch {
    return null;
  }
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
  const body = enDesc.length > 900 ? enDesc.slice(0, 897) + '...' : enDesc;

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

  const content = [
    `La industria del anime y el manga no se detiene. Anime News Network ${verb} de ${subject}, una historia que los fans estaban esperando.`,
    '',
    body,
    '',
    `En ${SITE_NAME} estaremos atentos a cualquier novedad sobre esta historia. Visítanos regularmente para mantenerte al día con lo último del mundo del anime, el manga y la cultura japonesa.`,
  ].join('\n');

  return { title, excerpt: shortDesc, content };
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
    const res = await fetch(NVIDIA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(NVIDIA_TIMEOUT),
    });

    if (!res.ok) return null;

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

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function processArticle(
  item: any,
  adminId: string,
  existingSlugs: Set<string>,
  existingTitles: Set<string>,
  batchIndex: number,
): Promise<{ title: string; status: string; error?: string; source: 'nvidia' | 'fallback'; ms?: number }> {
  const start = Date.now();
  const entryTitle: string = item.title || 'Untitled';
  const entryLink: string = item.link || '';
  const entryDesc: string = item.contentSnippet || item.content || '';
  const entryPubDate = item.pubDate || item.isoDate || null;
  const entryCategories: string[] = item.categories || [];
  const slug = slugify(entryTitle);

  if (existingSlugs.has(slug) || existingTitles.has(entryTitle)) {
    return { title: entryTitle, status: 'skipped (exists)', source: 'fallback', ms: Date.now() - start };
  }

  const t0 = Date.now();
  const [coverUrl, aiSpanish] = await Promise.all([
    scrapeImageSrc(entryLink),
    translateWithNvidia(entryTitle, entryDesc.slice(0, 500)),
  ]);
  const scrapeMs = Date.now() - t0;

  const spanish = aiSpanish || spanishFallback(entryTitle, entryDesc);
  const source = aiSpanish ? 'nvidia' : 'fallback' as const;
  const category = mapCategory(entryCategories);

  try {
    const publishedAt = entryPubDate ? new Date(entryPubDate) : new Date();

    await prisma.newsArticle.create({
      data: {
        title: (spanish.title || entryTitle).slice(0, 200),
        slug,
        excerpt: (spanish.excerpt || entryDesc).slice(0, 300),
        content: (spanish.content || entryDesc).slice(0, 5000),
        titleEn: entryTitle,
        excerptEn: entryDesc.slice(0, 300),
        coverUrl,
        category,
        authorId: adminId,
        isPublished: true,
        isFeatured: false,
        publishedAt,
      },
    });

    existingSlugs.add(slug);
    existingTitles.add(entryTitle);

    const totalMs = Date.now() - start;
    console.log(`[FetchNews] +${batchIndex} "${entryTitle.slice(0, 50)}" ${source} scrape=${scrapeMs}ms total=${totalMs}ms`);
    return { title: entryTitle, status: 'created', source, ms: totalMs };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[FetchNews] FAIL "${entryTitle}":`, msg);
    return { title: entryTitle, status: 'failed', error: msg, source: 'fallback', ms: Date.now() - start };
  }
}

export async function POST(request: NextRequest) {
  const globalStart = Date.now();

  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (!authHeader || !expectedAuth || authHeader.length !== expectedAuth.length || !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const t0 = Date.now();
    const RssParser = (await import('rss-parser')) as unknown as { default: new () => { parseURL: (url: string) => Promise<{ items: any[] }> } };
    const parser = new RssParser.default();
    const feed = await parser.parseURL(ANN_RSS);
    const rssMs = Date.now() - t0;

    const admin = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'OWNER'] } },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json({ success: false, error: 'No admin user found' }, { status: 500 });
    }

    const t1 = Date.now();
    const existing = await prisma.newsArticle.findMany({
      where: { isPublished: true },
      select: { slug: true, titleEn: true },
    });
    const existingSlugs = new Set(existing.map(a => a.slug));
    const existingTitles = new Set(existing.map(a => a.titleEn).filter((t): t is string => t !== null));
    const loadMs = Date.now() - t1;

    const items = feed.items.slice(0, MAX_ARTICLES);
    const results: { title: string; status: string; error?: string; source: 'nvidia' | 'fallback'; ms?: number }[] = [];

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < items.length; i += CONCURRENCY) {
      const batch = items.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map((item, idx) =>
          processArticle(item, admin.id, existingSlugs, existingTitles, i + idx + 1),
        ),
      );

      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          results.push(r.value);
          if (r.value.status === 'created') created++;
          if (r.value.status === 'skipped (exists)') skipped++;
        } else {
          results.push({ title: 'unknown', status: 'failed', error: r.reason?.message || String(r.reason), source: 'fallback' });
        }
      }

      if (i + CONCURRENCY < items.length) {
        await sleep(2000);
      }
    }

    const totalMs = Date.now() - globalStart;
    console.log(`[FetchNews] DONE: ${created} creadas, ${skipped} saltadas, ${totalMs}ms (rss=${rssMs}ms, load=${loadMs}ms)`);

    return NextResponse.json({
      success: true,
      totalProcessed: items.length,
      created,
      skipped,
      totalMs,
      results,
    });
  } catch (error) {
    console.error('[CRON] fetch-news error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
