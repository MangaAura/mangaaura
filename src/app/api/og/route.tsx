import { ImageResponse } from '@vercel/og';
import Image from 'next/image';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters
    const title = searchParams.get('title') || 'InkVerse';
    const author = searchParams.get('author') || '';
    const coverUrl = searchParams.get('cover') || '';
    const rating = searchParams.get('rating') || '';
    const type = searchParams.get('type') || 'manga'; // manga, chapter, user

    // Load cover image if provided
    let coverImage = null;
    if (coverUrl && coverUrl.startsWith('http')) {
      try {
        const response = await fetch(coverUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          coverImage = `data:image/jpeg;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
        }
      } catch {
        // Fallback to no image
      }
    }

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
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            padding: '60px',
            position: 'relative',
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
            }}
          />

          {/* Logo */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '60px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              I
            </div>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              InkVerse
            </span>
          </div>

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '60px',
              zIndex: 1,
            }}
          >
            {/* Cover image */}
            {coverImage ? (
              <Image
                src={coverImage}
                alt=""
                width={300}
                height={450}
                style={{
                  objectFit: 'cover',
                  borderRadius: '16px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '300px',
                  height: '450px',
                  background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '120px',
                }}
              >
                📚
              </div>
            )}

            {/* Info */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                maxWidth: '600px',
              }}
            >
              {/* Type badge */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <span
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}
                >
                  {type === 'chapter' ? 'Capítulo' : type === 'user' ? 'Creador' : 'Manga'}
                </span>
                {rating && (
                  <span
                    style={{
                      background: 'rgba(251, 191, 36, 0.2)',
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
                    ⭐ {parseFloat(rating).toFixed(1)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0,
                  lineHeight: 1.2,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {title.length > 60 ? title.substring(0, 60) + '...' : title}
              </h1>

              {/* Author */}
              {author && (
                <p
                  style={{
                    fontSize: '28px',
                    color: '#94a3b8',
                    margin: 0,
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  por {author}
                </p>
              )}

              {/* CTA */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '20px',
                }}
              >
                <div
                  style={{
                    background: 'white',
                    color: '#0f172a',
                    padding: '16px 32px',
                    borderRadius: '12px',
                    fontSize: '22px',
                    fontWeight: '600',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  Leer ahora
                </div>
                <span
                  style={{
                    fontSize: '20px',
                    color: '#94a3b8',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  inkverse.app
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
