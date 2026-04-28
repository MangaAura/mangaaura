import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security-audit';

export type FollowingType = 'USER' | 'MANGA';

interface FollowOptions {
  followerId: string;
  followingId: string;
  followingType: FollowingType;
}

interface GetFollowersOptions {
  followingId: string;
  followingType: FollowingType;
  page?: number;
  limit?: number;
}

interface GetFollowingOptions {
  followerId: string;
  followingType?: FollowingType;
  page?: number;
  limit?: number;
}

/**
 * Follow a user or manga
 */
export async function follow({
  followerId,
  followingId,
  followingType,
}: FollowOptions): Promise<{
  success: boolean;
  isFollowing: boolean;
  error?: string;
}> {
  try {
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
      return { success: true, isFollowing: true };
    }

    // Create follow
    await prisma.follow.create({
      data: {
        followerId,
        followingId,
        followingType,
      },
    });

    // Update follower counts
    if (followingType === 'USER') {
      await prisma.user.update({
        where: { id: followingId },
        data: {
          // This would need a followersCount field in User model
          // For now, we'll handle this via aggregation
        },
      });
    } else if (followingType === 'MANGA') {
      await prisma.mangaSeries.update({
        where: { id: followingId },
        data: {
          // Similarly, would need followersCount
        },
      });
    }

    // Log activity
    await logSecurityEvent({
      userId: followerId,
      action: 'USER_FOLLOWED_USER',
      targetId: followingId,
      targetType: followingType === 'USER' ? 'USER' : 'MANGA',
      severity: 'INFO',
    });

    return { success: true, isFollowing: true };
  } catch (error) {
    console.error('Error following:', error);
    return { success: false, isFollowing: false, error: 'Error al seguir' };
  }
}

/**
 * Unfollow a user or manga
 */
export async function unfollow({
  followerId,
  followingId,
  followingType,
}: FollowOptions): Promise<{
  success: boolean;
  isFollowing: boolean;
  error?: string;
}> {
  try {
    await prisma.follow.delete({
      where: {
        followerId_followingId_followingType: {
          followerId,
          followingId,
          followingType,
        },
      },
    });

    return { success: true, isFollowing: false };
  } catch (error) {
    // If follow doesn't exist, it's fine
    return { success: true, isFollowing: false };
  }
}

/**
 * Check if user is following something
 */
export async function isFollowing({
  followerId,
  followingId,
  followingType,
}: FollowOptions): Promise<boolean> {
  try {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId_followingType: {
          followerId,
          followingId,
          followingType,
        },
      },
    });

    return !!follow;
  } catch {
    return false;
  }
}

/**
 * Toggle follow status
 */
export async function toggleFollow({
  followerId,
  followingId,
  followingType,
}: FollowOptions): Promise<{
  success: boolean;
  isFollowing: boolean;
  error?: string;
}> {
  const currentlyFollowing = await isFollowing({
    followerId,
    followingId,
    followingType,
  });

  if (currentlyFollowing) {
    return unfollow({ followerId, followingId, followingType });
  } else {
    return follow({ followerId, followingId, followingType });
  }
}

/**
 * Get followers of a user or manga
 */
export async function getFollowers({
  followingId,
  followingType,
  page = 1,
  limit = 20,
}: GetFollowersOptions): Promise<{
  followers: Array<{
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    followedAt: Date;
  }>;
  total: number;
  hasMore: boolean;
}> {
  const skip = (page - 1) * limit;

  const [followers, total] = await Promise.all([
    prisma.follow.findMany({
      where: {
        followingId,
        followingType,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.follow.count({
      where: {
        followingId,
        followingType,
      },
    }),
  ]);

  return {
    followers: followers.map((f) => ({
      id: f.follower.id,
      username: f.follower.username,
      displayName: f.follower.displayName,
      avatarUrl: f.follower.avatarUrl,
      followedAt: f.createdAt,
    })),
    total,
    hasMore: skip + followers.length < total,
  };
}

/**
 * Get who a user is following
 */
export async function getFollowing({
  followerId,
  followingType,
  page = 1,
  limit = 20,
}: GetFollowingOptions): Promise<{
  following: Array<{
    id: string;
    type: FollowingType;
    name: string;
    avatarUrl: string | null;
    followedAt: Date;
    metadata?: Record<string, unknown>;
  }>;
  total: number;
  hasMore: boolean;
}> {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { followerId };
  if (followingType) {
    where.followingType = followingType;
  }

  const [follows, total] = await Promise.all([
    prisma.follow.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.follow.count({ where }),
  ]);

  // Enrich with user/manga data
  const enriched = await Promise.all(
    follows.map(async (f) => {
      if (f.followingType === 'USER') {
        const user = await prisma.user.findUnique({
          where: { id: f.followingId },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        });
        return {
          id: f.followingId,
          type: 'USER' as FollowingType,
          name: user?.displayName || user?.username || 'Unknown',
          avatarUrl: user?.avatarUrl,
          followedAt: f.createdAt,
        };
      } else {
        const manga = await prisma.mangaSeries.findUnique({
          where: { id: f.followingId },
          select: {
            id: true,
            title: true,
            coverUrl: true,
          },
        });
        return {
          id: f.followingId,
          type: 'MANGA' as FollowingType,
          name: manga?.title || 'Unknown',
          avatarUrl: manga?.coverUrl,
          followedAt: f.createdAt,
        };
      }
    })
  );

  return {
    following: enriched,
    total,
    hasMore: skip + follows.length < total,
  };
}

/**
 * Get follow counts
 */
export async function getFollowCounts(userId: string): Promise<{
  followers: number;
  following: {
    users: number;
    mangas: number;
    total: number;
  };
}> {
  const [followers, followingUsers, followingMangas] = await Promise.all([
    prisma.follow.count({
      where: {
        followingId: userId,
        followingType: 'USER',
      },
    }),
    prisma.follow.count({
      where: {
        followerId: userId,
        followingType: 'USER',
      },
    }),
    prisma.follow.count({
      where: {
        followerId: userId,
        followingType: 'MANGA',
      },
    }),
  ]);

  return {
    followers,
    following: {
      users: followingUsers,
      mangas: followingMangas,
      total: followingUsers + followingMangas,
    },
  };
}

/**
 * Get recommended users to follow
 * Based on common follows and reading history
 */
export async function getRecommendedUsers(
  userId: string,
  limit: number = 10
): Promise<
  Array<{
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    reason: string;
  }>
> {
  // Get users followed by people user follows
  const following = await prisma.follow.findMany({
    where: {
      followerId: userId,
      followingType: 'USER',
    },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);

  if (followingIds.length === 0) {
    // Return popular users
    const popular = await prisma.user.findMany({
      where: {
        id: { not: userId },
        role: 'USER',
      },
      take: limit,
      orderBy: { xpPoints: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    return popular.map((u) => ({
      ...u,
      reason: 'Popular en la comunidad',
    }));
  }

  // Find users followed by people user follows
  const recommendations = await prisma.follow.findMany({
    where: {
      followerId: { in: followingIds },
      followingType: 'USER',
      followingId: { not: { in: [...followingIds, userId] } },
    },
    select: { followingId: true },
  });

  // Count frequency
  const frequency: Record<string, number> = {};
  recommendations.forEach((r) => {
    frequency[r.followingId] = (frequency[r.followingId] || 0) + 1;
  });

  // Sort by frequency
  const sortedIds = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const users = await prisma.user.findMany({
    where: { id: { in: sortedIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  });

  return users.map((u) => ({
    ...u,
    reason: 'Seguido por personas que sigues',
  }));
}
