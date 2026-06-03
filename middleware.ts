import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP nonce generation + security headers middleware
 *
 * 1. Generates a unique crypto nonce per request for CSP
 * 2. Sets the nonce in the x-nonce header (read by layout.tsx for inline scripts)
 * 3. Applies Content-Security-Policy enforce header
 */
function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

// Known image hosts used across the app (matches next.config.ts remotePatterns)
const IMAGE_HOSTS = [
  '*.unsplash.com',
  'ui-avatars.com',
  '*.supabase.co',
  '*.vercel-storage.com',
  '*.blob.vercel-storage.com',
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
  'cdn.discordapp.com',
  'yt3.googleusercontent.com',
];

const CONNECT_HOSTS = [
  '*.supabase.co',
  'wss://*.supabase.co',
  '*.vercel-storage.com',
  '*.blob.vercel-storage.com',
  'sentry.io',
  'o*.ingest.sentry.io',
  'api.stripe.com',
  'js.stripe.com',
  'vitals.vercel-insights.com',
  'localhost:*',
];

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const nonceSrc = `'nonce-${nonce}'`;

  const cspParts = [
    `default-src 'self'`,
    `script-src 'self' ${nonceSrc} 'strict-dynamic' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' blob: data: ${IMAGE_HOSTS.join(' ')}`,
    `font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com`,
    `connect-src 'self' ${CONNECT_HOSTS.join(' ')}`,
    `frame-src 'self' https://js.stripe.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `report-uri /api/csp-report`,
  ];

  const cspValue = cspParts.join('; ');

  // Clone the request headers and set the nonce for layout.tsx to read
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set response headers
  response.headers.set('x-nonce', nonce);
  response.headers.set('Content-Security-Policy', cspValue);
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return response;
}

// Only run on page navigations and API routes (not on static assets)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|apple-touch-icon.png|og-image.webp|manifest.json|sw.js|workbox-).*)',
  ],
};
