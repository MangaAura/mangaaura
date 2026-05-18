import { NextRequest, NextResponse } from 'next/server';

import { getNotificationService } from '@/core/services/NotificationService';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// POST /api/chapters/[id]/comments/[commentId]/like - Like a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: chapterId, commentId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const userId = session.user.id;

    // Check if comment exists and is not deleted
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        chapterId,
        isDeleted: false,
      },
      select: {
        id: true,
        userId: true,
        likesCount: true,
        content: true,
        chapter: {
          select: {
            mangaId: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    // Prevent liking own comment
    if (comment.userId === userId) {
      return NextResponse.json(
        { error: 'No puedes dar like a tu propio comentario' },
        { status: 400 }
      );
    }

    // Check if already liked (prevent duplicates)
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Ya has dado like a este comentario' },
        { status: 409 }
      );
    }

// Create like and increment likesCount in transaction
  const result = await prisma.$transaction(async (tx: any) => {
      // Create the like
      const like = await tx.commentLike.create({
        data: {
          commentId,
          userId,
        },
      });

      // Increment likesCount on comment
      const updatedComment = await tx.comment.update({
        where: { id: commentId },
        data: {
          likesCount: { increment: 1 },
        },
        select: {
          id: true,
          likesCount: true,
        },
      });

      return { like, updatedComment };
    });

  // Notify comment owner (async, don't wait)
  if (comment.userId !== userId) {
    try {
      await (await getNotificationService()).createNotification({
        userId: comment.userId,
        type: 'COMMENT_LIKE',
        title: '👍 Nuevo like',
        message: `${session.user.name || session.user.email || 'Usuario'} le dio like a tu comentario`,
        data: {
          likerId: userId,
          likerName: session.user.name || session.user.email || 'Usuario',
          likerImage: session.user.image || undefined,
          chapterId,
          commentId,
        },
        linkUrl: `/manga/${comment.chapter?.mangaId || ''}/chapter/${chapterId}`,
      } as any);
      } catch (error) {
        console.error('[Like] Error sending notification:', error);
      }
    }

    return NextResponse.json({
      success: true,
      likesCount: result.updatedComment.likesCount,
      isLiked: true,
    });
  } catch (error) {
    console.error('Error giving like to comment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/chapters/[id]/comments/[commentId]/like - Unlike a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: chapterId, commentId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const userId = session.user.id;

    // Check if comment exists
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        chapterId,
      },
      select: { id: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    // Check if like exists
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: 'No has dado like a este comentario' },
        { status: 404 }
      );
    }

// Delete like and decrement likesCount in transaction
  const result = await prisma.$transaction(async (tx: any) => {
      // Delete the like
      await tx.commentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });

      // Decrement likesCount on comment (min 0)
      const updatedComment = await tx.comment.update({
        where: { id: commentId },
        data: {
          likesCount: { decrement: 1 },
        },
        select: {
          id: true,
          likesCount: true,
        },
      });

      return { updatedComment };
    });

    return NextResponse.json({
      success: true,
      likesCount: Math.max(0, result.updatedComment.likesCount),
      isLiked: false,
    });
  } catch (error) {
    console.error('Error removing like from comment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
