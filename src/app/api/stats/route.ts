import { NextResponse } from 'next/server';

import { withCache, generateCacheKey, cacheConfig } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cacheKey = generateCacheKey('stats:homepage', {});

    const stats = await withCache(cacheKey, cacheConfig.stats.homepage.ttl, async () => {
      const whereActive = { deletedAt: null };

      const [totalMangas, totalReaders, totalChapters] = await Promise.all([
        prisma.mangaSeries.count({ where: whereActive }),
        prisma.user.count(),
        prisma.chapter.count(),
      ]);

      return { totalMangas, totalReaders, totalChapters };
    });

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[API /stats] Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
