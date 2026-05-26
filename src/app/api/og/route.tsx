import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

// ── Configuration ────────────────────────────────────────────────

export const runtime = 'edge';

const BRAND_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';

// ── Font Loading ─────────────────────────────────────────────────

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap&text=${encodeURIComponent('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789¡¿ÑñáéíóúÁÉÍÓÚ—·.,:;!?()[]{}@#$%^&*+-=~/|<>«»"\'⭐🔥📖📚✨🎯💬👑⚡🚀🎉ℹ️')}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  ).then((r) => r.text());

  const urlMatch = css.match(/src:\s*url\(([^)]+)\)/);
  if (!urlMatch) throw new Error(`Could not resolve font URL for ${family} ${weight}`);

  return fetch(urlMatch[1]).then((r) => r.arrayBuffer());
}

// ── Branding Components ──────────────────────────────────────────

function Logo() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          background: BRAND_GRADIENT,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          fontFamily: 'Inter',
        }}
      >
        M
      </div>
      <span
        style={{
          fontSize: '26px',
          fontWeight: '700',
          color: 'white',
          fontFamily: 'Inter',
          letterSpacing: '-0.02em',
        }}
      >
        MangaAura
      </span>
    </div>
  );
}

function BackgroundGradient({ type }: { type: string }) {
  const accentColors: Record<string, string> = {
    manga: 'rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08)',
    chapter: 'rgba(34, 197, 94, 0.12), rgba(59, 130, 246, 0.08)',
    news: 'rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08)',
    forum: 'rgba(59, 130, 246, 0.12), rgba(99, 102, 241, 0.08)',
    clan: 'rgba(168, 85, 247, 0.12), rgba(236, 72, 153, 0.08)',
  };
  const gradient = accentColors[type] || accentColors.manga;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage:
          'radial-gradient(circle at 15% 50%, ' + gradient + '),' +
          'radial-gradient(circle at 85% 50%, ' + gradient + '),' +
          'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)',
      }}
    />
  );
}

function DecorativeCorners() {
  return (
    <>
      {/* Top-right manga screen dots */}
      <div
        style={{
          position: 'absolute',
          top: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>
      {/* Bottom-left accent bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.4), rgba(139,92,246,0.4), transparent)',
        }}
      />
    </>
  );
}

// ── Type Badges ──────────────────────────────────────────────────

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  manga: { label: 'Manga', color: '#6366f1' },
  chapter: { label: 'Capítulo', color: '#22c55e' },
  news: { label: 'Noticia', color: '#f59e0b' },
  forum: { label: 'Foro', color: '#3b82f6' },
  clan: { label: 'Clan', color: '#a855f7' },
  blog: { label: 'Blog', color: '#06b6d4' },
};

function TypeBadge({ type }: { type: string }) {
  const badge = TYPE_BADGES[type] || TYPE_BADGES.manga;
  return (
    <span
      style={{
        background: `${badge.color}22`,
        color: badge.color,
        padding: '8px 20px',
        borderRadius: '9999px',
        fontSize: '18px',
        fontWeight: '600',
        fontFamily: 'Inter',
        border: `1px solid ${badge.color}44`,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {badge.label}
    </span>
  );
}

function RatingBadge({ rating }: { rating: string }) {
  return (
    <span
      style={{
        background: 'rgba(251, 191, 36, 0.15)',
        color: '#fbbf24',
        padding: '8px 20px',
        borderRadius: '9999px',
        fontSize: '18px',
        fontWeight: '600',
        fontFamily: 'Inter',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      ⭐ {parseFloat(rating).toFixed(1)}
    </span>
  );
}

function ChapterCountBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        background: 'rgba(99, 102, 241, 0.15)',
        color: '#93c5fd',
        padding: '8px 20px',
        borderRadius: '9999px',
        fontSize: '18px',
        fontWeight: '600',
        fontFamily: 'Inter',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      📖 {count} {count === 1 ? 'capítulo' : 'capítulos'}
    </span>
  );
}

// ── Fallback Cover ───────────────────────────────────────────────

function FallbackCover({ type }: { type: string }) {
  const emojis: Record<string, string> = {
    manga: '📚',
    chapter: '📖',
    news: '📰',
    forum: '💬',
    clan: '🏰',
    blog: '📝',
  };
  return (
    <div
      style={{
        width: '300px',
        height: '450px',
        background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '100px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}
    >
      {emojis[type] || '📚'}
    </div>
  );
}

// ── Loading cover image with error handling ──────────────────────

async function loadCoverImage(url: string | null): Promise<string | null> {
  if (!url || !url.startsWith('http')) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

// ── Main OG Image Handler ────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'MangaAura';
    const author = searchParams.get('author') || '';
    const coverUrl = searchParams.get('cover') || '';
    const rating = searchParams.get('rating') || '';
    const totalChapters = searchParams.get('chapters') || '';
    const type = searchParams.get('type') || 'manga';

    // Load fonts and cover image in parallel
    const [interRegular, interBold, interSemiBold, bebasNeue, coverImage] = await Promise.all([
      loadGoogleFont('Inter', 400).catch(() => new ArrayBuffer(0)),
      loadGoogleFont('Inter', 700).catch(() => new ArrayBuffer(0)),
      loadGoogleFont('Inter', 600).catch(() => new ArrayBuffer(0)),
      loadGoogleFont('Bebas Neue', 400).catch(() => new ArrayBuffer(0)),
      loadCoverImage(coverUrl),
    ]);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 40%, #1a2332 70%, #0f172a 100%)',
            padding: '50px 60px',
            position: 'relative',
            fontFamily: 'Inter',
          }}
        >
          {/* Background effects */}
          <BackgroundGradient type={type} />
          <DecorativeCorners />

          {/* Branding - top left */}
          <div style={{ position: 'absolute', top: '36px', left: '60px', display: 'flex', zIndex: 1 }}>
            <Logo />
          </div>

          {/* Domain - top right */}
          <div
            style={{
              position: 'absolute',
              top: '44px',
              right: '60px',
              fontSize: '18px',
              color: 'rgba(148, 163, 184, 0.7)',
              fontFamily: 'Inter',
              zIndex: 1,
            }}
          >
            mangaaura.es
          </div>

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '56px',
              zIndex: 1,
              marginTop: '20px',
            }}
          >
            {/* Cover image */}
            {coverImage ? (
              <img
                src={coverImage}
                alt=""
                width={300}
                height={450}
                style={{
                  objectFit: 'cover',
                  borderRadius: '16px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                }}
              />
            ) : (
              <FallbackCover type={type} />
            )}

            {/* Info column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxWidth: '620px',
              }}
            >
              {/* Type + Rating badges */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <TypeBadge type={type} />
                {rating && <RatingBadge rating={rating} />}
                {totalChapters && <ChapterCountBadge count={parseInt(totalChapters, 10)} />}
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: '52px',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0,
                  lineHeight: 1.15,
                  fontFamily: 'Inter',
                  letterSpacing: '-0.02em',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {title.length > 70 ? title.substring(0, 70) + '...' : title}
              </h1>

              {/* Author */}
              {author && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: BRAND_GRADIENT,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      color: 'white',
                      fontWeight: '700',
                      fontFamily: 'Inter',
                    }}
                  >
                    {author.charAt(0).toUpperCase()}
                  </div>
                  <p
                    style={{
                      fontSize: '24px',
                      color: '#94a3b8',
                      margin: 0,
                      fontFamily: 'Inter',
                    }}
                  >
                    por {author}
                  </p>
                </div>
              )}

              {/* CTA */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '10px',
                }}
              >
                <div
                  style={{
                    background: 'white',
                    color: '#0f172a',
                    padding: '14px 32px',
                    borderRadius: '12px',
                    fontSize: '20px',
                    fontWeight: '600',
                    fontFamily: 'Inter',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {type === 'chapter' ? '📖 Leer capítulo' : type === 'news' ? '📰 Leer noticia' : type === 'forum' ? '💬 Ver hilo' : '📖 Leer ahora'}
                </div>
                <span
                  style={{
                    fontSize: '17px',
                    color: 'rgba(148, 163, 184, 0.6)',
                    fontFamily: 'Inter',
                  }}
                >
                  Comparte este contenido
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          interRegular.byteLength > 0 ? { name: 'Inter', data: interRegular, weight: 400, style: 'normal' as const } : null,
          interSemiBold.byteLength > 0 ? { name: 'Inter', data: interSemiBold, weight: 600, style: 'normal' as const } : null,
          interBold.byteLength > 0 ? { name: 'Inter', data: interBold, weight: 700, style: 'normal' as const } : null,
          bebasNeue.byteLength > 0 ? { name: 'Bebas Neue', data: bebasNeue, weight: 400, style: 'normal' as const } : null,
        ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style: 'normal' }[],
        headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      }
    );
  } catch (error) {
    console.error('[OG Image Error]', error);
    return generateFallbackOG();
  }
}

// ── Fallback OG Image (branded, never show error text) ───────────

async function generateFallbackOG() {
  const [interBold, bebasNeue] = await Promise.all([
    loadGoogleFont('Inter', 700).catch(() => new ArrayBuffer(0)),
    loadGoogleFont('Bebas Neue', 400).catch(() => new ArrayBuffer(0)),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 40%, #1a2332 70%, #0f172a 100%)',
          position: 'relative',
          fontFamily: 'Inter',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'radial-gradient(circle at 50% 40%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            zIndex: 1,
            textAlign: 'center',
            padding: '60px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              fontFamily: 'Inter',
              boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.4)',
            }}
          >
            M
          </div>
          <h1
            style={{
              fontSize: '72px',
              fontWeight: '700',
              color: 'white',
              margin: 0,
              fontFamily: 'Inter',
              letterSpacing: '-0.03em',
            }}
          >
            MangaAura
          </h1>
          <p
            style={{
              fontSize: '28px',
              color: '#94a3b8',
              margin: 0,
              fontFamily: 'Inter',
            }}
          >
            Lee, crea y crowdfundea manga con IA
          </p>
          <div
            style={{
              fontSize: '18px',
              color: '#64748b',
              marginTop: '12px',
              fontFamily: 'Inter',
            }}
          >
            mangaaura.es
          </div>
        </div>
      </div>
    ),      {
        width: 1200,
        height: 630,
        fonts: [
          interBold.byteLength > 0 ? { name: 'Inter', data: interBold, weight: 700, style: 'normal' as const } : null,
          bebasNeue.byteLength > 0 ? { name: 'Bebas Neue', data: bebasNeue, weight: 400, style: 'normal' as const } : null,
        ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style: 'normal' }[],
        headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      }
  );
}
