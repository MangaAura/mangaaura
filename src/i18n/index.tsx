'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

import type { Locale } from './locales';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';

export { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './locales';
export type { Locale } from './locales';

type NestedRecord = { [key: string]: string | string[] | NestedRecord };

const messages: Record<Locale, NestedRecord> = { es, en };

export type TranslationParams = Record<string, string | number>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: NestedRecord, path: string): string | undefined {
  const keys = path.split('.');
  let current: any = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `mangaaura-locale=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export function I18nProvider({ children, defaultLocale }: { children: React.ReactNode; defaultLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => defaultLocale || 'es');

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      const msg = messages[locale];
      const value = getNestedValue(msg, key);
      if (value === undefined) {
        const esValue = getNestedValue(messages.es, key);
        if (esValue !== undefined && locale !== 'es') {
          return interpolate(esValue, params);
        }
        return key;
      }
      return interpolate(value, params);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useT() {
  return useI18n().t;
}

export function useLocale() {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}

export { messages };
