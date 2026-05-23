import { NextResponse } from 'next/server';

import { GENRE_CATEGORIES } from '@/constants/genres';
import { withCache, generateCacheKey, cacheConfig } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';

// GET /api/genres - Listar todos los géneros
export async function GET() {
  try {
    const cacheKey = generateCacheKey('genres:list', {});

    const result = await withCache(
      cacheKey,
      cacheConfig.manga.list.ttl,
      async () => {
        const genres = await prisma.genre.findMany({
          orderBy: { name: 'asc' },
        });

        if (genres.length === 0) {
          const fallbackNames: Record<string, string> = {
            accion: 'acción', aventura: 'aventura', 'ciencia-ficcion': 'ciencia ficción',
            comedia: 'comedia', escolar: 'escolar', fantasia: 'fantasía',
            magia: 'magia', mecha: 'mecha', misterio: 'misterio',
            oscuro: 'oscuro', policiaco: 'policíaco', robots: 'robots',
            romance: 'romance', 'slice-of-life': 'slice of life', suspenso: 'suspenso',
          };
          return GENRE_CATEGORIES.map((g) => ({
            id: g.slug,
            name: fallbackNames[g.slug] || g.tag,
            slug: g.slug,
          }));
        }

        return genres.map((g: { id: string; name: string; slug: string; createdAt: Date }) => ({
          id: g.id,
          name: g.name,
          slug: g.slug,
          createdAt: g.createdAt.toISOString(),
        }));
      },
    );

    return NextResponse.json({ genres: result });
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
