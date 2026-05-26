import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const createThreadSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1).max(10000),
  categoryId: z.string().uuid(),
  tags: z.array(z.string()).max(5).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const categorySlug = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (categorySlug) {
      const category = await prisma.forumCategory.findUnique({
        where: { slug: categorySlug },
      });
      if (category) where.categoryId = category.id;
    }

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
          },
          category: { select: { id: true, name: true, slug: true, icon: true } },
          _count: { select: { posts: true } },
        },
      }),
      prisma.forumThread.count({ where }),
    ]);

    return NextResponse.json({
      threads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Forum Threads] GET error:', error);
    return NextResponse.json({ error: 'Error al obtener hilos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const data = createThreadSchema.parse(body);

    const category = await prisma.forumCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);

    const thread = await prisma.forumThread.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        categoryId: data.categoryId,
        authorId: session.user.id,
        tags: JSON.stringify(data.tags || []),
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
        },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('[Forum Threads] POST error:', error);
    return NextResponse.json({ error: 'Error al crear hilo' }, { status: 500 });
  }
}
