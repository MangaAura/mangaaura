import { NextResponse } from 'next/server';

import { withCache, generateCacheKey, cacheConfig } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cacheKey = generateCacheKey('genres:counts', {});
    const result = await withCache(cacheKey, cacheConfig.manga.list.ttl, async () => {
      const genres = await prisma.genre.findMany({
        select: { slug: true },
      });

      const counts = await Promise.all(
        genres.map(async (g) => {
          const count = await prisma.mangaSeries.count({
            where: { tags: { contains: g.slug }, status: { not: 'DRAFT' } },
          });
          return { slug: g.slug, _count: count };
        })
      );

      return { counts };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching genre counts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
