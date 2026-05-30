import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface FeedActivity {
  id: string;
  type: 'FOLLOW' | 'LIKE' | 'COMMENT' | 'READING' | 'ACHIEVEMENT' | 'COLLECTION' | 'JOIN_CLAN' | 'CREATE_MANGA';
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  targetUser?: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
  manga?: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  } | null;
  chapter?: {
    id: string;
    chapterNumber: number;
    title: string | null;
  } | null;
  achievement?: {
    id: string;
    name: string;
    icon: string;
  } | null;
  collection?: {
    id: string;
    name: string;
  } | null;
  clan?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  metadata?: Record<string, unknown>;
}

// Mapa de activityType de DB → tipo del componente
const ACTIVITY_TYPE_MAP: Record<string, FeedActivity['type']> = {
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT',
  READ_CHAPTER: 'READING',
  COMPLETED_MANGA: 'READING',
  COMMENT: 'COMMENT',
  FOLLOW_USER: 'FOLLOW',
  CREATED_MANGA: 'CREATE_MANGA',
  JOINED_CLAN: 'JOIN_CLAN',
};

// GET /api/feed - Get activity feed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawType = searchParams.get('type') || 'global';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    const userId = searchParams.get('userId');

    // Mapear type param del frontend a lógica de negocio
    const feedType = rawType.toLowerCase();
    const session = await auth();

    // Construir where clause
    let where: Record<string, unknown> = {};

    if (feedType === 'personal') {
      // Actividades del propio usuario
      const targetUserId = userId || session?.user?.id;
      if (!targetUserId) {
        return NextResponse.json({ activities: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
      where = { userId: targetUserId };
    } else if (feedType === 'following') {
      // Actividades de usuarios seguidos + propias
      const targetUserId = userId || session?.user?.id;
      if (!targetUserId) {
        return NextResponse.json({ activities: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
      const following = await prisma.follow.findMany({
        where: { followerId: targetUserId, followingType: 'USER' },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);
      where = {
        userId: { in: [...followingIds, targetUserId] },
      };
    } else {
      // Global: todas las actividades públicas
      // No requiere auth, mostramos todo
    }

    const [activities, total] = await Promise.all([
      prisma.userActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userActivity.count({ where }),
    ]);

    if (activities.length === 0) {
      return NextResponse.json({
        activities: [],
        pagination: { page, limit, total, totalPages: 0 },
      });
    }

    // Recolectar IDs por tipo para batch fetching
    const userIds = new Set<string>();
    const mangaIds = new Set<string>();
    const followedUserIds = new Set<string>();
    const clanIds = new Set<string>();
    const achievementBadgeIds = new Set<string>();

    activities.forEach((a) => {
      userIds.add(a.userId);
      if (a.activityType === 'READ_CHAPTER' || a.activityType === 'COMPLETED_MANGA' || a.activityType === 'CREATED_MANGA') {
        if (a.referenceId) mangaIds.add(a.referenceId);
      } else if (a.activityType === 'COMMENT') {
        if (a.referenceId) mangaIds.add(a.referenceId);
      } else if (a.activityType === 'FOLLOW_USER') {
        if (a.referenceId) followedUserIds.add(a.referenceId);
      } else if (a.activityType === 'JOINED_CLAN') {
        if (a.referenceId) clanIds.add(a.referenceId);
      } else if (a.activityType === 'ACHIEVEMENT_UNLOCKED') {
        if (a.referenceId) achievementBadgeIds.add(a.referenceId);
      }
    });

    // Batch fetch all referenced entities
    const [users, mangas, followedUsers, clans, achievements] = await Promise.all([
      userIds.size > 0
        ? prisma.user.findMany({
            where: { id: { in: [...userIds] } },
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          })
        : Promise.resolve([]),
      mangaIds.size > 0
        ? prisma.mangaSeries.findMany({
            where: { id: { in: [...mangaIds] } },
            select: { id: true, title: true, slug: true, coverUrl: true },
          })
        : Promise.resolve([]),
      followedUserIds.size > 0
        ? prisma.user.findMany({
            where: { id: { in: [...followedUserIds] } },
            select: { id: true, username: true, displayName: true },
          })
        : Promise.resolve([]),
      clanIds.size > 0
        ? prisma.clan.findMany({
            where: { id: { in: [...clanIds] } },
            select: { id: true, name: true, slug: true },
          })
        : Promise.resolve([]),
      achievementBadgeIds.size > 0
        ? prisma.achievementDefinition.findMany({
            where: { badgeId: { in: [...achievementBadgeIds] } },
            select: { badgeId: true, name: true, iconUrl: true },
          })
        : Promise.resolve([]),
    ]);

    // Build lookup maps
    const userMap = new Map(users.map((u) => [u.id, u]));
    const mangaMap = new Map(mangas.map((m) => [m.id, m]));
    const followedUserMap = new Map(followedUsers.map((u) => [u.id, u]));
    const clanMap = new Map(clans.map((c) => [c.id, c]));
    const achievementMap = new Map(achievements.map((a) => [a.badgeId, a]));

    // Transform activities
    const enriched: FeedActivity[] = activities.map((activity) => {
      const componentType = ACTIVITY_TYPE_MAP[activity.activityType] || activity.activityType as FeedActivity['type'];
      const user = userMap.get(activity.userId);
      let metadata: Record<string, unknown> = {};
      try {
        if (activity.metadata) {
          metadata = JSON.parse(activity.metadata);
        }
      } catch {
        // Ignore parse errors
      }

      const base: FeedActivity = {
        id: activity.id,
        type: componentType,
        createdAt: activity.createdAt.toISOString(),
        user: {
          id: user?.id || activity.userId,
          username: user?.username || 'unknown',
          displayName: user?.displayName || null,
          avatarUrl: user?.avatarUrl || null,
        },
        targetUser: null,
        manga: null,
        chapter: null,
        achievement: null,
        collection: null,
        clan: null,
        metadata,
      };

      if (activity.activityType === 'ACHIEVEMENT_UNLOCKED') {
        const achievementDef = activity.referenceId ? achievementMap.get(activity.referenceId) : null;
        base.achievement = {
          id: activity.referenceId || '',
          name: achievementDef?.name || (metadata.achievementName as string) || 'Logro',
          icon: achievementDef?.iconUrl || '',
        };
      } else if (activity.activityType === 'READ_CHAPTER') {
        const manga = activity.referenceId ? mangaMap.get(activity.referenceId) : null;
        base.manga = manga ? { id: manga.id, title: manga.title, slug: manga.slug, coverUrl: manga.coverUrl } : null;
        base.chapter = metadata.chapterId
          ? {
              id: metadata.chapterId as string,
              chapterNumber: (metadata.chapterNumber as number) || 0,
              title: (metadata.chapterTitle as string) || null,
            }
          : null;
      } else if (activity.activityType === 'COMPLETED_MANGA') {
        const manga = activity.referenceId ? mangaMap.get(activity.referenceId) : null;
        base.manga = manga ? { id: manga.id, title: manga.title, slug: manga.slug, coverUrl: manga.coverUrl } : null;
      } else if (activity.activityType === 'COMMENT') {
        const manga = activity.referenceId ? mangaMap.get(activity.referenceId) : null;
        base.manga = manga ? { id: manga.id, title: manga.title, slug: manga.slug, coverUrl: manga.coverUrl } : null;
        if (metadata.targetTitle) {
          base.metadata = { ...metadata };
        }
      } else if (activity.activityType === 'FOLLOW_USER') {
        const targetUser = activity.referenceId ? followedUserMap.get(activity.referenceId) : null;
        base.targetUser = targetUser
          ? { id: targetUser.id, username: targetUser.username, displayName: targetUser.displayName }
          : null;
      } else if (activity.activityType === 'CREATED_MANGA') {
        const manga = activity.referenceId ? mangaMap.get(activity.referenceId) : null;
        base.manga = manga ? { id: manga.id, title: manga.title, slug: manga.slug, coverUrl: manga.coverUrl } : null;
      } else if (activity.activityType === 'JOINED_CLAN') {
        const clan = activity.referenceId ? clanMap.get(activity.referenceId) : null;
        base.clan = clan ? { id: clan.id, name: clan.name, slug: clan.slug } : null;
      }

      return base;
    });

    return NextResponse.json({
      activities: enriched.filter((a) => a.user.username !== 'unknown'),
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
