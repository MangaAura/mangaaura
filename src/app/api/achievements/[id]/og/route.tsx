import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

import { RARITY_COLORS, getBadgeIcon } from '@/lib/og-badge';

// ── Configuration ────────────────────────────────────────────────

export const runtime = 'edge';

// ── Font Loading ─────────────────────────────────────────────────

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap&text=${encodeURIComponent('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789¡¡ÑñáéíóúÁÉÍÓÚ—·.,:;!?()[]{}@#$%^&*+-=~/|<>«»"\'⭐⚡🔥🎯📖📚💬✨🎉🏆👑🖋️💎👾')}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  ).then((r) => r.text());

  const urlMatch = css.match(/src:\s*url\(([^)]+)\)/);
  if (!urlMatch) throw new Error(`Could not resolve font URL for ${family} ${weight}`);

  return fetch(urlMatch[1]).then((r) => r.arrayBuffer());
}

// ── Handler ──────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: achievementId } = await params;
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('user') || 'MangaAura';
    const achievementName = searchParams.get('name') || 'Logro';
    const rarity = (searchParams.get('rarity') || 'EASY').toUpperCase();
    const xpReward = parseInt(searchParams.get('xp') || '0', 10);

    const rarityInfo = RARITY_COLORS[rarity] || RARITY_COLORS.EASY;
    const badgeId = searchParams.get('badge') || achievementId;

    // Get badge emoji
    const badgeIcon = getBadgeIcon(badgeId);

    // Load fonts
    const [interRegular, interBold, interSemiBold] = await Promise.all([
      loadGoogleFont('Inter', 400).catch(() => new ArrayBuffer(0)),
      loadGoogleFont('Inter', 700).catch(() => new ArrayBuffer(0)),
      loadGoogleFont('Inter', 600).catch(() => new ArrayBuffer(0)),
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
            background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 50%, #0f172a 100%)',
            padding: '60px',
            position: 'relative',
            fontFamily: 'Inter',
          }}
        >
          {/* Background radial glows */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at 50% 40%, ${rarityInfo.glow} 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.1) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(139,92,246,0.1) 0%, transparent 40%)`,
            }}
          />

          {/* Top decorative gradient line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(to right, transparent, ${rarityInfo.gradient}, transparent)`,
            }}
          />

          {/* MangaAura branding */}
          <div
            style={{
              position: 'absolute',
              top: '36px',
              left: '60px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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
                fontSize: '24px',
                fontWeight: '700',
                color: '#e2e8f0',
                fontFamily: 'Inter',
              }}
            >
              MangaAura
            </span>
          </div>

          {/* Domain - top right */}
          <div
            style={{
              position: 'absolute',
              top: '44px',
              right: '60px',
              fontSize: '17px',
              color: 'rgba(148, 163, 184, 0.6)',
              fontFamily: 'Inter',
            }}
          >
            mangaaura.es/logros
          </div>

          {/* Decorative corner dots */}
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
                  background: 'rgba(255,255,255,0.05)',
                }}
              />
            ))}
          </div>

          {/* Main card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '56px',
              zIndex: 1,
              background: 'rgba(15,23,42,0.85)',
              borderRadius: '24px',
              border: `1px solid ${rarityInfo.gradient}33`,
              padding: '48px 64px',
            }}
          >
            {/* Badge — rendered directly in JSX to avoid SVG data URI encoding issues */}
            <div
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: `radial-gradient(circle at 50% 50%, ${rarityInfo.glow} 30%, transparent 70%)`,
                border: `4px solid ${rarityInfo.gradient}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 0 40px ${rarityInfo.glow}`,
              }}
            >
              <span style={{ fontSize: '80px', lineHeight: 1 }}>
                {badgeIcon}
              </span>
            </div>

            {/* Info column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                maxWidth: '520px',
              }}
            >
              {/* Rarity + XP badges */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <span
                  style={{
                    background: `${rarityInfo.gradient}22`,
                    color: rarityInfo.gradient,
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    fontSize: '18px',
                    fontWeight: '600',
                    fontFamily: 'Inter',
                    border: `1px solid ${rarityInfo.gradient}44`,
                  }}
                >
                  {rarityInfo.label}
                </span>
                <span
                  style={{
                    background: 'rgba(251,191,36,0.15)',
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
                  ⚡ +{xpReward} XP
                </span>
              </div>

              {/* Achievement name */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '18px',
                    color: '#94a3b8',
                    fontWeight: '600',
                    fontFamily: 'Inter',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Logro Desbloqueado
                </span>
                <h1
                  style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: 'white',
                    margin: 0,
                    lineHeight: 1.15,
                    fontFamily: 'Inter',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {achievementName.length > 40 ? achievementName.substring(0, 40) + '...' : achievementName}
                </h1>
              </div>

              {/* User */}
              {userName && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      color: 'white',
                      fontWeight: '700',
                      fontFamily: 'Inter',
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span
                    style={{
                      fontSize: '24px',
                      color: '#cbd5e1',
                      fontWeight: '500',
                      fontFamily: 'Inter',
                    }}
                  >
                    {userName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom text */}
          <div
            style={{
              position: 'absolute',
              bottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#475569',
              fontSize: '16px',
              fontFamily: 'Inter',
            }}
          >
            Comparte tu logro en redes sociales
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
        ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style: 'normal' }[],
        headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      }
    );
  } catch (error) {
    console.error('[Achievement OG Error]', error);
    // Return a branded fallback image instead of error text
    try {
      const [interBold] = await Promise.all([
        loadGoogleFont('Inter', 700).catch(() => new ArrayBuffer(0)),
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
              background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 50%, #0f172a 100%)',
              fontFamily: 'Inter',
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
              }}
            >
              M
            </div>
            <h1 style={{ fontSize: '72px', fontWeight: '700', color: 'white', margin: '24px 0 0', fontFamily: 'Inter' }}>
              MangaAura
            </h1>
            <p style={{ fontSize: '28px', color: '#94a3b8', margin: '12px 0 0', fontFamily: 'Inter' }}>
              Logros y trofeos
            </p>
          </div>
        ),
        {
          width: 1200,
          height: 630,
          fonts: interBold.byteLength > 0
            ? [{ name: 'Inter', data: interBold, weight: 700, style: 'normal' as const }]
            : [],
        }
      );
    } catch {
      return new Response('Error generating image', { status: 500 });
    }
  }
}
