import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

import { RARITY_COLORS, getBadgeSvg } from '@/lib/og-badge';

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

    // Generate badge SVG (emoji-based, reliable in Satori)
    const badgeContent = getBadgeSvg(badgeId, rarity);

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
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1e3a 50%, #0f172a 100%)',
            padding: '60px',
            position: 'relative',
            fontFamily: 'system-ui, sans-serif',
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

          {/* Top decorative line */}
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
              top: '40px',
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
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              I
            </div>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#e2e8f0',
              }}
            >
              MangaAura
            </span>
          </div>

          {/* Main card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '56px',
              zIndex: 1,
              background: 'rgba(15,23,42,0.8)',
              borderRadius: '24px',
              border: `1px solid ${rarityInfo.gradient}33`,
              padding: '48px 64px',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Badge */}
            <div
              style={{
                width: '200px',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/svg+xml,${encodeURIComponent(badgeContent)}`}
                alt=""
                width={200}
                height={200}
              />
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
              {/* Rarity badge */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <span
                  style={{
                    background: `${rarityInfo.gradient}22`,
                    color: rarityInfo.gradient,
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    fontSize: '18px',
                    fontWeight: '600',
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
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '20px',
                    color: '#94a3b8',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Logro Desbloqueado
                </span>
                <h1
                  style={{
                    fontSize: '52px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0,
                    lineHeight: 1.15,
                  }}
                >
                  {achievementName.length > 40 ? achievementName.substring(0, 40) + '...' : achievementName}
                </h1>
              </div>

              {/* User */}
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
                    fontSize: '20px',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: '24px',
                    color: '#cbd5e1',
                    fontWeight: '500',
                  }}
                >
                  {userName}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom text */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#64748b',
              fontSize: '18px',
            }}
          >
            <span>mangaaura.es/achievements</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating achievement OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
