import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const sendSchema = z.object({
  receiverId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const result = sendSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { receiverId } = result.data;
    const senderId = session.user.id;

    if (senderId === receiverId) {
      return NextResponse.json({ error: 'No puedes enviarte solicitud a ti mismo' }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
    if (!receiver) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const existing = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        return NextResponse.json({ error: 'Ya enviaste una solicitud a este usuario' }, { status: 409 });
      }
      if (existing.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Ya son amigos' }, { status: 409 });
      }
      await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: 'PENDING' },
      });
      return NextResponse.json({ success: true, status: 'PENDING' });
    }

    const reverse = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
    });

    if (reverse?.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Ya son amigos' }, { status: 409 });
    }

    if (reverse?.status === 'PENDING') {
      await prisma.friendRequest.update({
        where: { id: reverse.id },
        data: { status: 'ACCEPTED' },
      });
      await prisma.friendship.create({
        data: {
          user1Id: senderId < receiverId ? senderId : receiverId,
          user2Id: senderId < receiverId ? receiverId : senderId,
        },
      });
      return NextResponse.json({ success: true, status: 'ACCEPTED' });
    }

    await prisma.friendRequest.create({
      data: { senderId, receiverId },
    });

    return NextResponse.json({ success: true, status: 'PENDING' }, { status: 201 });
  } catch (error) {
    console.error('[FriendRequest POST] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

const respondSchema = z.object({
  requestId: z.string(),
  action: z.enum(['ACCEPT', 'REJECT']),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const result = respondSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { requestId, action } = result.data;

    const req = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!req || req.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (req.status !== 'PENDING') {
      return NextResponse.json({ error: 'Esta solicitud ya fue respondida' }, { status: 400 });
    }

    if (action === 'ACCEPT') {
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      });
      await prisma.friendship.create({
        data: {
          user1Id: req.senderId < req.receiverId ? req.senderId : req.receiverId,
          user2Id: req.senderId < req.receiverId ? req.receiverId : req.senderId,
        },
      });
      return NextResponse.json({ success: true, status: 'ACCEPTED' });
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return NextResponse.json({ success: true, status: 'REJECTED' });
  } catch (error) {
    console.error('[FriendRequest PUT] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const targetUserId = searchParams.get('userId');

    if (requestId) {
      const req = await prisma.friendRequest.findUnique({
        where: { id: requestId },
      });
      if (!req || (req.senderId !== session.user.id && req.receiverId !== session.user.id)) {
        return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
      }
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'CANCELLED' },
      });
    } else if (targetUserId) {
      const userId = session.user.id;
      const [user1Id, user2Id] = userId < targetUserId ? [userId, targetUserId] : [targetUserId, userId];
      const friendship = await prisma.friendship.findUnique({
        where: { user1Id_user2Id: { user1Id, user2Id } },
      });
      if (friendship) {
        await prisma.friendship.delete({ where: { id: friendship.id } });
      }
      await prisma.friendRequest.updateMany({
        where: {
          OR: [
            { senderId: userId, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: userId },
          ],
          status: 'ACCEPTED',
        },
        data: { status: 'CANCELLED' },
      });
    } else {
      return NextResponse.json({ error: 'requestId o userId requerido' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FriendRequest DELETE] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
