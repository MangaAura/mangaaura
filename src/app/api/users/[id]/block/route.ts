import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[id]/block - Check if current user has blocked this user
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ blocked: false });
    }

    const { id: targetId } = await params;

    if (session.user.id === targetId) {
      return NextResponse.json({ blocked: false });
    }

    const block = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: targetId,
        },
      },
    });

    return NextResponse.json({ blocked: !!block });
  } catch (error) {
    console.error('[UserBlock GET] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST /api/users/[id]/block - Block a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: targetId } = await params;

    if (session.user.id === targetId) {
      return NextResponse.json({ error: 'No puedes bloquearte a ti mismo' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 200) : null;

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Check if already blocked
    const existing = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: targetId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ blocked: true, message: 'Usuario ya bloqueado' });
    }

    // Remove friend if they are friends (can't be friends with a blocked user)
    const [user1Id, user2Id] = session.user.id < targetId
      ? [session.user.id, targetId]
      : [targetId, session.user.id];

    const friendship = await prisma.friendship.findUnique({
      where: { user1Id_user2Id: { user1Id, user2Id } },
    });

    if (friendship) {
      await prisma.friendship.delete({ where: { id: friendship.id } });

      // Cancel any pending friend requests
      await prisma.friendRequest.updateMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: targetId },
            { senderId: targetId, receiverId: session.user.id },
          ],
          status: 'PENDING',
        },
        data: { status: 'CANCELLED' },
      });
      await prisma.friendRequest.updateMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: targetId },
            { senderId: targetId, receiverId: session.user.id },
          ],
          status: 'ACCEPTED',
        },
        data: { status: 'CANCELLED' },
      });
    }

    // Unfollow if following
    await prisma.follow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: targetId,
        followingType: 'USER',
      },
    });

    // Remove as follower
    await prisma.follow.deleteMany({
      where: {
        followerId: targetId,
        followingId: session.user.id,
        followingType: 'USER',
      },
    });

    // Create block record
    await prisma.userBlock.create({
      data: {
        blockerId: session.user.id,
        blockedId: targetId,
        reason,
      },
    });

    return NextResponse.json({ blocked: true });
  } catch (error) {
    console.error('[UserBlock POST] Error:', error);
    return NextResponse.json({ error: 'Error al bloquear usuario' }, { status: 500 });
  }
}

// DELETE /api/users/[id]/block - Unblock a user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: targetId } = await params;

    const existing = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: targetId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ blocked: false, message: 'Usuario no bloqueado' });
    }

    await prisma.userBlock.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ blocked: false });
  } catch (error) {
    console.error('[UserBlock DELETE] Error:', error);
    return NextResponse.json({ error: 'Error al desbloquear usuario' }, { status: 500 });
  }
}
