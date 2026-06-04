import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

type BundleAnalyzerFn = (config: NextConfig) => NextConfig;
let withBundleAnalyzer: BundleAnalyzerFn = (config) => config;
if (process.env.ANALYZE === 'true') {
  try {
    withBundleAnalyzer = require('@next/bundle-analyzer').default({ enabled: true });
  } catch {
    console.warn('Bundle analyzer not available');
  }
}

const nextConfig: NextConfig = {
  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      'canvas': 'canvas/browser', // For chart.js compatibility
    },
  },

  // Experimental features
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
    ],
    // Enable optimistic client-side navigation
    optimisticClientCache: true,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
      },
    ],
    dangerouslyAllowSVG: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 176, 256, 384],
    minimumCacheTTL: 86400,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Compiler optimizations
  compiler: {
    // Remove console.log/debug in production, keep error/warn for monitoring
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn', 'info', 'trace'] }
        : false,
  },


  // Headers for caching and security
  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        source: '/api/manga',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/api/search',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/api/rankings',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/api/gamification/xp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
      // Only static assets outside of _next
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/reader/:slug',
        destination: '/reader?chapterId=:slug',
        permanent: true,
      },
      {
        source: '/reader',
        has: [{ type: 'query', key: 'mangaSlug' }, { type: 'query', key: 'chapterNumber' }],
        destination: '/:mangaSlug-:chapterNumber',
        permanent: true,
      },
      {
        source: '/creator/analytics',
        destination: '/analytics?tab=creator',
        permanent: true,
      },
      {
        source: '/search',
        destination: '/search-ai',
        permanent: true,
      },
      // Spanish → English route redirects
      {
        source: '/como-funciona',
        destination: '/how-it-works',
        permanent: true,
      },
      {
        source: '/contacto',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/guias',
        destination: '/guides',
        permanent: true,
      },
      {
        source: '/guias/donde-leer-manga-legal-seguro',
        destination: '/guides/where-to-read-manga-legally',
        permanent: true,
      },
      {
        source: '/guias/mejores-apps-leer-manga',
        destination: '/guides/best-apps-to-read-manga',
        permanent: true,
      },
      {
        source: '/guias/comprar-manga-digital-espana',
        destination: '/guides/buying-manga-digital-spain',
        permanent: true,
      },
      {
        source: '/guias/guia-principiantes-manga',
        destination: '/guides/beginners-guide-to-manga',
        permanent: true,
      },
      {
        source: '/guias/aplicaciones-recomendaciones-personalizadas',
        destination: '/guides/personalized-recommendations-apps',
        permanent: true,
      },
      {
        source: '/guias/manga-mas-vendido-historia',
        destination: '/guides/best-selling-manga-history',
        permanent: true,
      },
      {
        source: '/sobre-nosotros',
        destination: '/about-us',
        permanent: true,
      },
      {
        source: '/search_ia',
        destination: '/search-ai',
        permanent: true,
      },
    ];
  },

};

// Wrap with Sentry if SENTRY_DSN is configured (runtime error tracking).
// Sourcemap + release uploads require ALL of: SENTRY_AUTH_TOKEN + explicit SENTRY_ORG + SENTRY_PROJECT.
// If any is missing, only runtime error tracking is active — no builds will fail.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
// Sentry build operations (sourcemap uploads, release tracking) require ALL
// three env vars to be explicitly set. If any is missing, skip build ops —
// runtime error tracking via sentry.{client,server,edge}.config.ts still works.
const enableSentryBuildOps = !!(sentryAuthToken && sentryOrg && sentryProject);

// Runtime Sentry error tracking initializes separately in sentry.{client,server,edge}.config.ts
// `withSentryConfig` is only needed for build-time operations (sourcemaps, release + deploy tracking).
// Only enable when ALL required env vars are present to avoid sentry-cli errors.
const withSentry = enableSentryBuildOps
  ? withSentryConfig(nextConfig, {
      org: sentryOrg!,
      project: process.env.SENTRY_PROJECT!,
      authToken: sentryAuthToken!,
      silent: false,
      widenClientFileUpload: true,
      sourcemaps: {
        disable: false,
        deleteSourcemapsAfterUpload: true,
      },
      errorHandler: (err: Error) => {
        console.warn('[Sentry] Build warning:', err.message);
        console.warn('[Sentry] Tip: Verify SENTRY_ORG and SENTRY_PROJECT slugs match your Sentry account.');
      },
    })
  : nextConfig;

export default withBundleAnalyzer(withSentry);
