import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXTAUTH_URL || 'https://mangaaura.es';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/search_ia',
          '/rankings',
          '/library',
          '/manga',
          '/reader',
          '/community',
          '/events',
        ],
        disallow: [
          '/api',
          '/admin',
          '/creator',
          '/checkout',
          '/auth',
          '/_next',
          '/static',
          '/private',
          '/conversations',
          '/notifications',
          '/settings',
          '/*.json$',
          '/*.xml$',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api', '/admin'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      {
        userAgent: 'AhrefsBot',
        crawlDelay: 10,
      },
      {
        userAgent: 'SemrushBot',
        crawlDelay: 10,
      },
      {
        userAgent: 'Applebot',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      // AI search crawlers
      {
        userAgent: 'OAI-SearchBot',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      {
        userAgent: 'CCBot',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      {
        userAgent: 'Bytespider',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      {
        userAgent: 'cohere-ai',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      {
        userAgent: 'YouBot',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
      {
        userAgent: 'GoogleOther',
        allow: ['/', '/creator/manga/new', '/creator/sponsors'],
        disallow: ['/api', '/admin', '/creator/dashboard', '/creator/upload', '/creator/settings', '/auth'],
      },
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/news-sitemap.xml`],
    host: BASE_URL,
  };
}
