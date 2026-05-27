import { NextRequest, NextResponse } from 'next/server';

import { withCache, generateCacheKey, cacheConfig, invalidateCache } from '@/lib/apiCache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncGenresFromTags } from '@/lib/genres';
import { uploadImage } from '@/lib/storage';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || 'untitled';
}

// POST /api/creator/mangas - Crear nuevo manga (multipart/form-data)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = (formData.get('title') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const tagsRaw = formData.get('tags') as string;
    const coverFile = formData.get('cover') as File | null;

    if (!title || title.length < 3) {
      return NextResponse.json({ error: 'El título debe tener al menos 3 caracteres' }, { status: 400 });
    }
    if (title.length > 100) {
      return NextResponse.json({ error: 'El título debe tener menos de 100 caracteres' }, { status: 400 });
    }

    const processedTags = tagsRaw ? JSON.parse(tagsRaw).map((t: string) => t.toLowerCase().trim()) : [];

    // Upload cover if provided
    let coverUrl: string | null = null;
    if (coverFile) {
      const uploadResult = await uploadImage(coverFile, `covers/${session.user.id}`);
      coverUrl = uploadResult.url;
    }

    // Generate unique slug
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.mangaSeries.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { displayName: true, username: true },
    });

    await syncGenresFromTags(processedTags);

    const manga = await prisma.mangaSeries.create({
      data: {
        title,
        slug,
        description,
        coverUrl,
        authorId: session.user.id,
        authorName: user?.displayName || user?.username || 'Unknown',
        tags: JSON.stringify(processedTags),
        status: 'ONGOING',
      },
    });

    // Create MangaGenre links
    for (const tagName of processedTags) {
      const slug = tagName
        .toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (!slug) continue;
      const genre = await prisma.genre.findUnique({ where: { slug } });
      if (genre) {
        await prisma.mangaGenre.create({
          data: { mangaId: manga.id, genreId: genre.id },
        }).catch(() => { /* ignore duplicate */ });
      }
    }

    await invalidateCache('creator:mangas');

    return NextResponse.json({ id: manga.id, slug: manga.slug }, { status: 201 });
  } catch (error) {
    console.error('Error creando manga:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET /api/creator/mangas - Listar todos los mangas del creador logueado
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Generate cache key
    const cacheKey = generateCacheKey('creator:mangas:dashboard', {
      userId: session.user.id,
      page,
      limit,
      status: status || 'all',
      search: search || 'all',
    });

    const userId = session.user.id;
    
    const result = await withCache(
      cacheKey,
      cacheConfig.manga.list.ttl,
      async () => {
        const where: Record<string, unknown> = {
          authorId: userId,
          deletedAt: null,
        };

        if (status) {
          where.status = status.toUpperCase();
        }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

      const [mangas, total, statsAgg, totalChaptersCount] = await Promise.all([
      prisma.mangaSeries.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverUrl: true,
          status: true,
          tags: true,
          rating: true,
          totalViews: true,
          createdAt: true,
          updatedAt: true,
          mangaGenres: {
            select: { genre: { select: { name: true, slug: true } } },
          },
        },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
          }),
          prisma.mangaSeries.count({ where }),
          prisma.mangaSeries.aggregate({
            where: { authorId: userId },
            _sum: { totalViews: true },
            _avg: { rating: true },
          }),
          prisma.chapter.count({
            where: { manga: { authorId: userId } },
          }),
        ]);

    // Obtener información de capítulos para todos los mangas - use select para evitar over-fetching
    const mangaIds = mangas.map((m) => m.id);
    const chapters = await prisma.chapter.findMany({
      where: { mangaId: { in: mangaIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        mangaId: true,
        chapterNumber: true,
        title: true,
        viewCount: true,
        createdAt: true,
      },
      take: mangaIds.length * 10, // Limit to recent chapters only for performance
    });

        // Agrupar capítulos por manga
        const chaptersByManga = new Map<string, typeof chapters>();
        chapters.forEach((ch) => {
          if (!chaptersByManga.has(ch.mangaId)) {
            chaptersByManga.set(ch.mangaId, []);
          }
          chaptersByManga.get(ch.mangaId)!.push(ch);
        });

        // Calcular estadísticas para cada manga
        const mangasWithStats = mangas.map((manga) => {
          const mangaChapters = chaptersByManga.get(manga.id) || [];
          const totalChapterViews = mangaChapters.reduce(
            (sum: number, ch) => sum + ch.viewCount,
            0
          );
          const lastUpdate =
            mangaChapters.length > 0
              ? mangaChapters[0].createdAt
              : manga.updatedAt;

          const genres = manga.mangaGenres.map(mg => mg.genre.name);

          return {
            id: manga.id,
            title: manga.title,
            slug: manga.slug,
            description: manga.description,
            coverUrl: manga.coverUrl,
            status: manga.status,
            tags: genres.length > 0 ? genres : (manga.tags ? JSON.parse(manga.tags) : []),
            rating: manga.rating,
            totalViews: manga.totalViews,
            createdAt: manga.createdAt,
            updatedAt: manga.updatedAt,
            stats: {
              chapterCount: mangaChapters.length,
              totalChapterViews,
              lastUpdate,
            },
            recentChapters: mangaChapters.slice(0, 5).map((ch) => ({
              id: ch.id,
              chapterNumber: ch.chapterNumber,
              title: ch.title,
              viewCount: ch.viewCount,
              createdAt: ch.createdAt,
            })),
          };
        });

        const dashboardStats = {
          totalMangas: total,
          totalChapters: totalChaptersCount,
          totalViews: statsAgg._sum.totalViews || 0,
          viewsThisMonth: 0,
          viewsThisWeek: 0,
          averageRating: statsAgg._avg.rating || 0,
          growthRate: 0,
        };

        return {
          mangas: mangasWithStats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          dashboardStats,
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error obteniendo mangas del creador:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
