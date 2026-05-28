import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/feed - Get activity feed
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'ALL'; // ALL, READING, SOCIAL, MINE
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const userId = session.user.id;
    let where: Record<string, unknown> = { isPublic: true };

    if (type === 'MINE') {
      // User's own activities
      where = { userId };
    } else if (type === 'SOCIAL') {
      // Activities from followed users
      const following = await prisma.follow.findMany({
        where: { followerId: userId, followingType: 'USER' },
        select: { followingId: true },
      });
      const followingIds = following.map((f: any) => f.followingId);
      where = {
        userId: { in: [...followingIds, userId] },
        isPublic: true,
      };
    }

    // If type is READING, filter only reading activities
    if (type === 'READING') {
      where = {
        ...where,
        activityType: { in: ['READ_CHAPTER', 'COMPLETED_MANGA'] },
      };
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    // Enrich with target data
    const enriched = await Promise.all(
      activities.map(async (activity: any) => {
        let target = null;

        if (activity.targetId) {
          if (activity.targetType === 'MANGA') {
            target = await prisma.mangaSeries.findUnique({
              where: { id: activity.targetId },
              select: {
                id: true,
                title: true,
                coverUrl: true,
                slug: true,
                deletedAt: true,
              },
            });
            if (!target || target.deletedAt) return null;
          } else if (activity.targetType === 'USER') {
            target = await prisma.user.findUnique({
              where: { id: activity.targetId },
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            });
          }
        }

        // Parse metadata
        let metadata = {};
        try {
          if (activity.metadata) {
            metadata = JSON.parse(activity.metadata);
          }
        } catch {
          // Ignore parse errors
        }

        // Generate message based on activity type
        let message = '';
        switch (activity.activityType) {
          case 'READ_CHAPTER':
            message = `leyó el capítulo ${(metadata as any).chapterNumber || ''} de`;
            break;
          case 'FOLLOW_USER':
            message = 'comenzó a seguir a';
            break;
          case 'FOLLOW_MANGA':
            message = 'comenzó a seguir';
            break;
          case 'COMMENT':
            message = 'comentó en';
            break;
          case 'ACHIEVEMENT_UNLOCKED':
            message = 'desbloqueó el logro';
            break;
          case 'COMPLETED_MANGA':
            message = 'completó';
            break;
          case 'JOINED_CLAN':
            message = 'se unió al clan';
            break;
          case 'CREATED_MANGA':
            message = 'publicó un nuevo manga';
            break;
          default:
            message = activity.activityType.toLowerCase().replace(/_/g, ' ');
        }

        return {
          id: activity.id,
          type: activity.activityType,
          message,
          user: activity.user,
          target,
          metadata,
          createdAt: activity.createdAt,
        };
      })
    );

    return NextResponse.json({
      activities: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
