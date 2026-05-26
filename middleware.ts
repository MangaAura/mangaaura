import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip non-page routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/apple-touch-icon') ||
    /\.\w+$/.test(pathname) // files with extensions (images, fonts, etc.)
  ) {
    // If it has x-locale from a previous rewrite, let it through
    // Otherwise, skip middleware
    return NextResponse.next();
  }

  // Check if path already has a locale prefix
  const locale = hasLocalePrefix(pathname);
  if (locale) {
    // Rewrite internally without the locale prefix, and set x-locale header
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    const newUrl = new URL(pathWithoutLocale, request.url);
    newUrl.search = search;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', locale);

    return NextResponse.rewrite(newUrl, {
      request: { headers: requestHeaders },
    });
  }

  // No locale prefix — detect and redirect
  const detectedLocale = getLocale(request);
  const newUrl = new URL(`/${detectedLocale}${pathname}`, request.url);
  newUrl.search = search;

  // 307 redirect to preserve the HTTP method
  return NextResponse.redirect(newUrl, 307);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, fonts, manifests
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|apple-touch-icon).*)',
  ],
};
