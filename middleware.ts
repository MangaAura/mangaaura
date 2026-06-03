import { NextRequest, NextResponse } from 'next/server';

/**
 * middleware.ts — Wraps `src/proxy.ts`.
 *
 * Next.js 16 uses `src/proxy.ts` as the routing boundary. This root
 * middleware.ts file wraps the proxy function so both files are present.
 *
 * The `config.matcher` is defined inline because Next.js requires it to be
 * statically analyzable at build time. The actual request handling is
 * delegated to the `proxy()` function in `src/proxy.ts`.
 */
import { proxy } from './src/proxy';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  return proxy(request);
}

// Config must be inline — Next.js needs static analysis
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|apple-touch-icon.png|og-image.webp|manifest.json|sw.js|workbox-).*)',
  ],
};
