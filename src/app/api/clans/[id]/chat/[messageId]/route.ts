import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';
import { sanitizeText } from '@/lib/sanitize';
import { logSecurityEvent } from '@/lib/security-audit';

const editSchema = z.object({
  content: z.string().min(1).max(2000),
});

// PATCH /api/clans/[id]/chat/[messageId] — Edit a clan chat message
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

    // Verify user is a member of the clan
    const membership = await prisma.clanMembership.findFirst({
      where: { clanId: id, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No eres miembro de este clan' },
        { status: 403 }
      );
    }

    // Find the message and verify ownership
    const message = await prisma.clanChatMessage.findFirst({
      where: { id: messageId, clanId: id },
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

    // Sanitize content to prevent XSS
    const sanitized = sanitizeText(content);
    if (!sanitized) {
      return NextResponse.json(
        { error: 'Contenido inválido después de sanitizar' },
        { status: 400 }
      );
    }

    const updatedMessage = await prisma.clanChatMessage.update({
      where: { id: messageId },
      data: {
        content: sanitized,
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
    console.error('Error editing clan chat message:', error);
    return NextResponse.json(
      { error: 'Error al editar el mensaje' },
      { status: 500 }
    );
  }
}

// DELETE /api/clans/[id]/chat/[messageId] — Soft-delete a clan chat message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id, messageId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Rate limiting for deletes
    const rlResponse = await withRateLimit(request, session.user.id, 'messages');
    if (rlResponse) return rlResponse;

    // Verify user is a member of the clan
    const membership = await prisma.clanMembership.findFirst({
      where: { clanId: id, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No eres miembro de este clan' },
        { status: 403 }
      );
    }

    // Find the message and verify ownership
    const message = await prisma.clanChatMessage.findFirst({
      where: { id: messageId, clanId: id },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    // Permitir que LEADER y OFFICER eliminen cualquier mensaje del clan
    const isOwner = message.senderId === session.user.id;
    const isModerator = membership.role === 'LEADER' || membership.role === 'OFFICER';

    if (!isOwner && !isModerator) {
      return NextResponse.json(
        { error: 'No puedes eliminar este mensaje' },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.clanChatMessage.update({
      where: { id: messageId },
      data: {
        content: '',
        isDeleted: true,
      },
    });

    // Audit log: registrar quién eliminó el mensaje
    await logSecurityEvent({
      userId: session.user.id,
      action: 'CLAN_CHAT_MESSAGE_DELETED',
      targetId: messageId,
      targetType: 'CLAN_CHAT',
      metadata: {
        clanId: id,
        messageAuthorId: message.senderId,
        deletedByRole: membership.role,
        isOwnerDelete: isOwner,
        messageContent: message.content.slice(0, 200), // Truncate para privacidad
      },
      severity: isOwner ? 'INFO' : 'WARNING', // Moderator deletes are WARNING
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
    });

    // Socket notifications disabled (polling-only)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting clan chat message:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el mensaje' },
      { status: 500 }
    );
  }
}
