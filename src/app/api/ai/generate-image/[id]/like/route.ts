import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Like an image
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Check image exists and is public or owned by user
    const image = await prisma.imageGeneration.findFirst({
      where: { id, OR: [{ isPublic: true }, { userId }] },
      select: { id: true, userId: true },
    });
    if (!image) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    // Prevent self-like
    if (image.userId === userId) {
      return NextResponse.json({ error: 'No puedes dar like a tu propia imagen' }, { status: 400 });
    }

    // Check if already liked
    const existing = await prisma.imageGenerationLike.findUnique({
      where: { imageId_userId: { imageId: id, userId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Ya has dado like' }, { status: 409 });
    }

    // Create like + increment count in transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.imageGenerationLike.create({
        data: { imageId: id, userId },
      });
      const updated = await tx.imageGeneration.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
      return updated;
    });

    // Send notification to image owner
    if (image.userId !== userId) {
      try {
        const { getNotificationService } = await import('@/core/services/NotificationService');
        const ns = await getNotificationService();
        const liker = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        });
        if (liker) {
          await ns.createNotification({
            userId: image.userId,
            type: 'IMAGE_LIKE',
            title: '❤️ Nuevo like en tu imagen',
            message: `${liker.displayName || liker.username} le gustó tu imagen generada con IA`,
            data: {
              imageId: id,
              likerId: liker.id,
              likerName: liker.displayName || liker.username,
              likerAvatar: liker.avatarUrl,
            },
            imageUrl: liker.avatarUrl || undefined,
            linkUrl: '/prompts',
          });
        }
      } catch (notifError) {
        console.error('[Image Like] Failed to send notification:', notifError);
      }
    }

    return NextResponse.json({ success: true, likeCount: result.likeCount, isLiked: true });
  } catch (error) {
    console.error('[Image Like] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE - Unlike an image
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const existing = await prisma.imageGenerationLike.findUnique({
      where: { imageId_userId: { imageId: id, userId } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'No has dado like' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.imageGenerationLike.delete({
        where: { imageId_userId: { imageId: id, userId } },
      });
      const updated = await tx.imageGeneration.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
      return updated;
    });

    return NextResponse.json({
      success: true,
      likeCount: Math.max(0, result.likeCount),
      isLiked: false,
    });
  } catch (error) {
    console.error('[Image Unlike] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
