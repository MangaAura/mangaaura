import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getIO } from '@/lib/socket';
import { prisma } from '@/lib/prisma';

// POST /api/conversations/[id]/messages/reactions — Add a reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { messageId, emoji } = await request.json();
    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'messageId y emoji requeridos' }, { status: 400 });
    }

    // Verify user is in conversation
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
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    // Upsert reaction (unique on messageId + userId + emoji)
    await prisma.messageReaction.upsert({
      where: {
        messageId_userId_emoji: { messageId, userId: session.user.id, emoji },
      },
      update: {}, // Already exists — no-op
      create: {
        messageId,
        userId: session.user.id,
        emoji,
      },
    });

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`dm:${id}`).emit('dm:reaction', {
        messageId,
        emoji,
        userId: session.user.id,
        action: 'add',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json({ error: 'Error al añadir reacción' }, { status: 500 });
  }
}

// DELETE /api/conversations/[id]/messages/reactions — Remove a reaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const emoji = searchParams.get('emoji');

    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'messageId y emoji requeridos' }, { status: 400 });
    }

    // Verify user is in conversation
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
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    // Delete reaction
    await prisma.messageReaction.deleteMany({
      where: {
        messageId,
        userId: session.user.id,
        emoji,
      },
    });

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`dm:${id}`).emit('dm:reaction', {
        messageId,
        emoji,
        userId: session.user.id,
        action: 'remove',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json({ error: 'Error al eliminar reacción' }, { status: 500 });
  }
}
