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
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Headers for caching (skip _next/static to avoid warnings)
  async headers() {
    return [
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
        source: '/creator/analytics',
        destination: '/analytics?tab=creator',
        permanent: true,
      },
      {
        source: '/search',
        destination: '/search_ia',
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
// Sourcemap uploads are only enabled when the org is explicitly configured
// (not just falling back to the default). This prevents build failures from
// guessing the wrong org slug (e.g., using the project slug as the org slug).
const enableSentryBuildOps = !!(sentryAuthToken && sentryOrg);

const withSentry = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: sentryOrg || "mangaaura",
      project: process.env.SENTRY_PROJECT || "mangaaura-web",
      authToken: sentryAuthToken || undefined,
      silent: true,
      widenClientFileUpload: true,
      sourcemaps: {
        // Disable sourcemap upload when required vars are missing.
        // This prevents "Project not found" build failures from sentry-cli.
        disable: !enableSentryBuildOps,
        deleteSourcemapsAfterUpload: true,
      },
      errorHandler: (err: Error) => {
        console.warn('[Sentry] Build warning (non-fatal):', err.message);
      },
      // disableLogger is deprecated and unsupported with Turbopack
      // automaticVercelMonitors is deprecated and unsupported with Turbopack
    })
  : nextConfig;

export default withBundleAnalyzer(withSentry);
