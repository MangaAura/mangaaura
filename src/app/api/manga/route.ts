import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withCache, generateCacheKey, cacheConfig, invalidateCache } from '@/lib/apiCache';

// Helper para generar slug desde el título
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

// GET /api/manga - Listar mangas del usuario autenticado
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

    // Generate cache key
    const cacheKey = generateCacheKey('user:mangas:list', {
      userId: session.user.id,
      page,
      limit,
    });

    const userId = session.user.id;

    const result = await withCache(
      cacheKey,
      cacheConfig.manga.list.ttl,
      async () => {
        const where = { authorId: userId };

        const [mangas, total] = await Promise.all([
          prisma.mangaSeries.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.mangaSeries.count({ where }),
        ]);

        // Obtener conteo de capítulos para cada manga
        const mangaIds = mangas.map((m: any) => m.id);
        const chapterCounts = await prisma.chapter.groupBy({
          by: ['mangaId'],
          where: { mangaId: { in: mangaIds } },
          _count: { mangaId: true },
        });

        const chapterCountMap = new Map(chapterCounts.map((c: any) => [c.mangaId, c._count.mangaId]));

        return {
          mangas: mangas.map((manga: any) => ({
            id: manga.id,
            title: manga.title,
            slug: manga.slug,
            description: manga.description,
            coverUrl: manga.coverUrl,
            status: manga.status,
            tags: manga.tags ? JSON.parse(manga.tags) : [],
            authorId: manga.authorId,
            authorName: manga.authorName,
            rating: manga.rating,
            totalViews: manga.totalViews,
            chapterCount: chapterCountMap.get(manga.id) || 0,
            createdAt: manga.createdAt,
            updatedAt: manga.updatedAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listando mangas del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/manga - Crear nuevo manga
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, coverUrl, tags } = body;

    // Validaciones
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }

    if (title.trim().length > 200) {
      return NextResponse.json(
        { error: 'El título no puede exceder 200 caracteres' },
        { status: 400 }
      );
    }

    // Generar slug automáticamente desde el título
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    // Verificar unicidad del slug y generar uno único si es necesario
    while (await prisma.mangaSeries.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Obtener información del usuario para el authorName
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { displayName: true, username: true },
    });

    const authorName = user?.displayName || user?.username || 'Unknown';

    // Crear el manga
    const manga = await prisma.mangaSeries.create({
      data: {
        title: title.trim(),
        slug,
        description: description || null,
        coverUrl: coverUrl || null,
        authorId: session.user.id,
        authorName,
        tags: tags && Array.isArray(tags) ? JSON.stringify(tags.map((t: string) => t.toLowerCase().trim())) : '[]',
        status: 'ONGOING',
      },
    });

    // Invalidar cache de listas
    await invalidateCache('user:mangas:list');
    await invalidateCache('manga:list');

    return NextResponse.json(
      {
        message: 'Manga creado exitosamente',
        manga: {
          id: manga.id,
          title: manga.title,
          slug: manga.slug,
          description: manga.description,
          coverUrl: manga.coverUrl,
          authorId: manga.authorId,
          authorName: manga.authorName,
          status: manga.status,
          tags: manga.tags ? JSON.parse(manga.tags) : [],
          totalViews: manga.totalViews,
          createdAt: manga.createdAt,
          updatedAt: manga.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creando manga:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
