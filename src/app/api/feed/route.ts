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
  LIKE_COMMENT: 'LIKE',
  RATED_MANGA: 'LIKE',
};

/** Activity type → importance weight for algorithmic scoring */
const TYPE_WEIGHTS: Record<string, number> = {
  CREATED_MANGA: 10,
  ACHIEVEMENT_UNLOCKED: 8,
  JOINED_CLAN: 6,
  COMMENT: 5,
  READ_CHAPTER: 3,
  COMPLETED_MANGA: 4,
  FOLLOW_USER: 2,
  LIKE_COMMENT: 1,
  RATED_MANGA: 4,
};

/**
 * Compute an algorithmic relevance score for an activity.
 * Higher = more likely to appear in the "For You" feed.
 */
function computeScore(
  activity: { userId: string; activityType: string; createdAt: Date },
  interactionUserIds: Set<string>,
): number {
  // 1. Type weight (what kind of activity)
  const typeWeight = TYPE_WEIGHTS[activity.activityType] || 3;

  // 2. Recency score: exponential decay with 48h half-life
  const hoursSince = (Date.now() - activity.createdAt.getTime()) / 3_600_000;
  const recencyScore = Math.exp(-hoursSince / 48);

  // 3. Interaction boost: activities from users the user has interacted with
  const interactionBoost = interactionUserIds.has(activity.userId) ? 3 : 0;

  return typeWeight * 2 + recencyScore * 5 + interactionBoost;
}

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

    // ── Algorítmico / For You ────────────────────────────────────
    if (feedType === 'algorithmic') {
      const targetUserId = userId || session?.user?.id;
      if (!targetUserId) {
        return NextResponse.json({ activities: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }

      // Gather user context in parallel
      const [following, myInteractions] = await Promise.all([
        prisma.follow.findMany({
          where: { followerId: targetUserId, followingType: 'USER' },
          select: { followingId: true },
        }),
        prisma.userActivity.findMany({
          where: { userId: targetUserId, activityType: { in: ['COMMENT', 'LIKE_COMMENT', 'FOLLOW_USER'] } },
          select: { referenceId: true },
          take: 200,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const followingIds = new Set(following.map((f) => f.followingId));
      followingIds.add(targetUserId);

      // Users the current user has interacted with
      const interactionUserIds = new Set<string>();
      myInteractions.forEach((ia) => {
        if (ia.referenceId) interactionUserIds.add(ia.referenceId);
      });

      // Fetch a larger pool of recent activities from followed users
      const poolSize = Math.min(200, limit * 4);
      const activities = await prisma.userActivity.findMany({
        where: { userId: { in: [...followingIds] } },
        orderBy: { createdAt: 'desc' },
        take: poolSize,
      });

      // Also fetch top global activities (high-value, not from followed)
      const globalHighValue = await prisma.userActivity.findMany({
        where: {
          userId: { notIn: [...followingIds] },
          activityType: { in: ['CREATED_MANGA', 'ACHIEVEMENT_UNLOCKED', 'JOINED_CLAN'] },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.max(10, limit),
      });

      const allActivities = [...activities, ...globalHighValue];

      // De-duplicate by id
      const seen = new Set<string>();
      const unique = allActivities.filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });

      // Score each activity
      const scored = unique.map((a) => ({
        activity: a,
        score: computeScore(a, interactionUserIds),
      }));

      // Sort by score descending, with a small random jitter for variety
      scored.sort((a, b) => {
        const diff = b.score - a.score;
        if (Math.abs(diff) < 0.5) return Math.random() - 0.5;
        return diff;
      });

      // Paginate scored results
      const paged = scored.slice(skip, skip + limit).map((s) => s.activity);
      const total = unique.length;

      // Enrich and return
      return respondWithEnriched(paged, page, limit, total);
    }

    // ── Feed tradicional (personal / following / global) ───────────
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
    const commentIds = new Set<string>();

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
      } else if (a.activityType === 'LIKE_COMMENT') {
        if (a.referenceId) commentIds.add(a.referenceId);
      } else if (a.activityType === 'RATED_MANGA') {
        if (a.referenceId) mangaIds.add(a.referenceId);
      }
    });

    // Fetch comment → manga mapping for likes
    const commentsWithManga = commentIds.size > 0
      ? await prisma.comment.findMany({
          where: { id: { in: [...commentIds] } },
          select: {
            id: true,
            chapterId: true,
            chapter: {
              select: { mangaId: true },
            },
          },
        })
      : [];
    const commentMangaMap = new Map<string, string>();
    commentsWithManga.forEach((c) => {
      if (c.chapter?.mangaId) {
        commentMangaMap.set(c.id, c.chapter.mangaId);
        mangaIds.add(c.chapter.mangaId);
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
      } else if (activity.activityType === 'RATED_MANGA') {
        const manga = activity.referenceId ? mangaMap.get(activity.referenceId) : null;
        base.manga = manga ? { id: manga.id, title: manga.title, slug: manga.slug, coverUrl: manga.coverUrl } : null;
        if (metadata.rating) {
          base.metadata = { ...metadata };
        }
      } else if (activity.activityType === 'LIKE_COMMENT') {
        const mangaId = activity.referenceId ? commentMangaMap.get(activity.referenceId) : null;
        if (mangaId) {
          const manga = mangaMap.get(mangaId);
          base.manga = manga ? { id: manga.id, title: manga.title, slug: manga.slug, coverUrl: manga.coverUrl } : null;
        }
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

/** Shared enrichment + response helper */
async function respondWithEnriched(
  activities: Array<{
    id: string;
    userId: string;
    activityType: string;
    referenceId: string | null;
    metadata: string | null;
    createdAt: Date;
  }>,
  page: number,
  limit: number,
  total: number,
) {
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
  const commentIds = new Set<string>();

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
    } else if (a.activityType === 'LIKE_COMMENT') {
      if (a.referenceId) commentIds.add(a.referenceId);
    } else if (a.activityType === 'RATED_MANGA') {
      if (a.referenceId) mangaIds.add(a.referenceId);
    }
  });

  // Fetch comment → manga mapping for likes
  const commentsWithManga = commentIds.size > 0
    ? await prisma.comment.findMany({
        where: { id: { in: [...commentIds] } },
        select: {
          id: true,
          chapterId: true,
          chapter: {
            select: { mangaId: true },
          },
        },
      })
    : [];
  const commentMangaMap = new Map<string, string>();
  commentsWithManga.forEach((c) => {
    if (c.chapter?.mangaId) {
      commentMangaMap.set(c.id, c.chapter.mangaId);
      mangaIds.add(c.chapter.mangaId);
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
    } else if (activity.activityType === 'LIKE_COMMENT') {
      const mangaId = activity.referenceId ? commentMangaMap.get(activity.referenceId) : null;
      if (mangaId) {
        const manga = mangaMap.get(mangaId);
        base.manga = manga ? { id: manga.id, title: manga.title, slug: manga.slug, coverUrl: manga.coverUrl } : null;
      }
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
}
