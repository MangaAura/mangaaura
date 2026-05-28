import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getIO } from '@/lib/socket';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// ── Validation helpers ────────────────────────────────────────────────

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function isValidEmoji(emoji: string): boolean {
  if (emoji.length > 10) return false;
  // Match emoji characters including variation selectors and ZWJ sequences
  const emojiRegex = /^(?:\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|\u2764\ufe0f?|\u{1f000}-\u{1ffff}|[🏻-🏿]|[\u200d\u2640\u2642\ufe0f])+$/u;
  return emojiRegex.test(emoji);
}

// POST /api/clans/[id]/chat/reactions — Add a reaction to a clan chat message
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

    // Rate limiting
    const rlResponse = await withRateLimit(request, session.user.id, 'messages');
    if (rlResponse) return rlResponse;

    const { messageId, emoji } = await request.json();
    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'messageId y emoji requeridos' }, { status: 400 });
    }

    // Validate messageId is a valid UUID
    if (!isValidUUID(messageId)) {
      return NextResponse.json({ error: 'messageId inválido' }, { status: 400 });
    }

    // Validate emoji
    if (!isValidEmoji(emoji)) {
      return NextResponse.json({ error: 'Emoji inválido' }, { status: 400 });
    }

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

    // Verify the message belongs to this clan
    const message = await prisma.clanChatMessage.findFirst({
      where: { id: messageId, clanId: id },
      select: { id: true },
    });
    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado en este clan' },
        { status: 404 }
      );
    }

    // Upsert reaction (unique on messageId + userId + emoji)
    await prisma.clanChatMessageReaction.upsert({
      where: {
        messageId_userId_emoji: { messageId, userId: session.user.id, emoji },
      },
      update: {},
      create: {
        messageId,
        userId: session.user.id,
        emoji,
      },
    });

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`clan:${id}`).emit('clan:reaction', {
        messageId,
        clanId: id,
        emoji,
        userId: session.user.id,
        action: 'add',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding clan chat reaction:', error);
    return NextResponse.json({ error: 'Error al añadir reacción' }, { status: 500 });
  }
}

// DELETE /api/clans/[id]/chat/reactions — Remove a reaction from a clan chat message
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

    // Rate limiting
    const rlResponse = await withRateLimit(request, session.user.id, 'messages');
    if (rlResponse) return rlResponse;

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const emoji = searchParams.get('emoji');

    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'messageId y emoji requeridos' }, { status: 400 });
    }

    // Validate messageId is a valid UUID
    if (!isValidUUID(messageId)) {
      return NextResponse.json({ error: 'messageId inválido' }, { status: 400 });
    }

    // Validate emoji
    if (!isValidEmoji(emoji)) {
      return NextResponse.json({ error: 'Emoji inválido' }, { status: 400 });
    }

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

    // Delete reaction
    await prisma.clanChatMessageReaction.deleteMany({
      where: {
        messageId,
        userId: session.user.id,
        emoji,
      },
    });

    // Emit socket event
    const io = getIO();
    if (io) {
      io.to(`clan:${id}`).emit('clan:reaction', {
        messageId,
        clanId: id,
        emoji,
        userId: session.user.id,
        action: 'remove',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing clan chat reaction:', error);
    return NextResponse.json({ error: 'Error al eliminar reacción' }, { status: 500 });
  }
}
