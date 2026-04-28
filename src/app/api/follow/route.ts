import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const followSchema = z.object({
  followingId: z.string().uuid(),
  followingType: z.enum(['USER', 'MANGA']),
});

// POST /api/follow - Toggle follow
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = followSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { followingId, followingType } = result.data;
    const followerId = session.user.id;

    // Can't follow yourself
    if (followingType === 'USER' && followingId === followerId) {
      return NextResponse.json(
        { error: 'No puedes seguirte a ti mismo' },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId_followingType: {
          followerId,
          followingId,
          followingType,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId_followingType: {
            followerId,
            followingId,
            followingType,
          },
        },
      });

      // Create activity
      await prisma.activity.create({
        data: {
          userId: followerId,
          activityType: followingType === 'USER' ? 'UNFOLLOW_USER' : 'UNFOLLOW_MANGA',
          targetId: followingId,
          targetType: followingType,
          isPublic: true,
        },
      });

      return NextResponse.json({
        success: true,
        isFollowing: false,
        message: followingType === 'USER' ? 'Dejaste de seguir al usuario' : 'Dejaste de seguir el manga',
      });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
          followingType,
        },
      });

      // Create activity
      await prisma.activity.create({
        data: {
          userId: followerId,
          activityType: followingType === 'USER' ? 'FOLLOW_USER' : 'FOLLOW_MANGA',
          targetId: followingId,
          targetType: followingType,
          isPublic: true,
        },
      });

      // Notify the followed user/manga author
      if (followingType === 'USER') {
        await prisma.notification.create({
          data: {
            userId: followingId,
            type: 'NEW_FOLLOWER',
            title: 'Nuevo seguidor',
            message: `${session.user.name || session.user.username} ha comenzado a seguirte`,
            data: JSON.stringify({ followerId: session.user.id }),
          },
        });
      }

      return NextResponse.json({
        success: true,
        isFollowing: true,
        message: followingType === 'USER' ? 'Ahora sigues al usuario' : 'Ahora sigues el manga',
      });
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/follow - Check if following
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const followingId = searchParams.get('followingId');
    const followingType = searchParams.get('followingType') as 'USER' | 'MANGA' | null;

    if (!session?.user?.id) {
      return NextResponse.json({ isFollowing: false });
    }

    if (!followingId || !followingType) {
      return NextResponse.json(
        { error: 'followingId y followingType requeridos' },
        { status: 400 }
      );
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId_followingType: {
          followerId: session.user.id,
          followingId,
          followingType,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Error checking follow:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
