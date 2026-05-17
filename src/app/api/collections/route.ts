import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { CreateCollectionUseCase } from '@/application/use-cases/collections/CreateCollectionUseCase';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

const collectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
});

const createCollectionUseCase = new CreateCollectionUseCase();

// GET /api/collections - List collections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const filter = searchParams.get('filter') as 'all' | 'public' | 'private' | null;
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '12'), 1), 100);

    const session = await auth();
    const currentUserId = session?.user?.id;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (filter === 'public') {
      where.isPublic = true;
    } else if (filter === 'private' && currentUserId) {
      where.userId = currentUserId;
      where.isPublic = false;
    } else if (!currentUserId) {
      where.isPublic = true;
    } else {
      where.OR = [
        { isPublic: true },
        { userId: currentUserId },
      ];
    }

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { items: true },
          },
          items: {
            take: 3,
            include: {
              manga: {
                select: {
                  id: true,
                  title: true,
                  coverUrl: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.collection.count({ where }),
    ]);

    const formattedCollections = collections.map((c: any) => ({
      id: c.id,
      name: c.title,
      description: c.description,
      isPublic: c.isPublic,
      user: c.user,
      _count: { mangas: c._count.items },
      previewMangas: c.items.map((item: any) => ({
        id: item.manga.id,
        title: item.manga.title,
        cover: item.manga.coverUrl,
      })),
    }));

    return NextResponse.json({
      collections: formattedCollections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Error al cargar colecciones' },
      { status: 500 }
    );
  }
}

// POST /api/collections - Create collection
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session?.user?.id || 'anonymous';
    const { allowed } = await rateLimit(getRateLimitKey('collection', userId), 20, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = collectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, description, isPublic } = parsed.data;

    const collection = await createCollectionUseCase.execute({
      userId: session.user.id,
      name,
      description,
      isPublic,
    });

    return NextResponse.json({
      collection: {
        id: collection.id,
        name: collection.title,
        description: collection.description,
        isPublic: collection.isPublic,
        _count: { mangas: collection.itemCount },
        previewMangas: [],
      },
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Error al crear colección' },
      { status: 500 }
    );
  }
}
