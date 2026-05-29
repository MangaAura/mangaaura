import { getToken } from '@auth/core/jwt';
import { NextRequest, NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { logRequest, generateRequestId } from '@/lib/request-logger';

// ─── Locale routing (from middleware.ts) ────────────────────────────

const LOCALES = ['es', 'en'] as const;
const DEFAULT_LOCALE = 'es';

function getLocale(request: NextRequest): string {
  // 1. Check cookie
  const cookieLocale = request.cookies.get('mangaaura-locale')?.value;
  if (cookieLocale && LOCALES.includes(cookieLocale as any)) {
    return cookieLocale;
  }

  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(',')[0]?.split('-')[0];
    if (preferred && LOCALES.includes(preferred as any)) {
      return preferred;
    }
  }

  return DEFAULT_LOCALE;
}

function hasLocalePrefix(pathname: string): string | null {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return null;
}

// ─── Auth: protected routes ────────────────────────────────────────

// ─── Route permissions ────────────────────────────────────────────
const ROUTE_PERMISSIONS: Record<string, { permission?: string; roles?: string[]; requireAuth?: boolean }> = {
  '/admin': { permission: 'admin:settings' },
  '/admin/users': { permission: 'users:read' },
  '/admin/bans': { permission: 'bans:view' },
  '/admin/audit-log': { permission: 'audit:view' },
  '/admin/impersonate': { permission: 'admin:impersonate' },
  '/admin/restore': { permission: 'restore:accounts' },
  '/admin/moderation': { permission: 'moderation:reports' },
  '/admin/webhooks': { permission: 'webhooks:manage' },
  '/admin/news': { permission: 'news:edit' },
  '/admin/csp-reports': { permission: 'csp:view' },
  '/admin/ai-dashboard': { permission: 'admin:settings' },
  '/admin/settings': { permission: 'admin:settings' },
  '/admin/manga': { permission: 'manga:edit' },
  '/creator/dashboard': { requireAuth: true },
  '/creator/upload': { requireAuth: true },
  '/settings': { requireAuth: true },
  '/profile': { requireAuth: true },
  '/library': { requireAuth: true },
};

function getRoutePermission(path: string): { permission?: string; roles?: string[]; requireAuth?: boolean } | null {
  if (ROUTE_PERMISSIONS[path]) return ROUTE_PERMISSIONS[path];
  const prefix = Object.keys(ROUTE_PERMISSIONS)
    .filter((k) => k.endsWith('/'))
    .sort((a, b) => b.length - a.length)
    .find((k) => path.startsWith(k));
  return prefix ? ROUTE_PERMISSIONS[prefix] : null;
}

const PROTECTED_ROUTES = [
  '/profile', '/settings', '/library', '/notifications',
  '/feed', '/bookmarks', '/following', '/achievements',
  '/transactions', '/tips', '/collections', '/corrections',
  '/sponsorships', '/reposts', '/messages',
  '/checkout', '/analytics', '/prompts',
  '/quests', '/reading-history', '/share-target',
  '/comments',
  '/admin', '/creator',
];

const PUBLIC_PREFIXES = ['/auth', '/api', '/_next', '/_rsc', '/static', '/favicon'];

function isProtectedRoute(pathname: string): boolean {
  if (pathname === '/') return false;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  if (getRoutePermission(pathname)) return true;
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

// ─── Security constants ─────────────────────────────────────────────

const STATIC_SKIP_PATHS = ['/_next/', '/static/', '/favicon.ico', '/manifest.json', '/sw.js', '/api/health', '/_rsc/'];
const CSRF_SKIP_PATHS = ['/api/webhooks', '/api/auth', '/api/health', '/api/clans', '/api/upload', '/api/user', '/api/me', '/api/comments', '/api/reports', '/api/notifications', '/api/collections', '/api/follow', '/api/creator/mangas', '/api/manga', '/api/trash'];
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
const CSP_SUFFIX = `' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com 'sha256-ieoeWczDHkReVBsRBqaal5AFMlBtNjMzgwKvLqi/tSU=' 'report-sample'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.vercel-storage.com https://*.blob.vercel-storage.com https://*.public.blob.vercel-storage.com https://ui-avatars.com https://placehold.co https://*.unsplash.com; connect-src 'self' https://api.stripe.com https://*.supabase.co https://*.ingest.sentry.io; frame-src https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; object-src 'none'; media-src 'self'; worker-src 'self'; base-uri 'self'; form-action 'self'`;

function buildCSP(nonce: string, options?: { reportUrl?: string; enforceUpgrade?: boolean }): string {
  let base = CSP_PREFIX + nonce + CSP_SUFFIX;
  if (options?.enforceUpgrade !== false) {
    base += '; upgrade-insecure-requests';
  }
  if (options?.reportUrl) {
    base += `; report-uri ${options.reportUrl}`;
  }
  return base;
}

function applySecurityHeaders(response: NextResponse, nonce: string) {
  const reportUrl = process.env.CSP_REPORT_URL;
  // Enforced CSP includes upgrade-insecure-requests
  const csp = buildCSP(nonce, { reportUrl, enforceUpgrade: true });
  // Report-only CSP excludes upgrade-insecure-requests (invalid in report-only mode)
  const cspReportOnly = buildCSP(nonce, { reportUrl, enforceUpgrade: false });

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
  if (reportUrl) {
    response.headers.set('Content-Security-Policy-Report-Only', cspReportOnly);
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

function isServerAction(request: NextRequest): boolean {
  return request.headers.get('Next-Action') !== null;
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

// ─── URL helpers ───────────────────────────────────────────────────

/** True for routes that should get locale prefix redirect/rewrite. */
function isPageRoute(pathname: string): boolean {
  return !(
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/apple-touch-icon') ||
    /\.\w+$/.test(pathname)
  );
}

/** Strip the locale prefix from `/es/path` → `/path` (or `/es` → `/`). */
function stripLocalePrefix(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(3); // strip `/en` or `/es`
  }
  return pathname;
}

// ─── Main handler ──────────────────────────────────────────────────

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const originalPath = request.nextUrl.pathname;
  const { search } = request.nextUrl;
  const method = request.method;
  const startTime = Date.now();
  const requestId = generateRequestId();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // ── Locale routing for page routes ──────────────────────────
  // Next.js 16: proxy.ts replaces middleware.ts
  if (isPageRoute(originalPath)) {
    const locale = hasLocalePrefix(originalPath);

    if (locale) {
      // Path has locale prefix (e.g. /es/profile) → rewrite internally
      const effectivePath = stripLocalePrefix(originalPath);

      // Auth check against the non-locale path
      if (isProtectedRoute(effectivePath)) {
        if (request.headers.get('RSC') !== '1') {
          try {
            const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
            if (secret) {
              const token = await getToken({ req: request, secret, cookieName: SESSION_COOKIE_NAME });
              if (!token) {
                const loginUrl = new URL('/auth/login', request.url);
                loginUrl.searchParams.set('callbackUrl', effectivePath);
                return NextResponse.redirect(loginUrl);
              }
              const routePerm = getRoutePermission(effectivePath);
              if (routePerm) {
                if (routePerm.permission) {
                  const perms = (token as any).permissions as string[] | undefined;
                  if (!perms?.includes(routePerm.permission)) {
                    return NextResponse.redirect(new URL('/', request.url));
                  }
                }
                if (routePerm.roles && !routePerm.roles.includes((token as any).role as string)) {
                  return NextResponse.redirect(new URL('/', request.url));
                }
              }
            }
          } catch {
            // Si falla la verificación, continuamos silenciosamente
          }
        }
      }

      // Build rewrite with locale header + security headers
      const newUrl = new URL(effectivePath, request.url);
      newUrl.search = search;
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-locale', locale);

      const nonce = generateNonce();
      requestHeaders.set('x-nonce', nonce);
      requestHeaders.set('Content-Security-Policy', buildCSP(nonce, { reportUrl: process.env.CSP_REPORT_URL, enforceUpgrade: true }));

      const response = NextResponse.rewrite(newUrl, {
        request: { headers: requestHeaders },
      });

      applySecurityHeaders(response, nonce);
      applyCORSHeaders(response, request);
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-CSP-Nonce', nonce);

      // CSRF validation for mutating requests (skip Server Actions — have built-in protection)
      const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
      if (isMutating && !isServerAction(request) && !validateCSRF(request)) {
        logRequest({ method, path: originalPath, statusCode: 403, duration: Date.now() - startTime, ip, userAgent, requestId });
        return new NextResponse(JSON.stringify({ error: 'CSRF validation failed' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Set CSRF cookie only if not already present
      const hasCSRFCookie = request.cookies.get(CSRF_COOKIE_NAME);
      if (!hasCSRFCookie) {
        setCSRFCookie(response);
      }

      logRequest({ method, path: originalPath, statusCode: 200, duration: Date.now() - startTime, ip, userAgent, requestId });
      return response;
    }

    // No locale prefix → detect and redirect
    const detectedLocale = getLocale(request);
    const newUrl = new URL(`/${detectedLocale}${originalPath}`, request.url);
    newUrl.search = search;
    logRequest({ method, path: originalPath, statusCode: 307, duration: Date.now() - startTime, ip, userAgent, requestId });
    return NextResponse.redirect(newUrl, 307);
  }

  // ── Non-page routes (API, static, etc.) ─────────────────────

  const pathname = originalPath; // non-page routes don't need locale stripping

  // -- Skip processing for truly static assets (no auth, no headers) --
  if (STATIC_SKIP_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // -- Handle HEAD for /api/auth/* --
  if (method === 'HEAD' && pathname.startsWith('/api/auth/')) {
    logRequest({ method, path: pathname, statusCode: 200, duration: Date.now() - startTime, ip, userAgent, requestId });
    return new NextResponse(null, { status: 200 });
  }

  // -- Redirect GET /api/auth/signin/:provider → /auth/login --
  if (method === 'GET' && /^\/api\/auth\/signin\/[^/]+$/.test(pathname)) {
    logRequest({ method, path: pathname, statusCode: 302, duration: Date.now() - startTime, ip, userAgent, requestId });
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // -- Auth check for protected page routes (non-locale) --
  if (isProtectedRoute(pathname)) {
    if (request.headers.get('RSC') !== '1') {
      try {
        const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
        if (secret) {
          const token = await getToken({ req: request, secret, cookieName: SESSION_COOKIE_NAME });
          if (!token) {
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
          }
          const routePerm = getRoutePermission(pathname);
          if (routePerm) {
            if (routePerm.permission) {
              const perms = (token as any).permissions as string[] | undefined;
              if (!perms?.includes(routePerm.permission)) {
                return NextResponse.redirect(new URL('/', request.url));
              }
            }
            if (routePerm.roles && !routePerm.roles.includes((token as any).role as string)) {
              return NextResponse.redirect(new URL('/', request.url));
            }
          }
        }
      } catch {
        // Si falla la verificación, continuamos silenciosamente
      }
    }
  }

  // RSC payload requests — skip proxy to avoid CSP/security headers interference
  if (request.headers.get('RSC') === '1') return NextResponse.next();

  // API routes return JSON, not HTML — skip nonce/CSP generation overhead.
  const isApiRoute = pathname.startsWith('/api/');

  let response: NextResponse;
  let nonce = '';

  if (isApiRoute) {
    response = NextResponse.next();
  } else {
    nonce = generateNonce();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', buildCSP(nonce, { reportUrl: process.env.CSP_REPORT_URL, enforceUpgrade: true }));

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
  const isCSRFProtected = isMutating && !isServerAction(request) && !CSRF_SKIP_PATHS.some((p) => pathname.startsWith(p));

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
  matcher: [
    // Include page routes (with locale prefixes) + API routes + static
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|apple-touch-icon).*)',
  ],
};
