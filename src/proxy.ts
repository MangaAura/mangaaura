import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { logRequest, generateRequestId } from '@/lib/request-logger';

const STATIC_SKIP_PATHS = ['/_next/', '/static/', '/favicon.ico', '/manifest.json', '/sw.js', '/api/health', '/_rsc/'];
const CSRF_SKIP_PATHS = ['/api/webhooks', '/api/auth', '/api/health'];
const CSRF_COOKIE_NAME = '__csrf_mw';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? [process.env.NEXTAUTH_URL!].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001', process.env.NEXTAUTH_URL!].filter(Boolean);

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < aBuf.length; i++) result |= aBuf[i] ^ bBuf[i];
  return result === 0;
}

function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Pre-build CSP template parts — only the nonce changes per page request.
const CSP_PREFIX = `default-src 'self'; script-src 'self' 'nonce-`;
const CSP_SUFFIX = process.env.NODE_ENV === 'development'
  ? `' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.vercel-storage.com https://*.blob.vercel-storage.com https://ui-avatars.com https://placehold.co https://*.unsplash.com; connect-src 'self' https://api.stripe.com https://*.supabase.co; frame-src https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`
  : `' https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.vercel-storage.com https://*.blob.vercel-storage.com https://ui-avatars.com https://placehold.co https://*.unsplash.com; connect-src 'self' https://api.stripe.com https://*.supabase.co; frame-src https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`;

function buildCSP(nonce: string): string {
  return CSP_PREFIX + nonce + CSP_SUFFIX;
}

function applySecurityHeaders(response: NextResponse, nonce: string) {
  const csp = buildCSP(nonce);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Content-Security-Policy', csp);
  const reportUrl = process.env.CSP_REPORT_URL;
  if (reportUrl) {
    response.headers.set('Content-Security-Policy-Report-Only', `${csp}; report-uri ${reportUrl}; report-to csp-endpoint`);
  }
}

function applyCORSHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Request-ID');
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Vary', 'Origin');
  }
}

function validateCSRF(request: NextRequest): boolean {
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME);
  const csrfHeader = request.headers.get(CSRF_HEADER_NAME);
  if (!csrfCookie || !csrfHeader) return false;
  return timingSafeEqual(csrfCookie.value, csrfHeader);
}

function setCSRFCookie(response: NextResponse) {
  const token = generateCSRFToken();
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_COOKIE_MAX_AGE,
    path: '/',
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const startTime = Date.now();
  const requestId = generateRequestId();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  if (STATIC_SKIP_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // RSC payload requests carry an 'RSC: 1' header — skip proxy to avoid
  // CSP/security headers interfering with serialized RSC payload delivery.
  if (request.headers.get('RSC') === '1') return NextResponse.next();

  // API routes return JSON, not HTML — skip nonce/CSP generation overhead.
  const isApiRoute = pathname.startsWith('/api/');

  let response: NextResponse;
  let nonce = '';

  if (isApiRoute) {
    // API routes: no SSP HTML → no nonce/CSP needed.
    response = NextResponse.next();
  } else {
    // Page routes: generate nonce and inject CSP for SSR inline scripts.
    nonce = generateNonce();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', buildCSP(nonce));

    response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    applySecurityHeaders(response, nonce);
    response.headers.set('X-CSP-Nonce', nonce);
  }

  applyCORSHeaders(response, request);
  response.headers.set('X-Request-ID', requestId);

  if (method === 'OPTIONS') {
    logRequest({ method, path: pathname, statusCode: 204, duration: Date.now() - startTime, ip, userAgent, requestId });
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const isCSRFProtected = isMutating && !CSRF_SKIP_PATHS.some((p) => pathname.startsWith(p));

  if (isCSRFProtected && !validateCSRF(request)) {
    logRequest({ method, path: pathname, statusCode: 403, duration: Date.now() - startTime, ip, userAgent, requestId });
    return new NextResponse(JSON.stringify({ error: 'CSRF validation failed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const hasCSRFCookie = request.cookies.get(CSRF_COOKIE_NAME);
  if (!hasCSRFCookie && !pathname.startsWith('/api')) {
    setCSRFCookie(response);
  }

  logRequest({ method, path: pathname, statusCode: 200, duration: Date.now() - startTime, ip, userAgent, requestId });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.svg$).*)'],
};
