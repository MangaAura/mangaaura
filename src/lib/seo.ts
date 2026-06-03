import type { Metadata } from 'next';

import { SUPPORTED_LOCALES } from '@/i18n/locales';
import type { Locale } from '@/i18n/locales';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

/**
 * Adds language alternates (hreflang) and canonical to page metadata.
 * MangaAura uses locale prefixes (/es/, /en/) that the proxy rewrites
 * internally. The canonical and hreflang URLs include the locale prefix
 * so search engines see the correct page URL.
 */
export function withHreflang(path: string, locale?: Locale): Pick<Metadata, 'alternates'> {
  // Build locale-prefixed canonical URL
  const localePath = locale ? `/${locale}${path === '/' ? '' : path}` : path;
  const canonical = `${BASE_URL}${localePath}`;

  const languages: Record<string, string> = {
    'x-default': `${BASE_URL}${path}`,
  };

  for (const lang of SUPPORTED_LOCALES) {
    const langPath = lang === (locale || 'es') ? localePath : `/${lang}${path === '/' ? '' : path}`;
    languages[lang] = `${BASE_URL}${langPath}`;
  }

  return {
    alternates: {
      canonical,
      languages,
    },
  };
}


