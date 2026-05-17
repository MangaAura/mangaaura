import type {
  IFollowRepository,
  FollowingType,
  FollowQuery,
} from './IFollowRepository';

export { FollowingType };

export class FollowService {
  constructor(private readonly repo: IFollowRepository) {}

  async follow(params: {
    followerId: string;
    followingId: string;
    followingType: FollowingType;
  }): Promise<{
    success: boolean;
    isFollowing: boolean;
    error?: string;
  }> {
    try {
      const existingFollow = await this.repo.findUnique(
        params.followerId, params.followingId, params.followingType
      );
      if (existingFollow) {
        return { success: true, isFollowing: true };
      }

      await this.repo.create({
        followerId: params.followerId,
        followingId: params.followingId,
        followingType: params.followingType,
      });

      await this.repo.logSecurityEvent(
        params.followerId,
        'USER_FOLLOWED_USER',
        params.followingId,
        params.followingType === 'USER' ? 'USER' : 'MANGA',
        'INFO'
      );

      return { success: true, isFollowing: true };
    } catch (error) {
      console.error('Error following:', error);
      return { success: false, isFollowing: false, error: 'Error al seguir' };
    }
  }

  async unfollow(params: {
    followerId: string;
    followingId: string;
    followingType: FollowingType;
  }): Promise<{
    success: boolean;
    isFollowing: boolean;
    error?: string;
  }> {
    try {
      await this.repo.delete(params.followerId, params.followingId, params.followingType);
      return { success: true, isFollowing: false };
    } catch {
      return { success: true, isFollowing: false };
    }
  }

  async isFollowing(params: {
    followerId: string;
    followingId: string;
    followingType: FollowingType;
  }): Promise<boolean> {
    try {
      const follow = await this.repo.findUnique(
        params.followerId, params.followingId, params.followingType
      );
      return !!follow;
    } catch {
      return false;
    }
  }

  async toggle(params: {
    followerId: string;
    followingId: string;
    followingType: FollowingType;
  }): Promise<{
    success: boolean;
    isFollowing: boolean;
    error?: string;
  }> {
    const currentlyFollowing = await this.isFollowing(params);
    if (currentlyFollowing) {
      return this.unfollow(params);
    }
    return this.follow(params);
  }

  async getFollowers(params: {
    followingId: string;
    followingType: FollowingType;
    page?: number;
    limit?: number;
  }): Promise<{
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
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const query: FollowQuery = {
      followingId: params.followingId,
      followingType: params.followingType,
      skip,
      limit,
    };

    const [follows, total] = await this.repo.findMany(query);

    return {
      followers: follows.map(f => ({
        id: f.follower!.id,
        username: f.follower!.username,
        displayName: f.follower!.displayName,
        avatarUrl: f.follower!.avatarUrl,
        followedAt: f.createdAt,
      })),
      total,
      hasMore: skip + follows.length < total,
    };
  }

  async getFollowing(params: {
    followerId: string;
    followingType?: FollowingType;
    page?: number;
    limit?: number;
  }): Promise<{
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
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.repo.findFollowingWithUsers(
      params.followerId, params.followingType, skip, limit
    );

    const enriched = await Promise.all(
      follows.map(async (f) => {
        if (f.followingType === 'USER') {
          const user = await this.repo.findUser(f.followingId);
          return {
            id: f.followingId,
            type: 'USER' as FollowingType,
            name: user?.displayName || user?.username || 'Unknown',
            avatarUrl: user?.avatarUrl ?? null,
            followedAt: f.createdAt,
          };
        }
        const manga = await this.repo.findManga(f.followingId);
        return {
          id: f.followingId,
          type: 'MANGA' as FollowingType,
          name: manga?.title || 'Unknown',
          avatarUrl: manga?.coverUrl ?? null,
          followedAt: f.createdAt,
        };
      })
    );

    return {
      following: enriched,
      total,
      hasMore: skip + follows.length < total,
    };
  }

  async getCounts(userId: string): Promise<{
    followers: number;
    following: {
      users: number;
      mangas: number;
      total: number;
    };
  }> {
    const [followers, followingUsers, followingMangas] = await Promise.all([
      this.repo.countFollowers(userId, 'USER'),
      this.repo.countFollowing(userId, 'USER'),
      this.repo.countFollowing(userId, 'MANGA'),
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

  async getRecommended(userId: string, limit: number = 10): Promise<
    Array<{
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      reason: string;
    }>
  > {
    const followingIds = await this.repo.findFollowingIds(userId);

    if (followingIds.length === 0) {
      const popular = await this.repo.findPopularUsers(userId, limit);
      return popular.map(u => ({
        ...u,
        reason: 'Popular en la comunidad',
      }));
    }

    const recommendedIds = await this.repo.findRecommendedIds(
      followingIds,
      [...followingIds, userId]
    );

    const frequency: Record<string, number> = {};
    recommendedIds.forEach(id => {
      frequency[id] = (frequency[id] || 0) + 1;
    });

    const sortedIds = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const users = await this.repo.findUsersByIds(sortedIds);

    return users.map(u => ({
      ...u,
      reason: 'Seguido por personas que sigues',
    }));
  }
}

export let followService: FollowService | undefined;

export function initializeFollowService(repo: IFollowRepository): FollowService {
  const service = new FollowService(repo);
  followService = service;
  return service;
}

function getService(): FollowService {
  if (!followService) {
    throw new Error('FollowService not initialized. Call initializeFollowService(repo) first.');
  }
  return followService;
}

export async function follow(params: {
  followerId: string;
  followingId: string;
  followingType: FollowingType;
}): Promise<{
  success: boolean;
  isFollowing: boolean;
  error?: string;
}> {
  return getService().follow(params);
}

export async function unfollow(params: {
  followerId: string;
  followingId: string;
  followingType: FollowingType;
}): Promise<{
  success: boolean;
  isFollowing: boolean;
  error?: string;
}> {
  return getService().unfollow(params);
}

export async function isFollowing(params: {
  followerId: string;
  followingId: string;
  followingType: FollowingType;
}): Promise<boolean> {
  return getService().isFollowing(params);
}

export async function toggleFollow(params: {
  followerId: string;
  followingId: string;
  followingType: FollowingType;
}): Promise<{
  success: boolean;
  isFollowing: boolean;
  error?: string;
}> {
  return getService().toggle(params);
}

export async function getFollowers(params: {
  followingId: string;
  followingType: FollowingType;
  page?: number;
  limit?: number;
}): Promise<{
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
  return getService().getFollowers(params);
}

export async function getFollowing(params: {
  followerId: string;
  followingType?: FollowingType;
  page?: number;
  limit?: number;
}): Promise<{
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
  return getService().getFollowing(params);
}

export async function getFollowCounts(userId: string): Promise<{
  followers: number;
  following: {
    users: number;
    mangas: number;
    total: number;
  };
}> {
  return getService().getCounts(userId);
}

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
  return getService().getRecommended(userId, limit);
}

export default FollowService;
