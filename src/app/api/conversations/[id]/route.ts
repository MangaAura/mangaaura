import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security-audit';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// GET /api/conversations/[id] - Get conversation details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { participant1Id: session.user.id },
          { participant2Id: session.user.id },
        ],
      },
      include: {
        participant1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        participant2: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            isRead: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: session.user.id },
                isRead: false,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    const isParticipant1 = conversation.participant1Id === session.user.id;
    const participant = isParticipant1 ? conversation.participant2 : conversation.participant1;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        participant,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: conversation._count.messages,
        isBlocked: conversation.isBlocked,
        blockedBy: conversation.blockedBy,
        isBlockedByMe: conversation.blockedBy === session.user.id,
        lastMessage: conversation.messages[0] || null,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Error al cargar la conversación' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Mark read, block/unblock
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'messages');
    if (rlResponse) return rlResponse;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { participant1Id: session.user.id },
          { participant2Id: session.user.id },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { markRead, block, unblock } = body;

    // Mark all messages as read
    if (markRead === true) {
      await prisma.directMessage.updateMany({
        where: {
          conversationId: id,
          senderId: { not: session.user.id },
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      });
    }

    // Block conversation
    if (block === true) {
      await prisma.conversation.update({
        where: { id },
        data: { isBlocked: true, blockedBy: session.user.id },
      });

      await logSecurityEvent({
        userId: session.user.id,
        action: 'BLOCKED_USER',
        targetId: id,
        targetType: 'USER',
        severity: 'INFO',
      });
    }

    // Unblock conversation
    if (unblock === true) {
      await prisma.conversation.update({
        where: { id },
        data: { isBlocked: false, blockedBy: null },
      });

      await logSecurityEvent({
        userId: session.user.id,
        action: 'UNBLOCKED_USER',
        targetId: id,
        targetType: 'USER',
        severity: 'INFO',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la conversación' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Archive/delete conversation for current user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(_request, session?.user?.id, 'messages');
    if (rlResponse) return rlResponse;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { participant1Id: session.user.id },
          { participant2Id: session.user.id },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    await prisma.conversation.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Conversación eliminada' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la conversación' },
      { status: 500 }
    );
  }
}
