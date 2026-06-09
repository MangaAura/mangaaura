import type { Metadata } from 'next';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/i18n/locales';
import type { Locale } from '@/i18n/locales';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

/**
 * Adds language alternates (hreflang) and canonical to page metadata.
 * MangaAura uses locale prefixes (/en/) that the proxy rewrites
 * internally. The canonical and hreflang URLs use the correct locale prefix
 * so search engines see the real page URL.
 *
 * The default locale 'es' is served WITHOUT a prefix at the root URL.
 * Other locales (e.g. 'en') use a prefix like /en/path.
 */
export function withHreflang(path: string, locale?: Locale): Pick<Metadata, 'alternates'> {
  // Default locale ('es') is served without URL prefix
  const isDefaultLocale = locale === DEFAULT_LOCALE || !locale;

  // For default locale, path is used as-is. For others, add locale prefix.
  const localePath = isDefaultLocale
    ? path
    : `/${locale}${path === '/' ? '' : path}`;
  const canonical = `${BASE_URL}${localePath}`;

  const languages: Record<string, string> = {
    'x-default': `${BASE_URL}${path}`,
  };

  for (const lang of SUPPORTED_LOCALES) {
    if (lang === DEFAULT_LOCALE) {
      // Default locale → un-prefixed URL (served at root)
      languages[lang] = `${BASE_URL}${path === '/' ? '' : path}`;
    } else {
      // Other locales → prefixed URL (e.g. /en/path)
      const langPath = `/${lang}${path === '/' ? '' : path}`;
      languages[lang] = `${BASE_URL}${langPath}`;
    }
  }

  return {
    alternates: {
      canonical,
      languages,
    },
  };
}


