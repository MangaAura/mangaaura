import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXTAUTH_URL || 'https://inkverse.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/browse',
          '/search',
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
        userAgent: 'AhrefsBot',
        crawlDelay: 10,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
