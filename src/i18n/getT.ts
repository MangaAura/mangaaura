import type { Locale } from './locales';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';

type NestedRecord = { [key: string]: string | string[] | NestedRecord };
const messages: Record<Locale, NestedRecord> = { es, en };

function getNestedValue(obj: NestedRecord, path: string): string | undefined {
  const keys = path.split('.');
  let current: any = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
}

export function getT(locale: Locale) {
  return (key: string, params?: Record<string, string | number>): string => {
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
  };
}
