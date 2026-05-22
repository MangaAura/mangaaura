import { cookies, headers } from 'next/headers';

import type { Locale } from './locales';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locales';

export async function getLocaleFromCookies(): Promise<Locale | null> {
  const cookieStore = await cookies();
  const stored = cookieStore.get('mangaaura-locale')?.value;
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }
  return null;
}

export function getLocaleFromHeaders(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const lang = acceptLanguage.split(',')[0]?.split('-')[0] as Locale;
  if (SUPPORTED_LOCALES.includes(lang)) {
    return lang;
  }
  return DEFAULT_LOCALE;
}

export async function detectLocale(): Promise<Locale> {
  const fromCookie = await getLocaleFromCookies();
  if (fromCookie) return fromCookie;
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || undefined;
  return getLocaleFromHeaders(acceptLanguage);
}
