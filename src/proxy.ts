import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const STATIC_SKIP_PATHS = ['/_next/', '/static/', '/favicon.ico', '/manifest.json', '/sw.js', '/api/health'];
const CSRF_SKIP_PATHS = ['/api/webhooks', '/api/auth', '/api/health'];
const CSRF_COOKIE_NAME = '__csrf_mw';
const CSRF_HEADER_NAME = 'x-csrf-token';

const AUTH_PROTECTED_PREFIXES = ['/admin', '/creator', '/settings', '/profile', '/library', '/messages', '/collections', '/checkout', '/achievements'];
const AUTH_PUBLIC_OVERRIDES = ['/creator/community'];

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < aBuf.length; i++) result |= aBuf[i] ^ bBuf[i];
  return result === 0;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.vercel-storage.com https://*.blob.vercel-storage.com https://ui-avatars.com; connect-src 'self' https://api.stripe.com https://*.supabase.co; frame-src https://js.stripe.com https://hooks.stripe.com;"
    );
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_SKIP_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.svg$).*)'],
};
