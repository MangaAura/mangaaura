/**
 * translate.ts
 *
 * Utilidad de traducción reutilizable usando Google Translate (gratis, sin API key).
 * Usada para auto-traducir artículos de noticias al crear/editar.
 */

import { translate } from '@vitalets/google-translate-api';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Traduce un texto con reintentos automáticos y protección de placeholders.
 */
export async function translateText(
  text: string,
  from: string,
  to: string,
  retries = 2,
): Promise<string> {
  // Proteger placeholders estilo {name} antes de traducir
  const placeholderMap = new Map<string, string>();
  let idx = 0;
  const safe = text.replace(/\{(\w+)\}/g, (_, key) => {
    const token = `__PH${idx}__`;
    placeholderMap.set(token, `{${key}}`);
    idx++;
    return token;
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await translate(safe, { from, to });

      // Restaurar placeholders
      let translated = result.text;
      for (const [token, original] of placeholderMap) {
        translated = translated.replace(
          new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          original,
        );
      }

      return translated;
    } catch (err: any) {
      if (attempt < retries) {
        const wait = 2000 * (attempt + 1);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }

  throw new Error('Unexpected: all retries exhausted');
}

export interface NewsArticleInput {
  title: string;
  excerpt: string;
  content: string;
  titleEn?: string | null;
  excerptEn?: string | null;
  contentEn?: string | null;
}

export interface TranslatedFields {
  titleEn: string | null;
  excerptEn: string | null;
  contentEn: string | null;
}

/**
 * Auto-traduce los campos vacíos de un artículo de noticias.
 *
 * - Si los campos en inglés (titleEn, excerptEn, contentEn) están vacíos,
 *   traduce automáticamente desde español.
 * - Si solo algunos campos en inglés están vacíos, traduce solo esos.
 *
 * @returns Los campos traducidos (o null si no se necesitó traducción)
 */
export async function autoTranslateNewsArticle(
  article: NewsArticleInput,
): Promise<TranslatedFields | null> {
  const needsTranslation =
    (!article.titleEn && article.title) ||
    (!article.excerptEn && article.excerpt) ||
    (!article.contentEn && article.content);

  if (!needsTranslation) return null;

  const [titleEn, excerptEn, contentEn] = await Promise.all([
    !article.titleEn && article.title
      ? translateText(article.title, 'es', 'en').catch(() => null)
      : null,
    !article.excerptEn && article.excerpt
      ? translateText(article.excerpt, 'es', 'en').catch(() => null)
      : null,
    !article.contentEn && article.content
      ? translateText(article.content, 'es', 'en').catch(() => null)
      : null,
  ]);

  // If all translations failed, return null
  if (!titleEn && !excerptEn && !contentEn) return null;

  return {
    titleEn: titleEn ?? article.titleEn ?? null,
    excerptEn: excerptEn ?? article.excerptEn ?? null,
    contentEn: contentEn ?? article.contentEn ?? null,
  };
}
