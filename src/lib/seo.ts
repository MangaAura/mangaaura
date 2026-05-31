import type { Metadata } from 'next';

import { SUPPORTED_LOCALES } from '@/i18n/locales';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaaura.es';

/**
 * Adds language alternates (hreflang) to page metadata.
 * Since MangaAura uses a single-URL approach (no /es/ or /en/ prefixes),
 * all language alternates point to the same URL. Each variant is annotated
 * with its hreflang so search engines and AI crawlers know the content
 * is available in multiple languages at the same URL.
 */
export function withHreflang(path: string): Pick<Metadata, 'alternates'> {
  const languages: Record<string, string> = {
    'x-default': `${BASE_URL}${path}`,
  };

  for (const lang of SUPPORTED_LOCALES) {
    languages[lang] = `${BASE_URL}${path}`;
  }

  return {
    alternates: {
      canonical: `${BASE_URL}${path}`,
      languages,
    },
  };
}


