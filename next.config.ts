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
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Output configuration for optimized builds
  // Temporarily disabled - causing chunk loading issues
  // output: 'standalone',

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
    ];
  },

};

// Wrap with Sentry if SENTRY_DSN is configured
const withSentry = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG || "inkverse",
      project: process.env.SENTRY_PROJECT || "inkverse-web",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      sourcemaps: { disable: false, deleteSourcemapsAfterUpload: true },
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig;

export default withBundleAnalyzer(withSentry);
