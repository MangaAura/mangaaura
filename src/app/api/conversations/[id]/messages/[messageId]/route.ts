import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const editSchema = z.object({
  content: z.string().min(1).max(2000),
});

// PATCH /api/conversations/[id]/messages/[messageId] - Edit a message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id, messageId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'messages');
    if (rlResponse) return rlResponse;

    // Verify user is part of conversation
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

    // Find the message and verify ownership
    const message = await prisma.directMessage.findFirst({
      where: { id: messageId, conversationId: id },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    if (message.senderId !== session.user.id) {
      return NextResponse.json(
        { error: 'No puedes editar este mensaje' },
        { status: 403 }
      );
    }

    if (message.isDeleted) {
      return NextResponse.json(
        { error: 'No puedes editar un mensaje eliminado' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = editSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Contenido inválido', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { content } = parsed.data;

    // Update the message
    const updatedMessage = await prisma.directMessage.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date(),
      },
    });

    // Socket notifications disabled (polling-only)

    return NextResponse.json({
      message: {
        id: updatedMessage.id,
        content: updatedMessage.content,
        isEdited: updatedMessage.isEdited,
        editedAt: updatedMessage.editedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json(
      { error: 'Error al editar el mensaje' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id]/messages/[messageId] - Soft-delete a message
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id, messageId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(_request, session.user.id, 'messages');
    if (rlResponse) return rlResponse;

    // Verify user is part of conversation
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

    // Find the message and verify ownership
    const message = await prisma.directMessage.findFirst({
      where: { id: messageId, conversationId: id },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    if (message.senderId !== session.user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar este mensaje' },
        { status: 403 }
      );
    }

    // Soft delete the message
    await prisma.directMessage.update({
      where: { id: messageId },
      data: {
        content: '',
        isDeleted: true,
      },
    });

    // Socket notifications disabled (polling-only)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el mensaje' },
      { status: 500 }
    );
  }
}
