import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { Prisma } from '@/generated/prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';
import { sanitizeText } from '@/lib/sanitize';

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  replyToId: z.string().optional().nullable(),
});

// GET /api/clans/[id]/chat — Get clan chat messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Rate limiting for reads (abuse prevention)
    const rlResponse = await withRateLimit(request, session.user.id, 'search');
    if (rlResponse) return rlResponse;

    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get('page') || '1');
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const rawLimit = parseInt(searchParams.get('limit') || '50');
    const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 50 : rawLimit));
    const search = searchParams.get('search') || '';

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

    // Build where clause
    const where: Prisma.ClanChatMessageWhereInput = { clanId: id };
    if (search.trim()) {
      where.content = { contains: search.trim(), mode: 'insensitive' };
    }

    const messages = await prisma.clanChatMessage.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            sender: {
              select: { username: true, displayName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.clanChatMessage.count({ where });

    return NextResponse.json({
      messages: messages.reverse(), // Oldest first for display
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clan chat messages:', error);
    return NextResponse.json(
      { error: 'Error al cargar mensajes del clan' },
      { status: 500 }
    );
  }
}

// POST /api/clans/[id]/chat — Send a clan chat message
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

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Mensaje inválido', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { content, replyToId } = parsed.data;

    // Sanitize content to prevent XSS
    const sanitized = sanitizeText(content);
    if (!sanitized) {
      return NextResponse.json(
        { error: 'Contenido inválido después de sanitizar' },
        { status: 400 }
      );
    }

    // Validate replyToId if provided
    if (replyToId) {
      const replyMessage = await prisma.clanChatMessage.findFirst({
        where: { id: replyToId, clanId: id },
      });
      if (!replyMessage) {
        return NextResponse.json(
          { error: 'Mensaje de reply no encontrado' },
          { status: 400 }
        );
      }
    }

    // Create message
    const message = await prisma.clanChatMessage.create({
      data: {
        clanId: id,
        senderId: session.user.id,
        content: sanitized,
        replyToId: replyToId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Socket notifications disabled (polling-only)

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error sending clan chat message:', error);
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    );
  }
}
