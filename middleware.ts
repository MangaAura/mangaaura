// ─── Thin wrapper ───────────────────────────────────────────────────
// All middleware logic is centralized in src/proxy.ts.
// Next.js auto-detects this file at the project root.
import type { NextRequest } from 'next/server';
import { proxy } from '@/proxy';

export async function middleware(request: NextRequest) {
  return proxy(request);
}

// Next.js requires the config to be exported directly (cannot be re-exported).
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|sitemap.xml|robots.txt|icons|offline|.*\\.svg$).*)'],
};
