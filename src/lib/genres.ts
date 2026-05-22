/**
 * Genres utility
 *
 * Utility functions to sync genre tags from manga to the Genre database table.
 * Genres are automatically created/updated when a manga is created with new tags.
 */

import { prisma } from '@/lib/prisma';

/**
 * Normalize a genre string: lowercase + trim + strip diacritics.
 */
export function normalizeGenreKey(s: string): string {
  return s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Generate a URL-friendly slug from a genre name.
 */
export function genreNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Sync a list of tags into the Genre table.
 * Any tag that doesn't exist as a Genre yet will be created.
 * Tags that already exist are left unchanged.
 *
 * Call this whenever a manga is created or updated with new tags.
 */
export async function syncGenresFromTags(tags: string[]): Promise<void> {
  if (!tags || tags.length === 0) return;

  const normalizedSet = new Set<string>();

  for (const tag of tags) {
    const normalized = normalizeGenreKey(tag);
    if (!normalized || normalizedSet.has(normalized)) continue;
    normalizedSet.add(normalized);

    const slug = genreNameToSlug(tag);
    if (!slug) continue;

    try {
      await prisma.genre.upsert({
        where: { slug },
        create: {
          name: tag.toLowerCase().trim(),
          slug,
        },
        update: {}, // Don't update if exists — keep original name
      });
    } catch (error) {
      // Silently skip duplicates from race conditions
      if (
        error instanceof Error &&
        !error.message.includes('Unique constraint failed')
      ) {
        console.error(`[genres] Error syncing genre "${tag}":`, error);
      }
    }
  }
}

export interface GenreWithDisplay {
  id: string;
  name: string;
  slug: string;
}

/**
 * Get all genres from the database.
 */
export async function getAllGenres(): Promise<GenreWithDisplay[]> {
  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
  });
  return genres.map((g: { id: string; name: string; slug: string }) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
  }));
}
