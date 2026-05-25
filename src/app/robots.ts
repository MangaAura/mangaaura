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
        allow: '/',
        disallow: ['/api', '/admin', '/creator'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api', '/admin'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api', '/admin', '/creator', '/auth'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api', '/admin', '/creator', '/auth'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/api', '/admin', '/creator', '/auth'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api', '/admin', '/creator', '/auth'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/api', '/admin', '/creator', '/auth'],
      },
      {
        userAgent: 'AhrefsBot',
        crawlDelay: 10,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
