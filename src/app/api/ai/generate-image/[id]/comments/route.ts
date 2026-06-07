import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List comments for an image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const [comments, total] = await Promise.all([
      prisma.imageGenerationComment.findMany({
        where: { imageId: id, parentId: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, level: true },
          },
          replies: {
            orderBy: { createdAt: 'asc' },
            take: 5,
            include: {
              user: {
                select: { id: true, username: true, displayName: true, avatarUrl: true, level: true },
              },
            },
          },
        },
      }),
      prisma.imageGenerationComment.count({
        where: { imageId: id, parentId: null },
      }),
    ]);

    // Get session to pass to client (not checking comment likes to avoid FK constraint)
    const session = await auth();

    const transformed = comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: {
        ...c.user,
        isCurrentUser: session?.user?.id === c.user.id,
      },
      replies: c.replies.map((r) => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt,
        user: {
          ...r.user,
          isCurrentUser: session?.user?.id === r.user.id,
        },
      })),
    }));

    return NextResponse.json({
      comments: transformed,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Image Comments GET] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'El comentario no puede estar vacío' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Máximo 1000 caracteres' }, { status: 400 });
    }

    // Verify image exists and is public or owned
    const image = await prisma.imageGeneration.findFirst({
      where: { id, OR: [{ isPublic: true }, { userId }] },
      select: { id: true },
    });
    if (!image) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    // If reply, verify parent comment exists on this image
    if (parentId) {
      const parent = await prisma.imageGenerationComment.findFirst({
        where: { id: parentId, imageId: id },
        select: { id: true },
      });
      if (!parent) {
        return NextResponse.json({ error: 'Comentario padre no encontrado' }, { status: 404 });
      }
    }

    const comment = await prisma.imageGenerationComment.create({
      data: {
        imageId: id,
        userId,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, level: true },
        },
      },
    });

    // Increment comment count on image
    await prisma.imageGeneration.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error('[Image Comments POST] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
