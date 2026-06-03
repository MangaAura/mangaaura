/**
 * middleware.ts — Delegates to `src/proxy.ts`.
 *
 * Next.js 16 uses `src/proxy.ts` as the routing boundary instead of a root
 * `middleware.ts`. This file exists solely to keep a root middleware.ts file
 * in the project while delegating all actual logic to `src/proxy.ts`.
 *
 * The `config.matcher` is defined inline because Next.js requires it to be
 * statically analyzable at build time. The actual request handling is done
 * by the `proxy()` function in `src/proxy.ts`.
 */
export { proxy as middleware } from '@/proxy';

// Config must be inline — Next.js needs static analysis
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|apple-touch-icon.png|og-image.webp|manifest.json|sw.js|workbox-).*)',
  ],
};
