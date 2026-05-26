import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const createPostSchema = z.object({
  content: z.string().min(1).max(10000),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const thread = await prisma.forumThread.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
        },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 });
    }

    await prisma.forumThread.update({
      where: { id: thread.id },
      data: { viewCount: { increment: 1 } },
    });

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where: { threadId: thread.id },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
          },
        },
      }),
      prisma.forumPost.count({ where: { threadId: thread.id } }),
    ]);

    return NextResponse.json({
      thread,
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Forum Thread Detail] GET error:', error);
    return NextResponse.json({ error: 'Error al obtener hilo' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const { slug } = await params;
    const thread = await prisma.forumThread.findUnique({ where: { slug } });
    if (!thread) {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 });
    }

    if (thread.isLocked) {
      return NextResponse.json({ error: 'Este hilo está cerrado' }, { status: 403 });
    }

    const body = await request.json();
    const data = createPostSchema.parse(body);

    const post = await prisma.forumPost.create({
      data: {
        content: data.content,
        threadId: thread.id,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    console.error('[Forum Thread Detail] POST error:', error);
    return NextResponse.json({ error: 'Error al crear respuesta' }, { status: 500 });
  }
}
