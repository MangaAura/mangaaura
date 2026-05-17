import { PrismaClient } from '@prisma/client';
import type {
  IFollowRepository,
  FollowRecord,
  FollowingType,
  FollowQuery,
} from '@/core/services/IFollowRepository';
import { logSecurityEvent, SecurityAction, Severity } from '@/lib/security-audit';

export class PrismaFollowRepository implements IFollowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUnique(followerId: string, followingId: string, followingType: FollowingType): Promise<FollowRecord | null> {
    return this.prisma.follow.findUnique({
      where: {
        followerId_followingId_followingType: { followerId, followingId, followingType },
      },
    }) as Promise<FollowRecord | null>;
  }

  async create(data: { followerId: string; followingId: string; followingType: FollowingType }): Promise<void> {
    await this.prisma.follow.create({ data });
  }

  async delete(followerId: string, followingId: string, followingType: FollowingType): Promise<void> {
    await this.prisma.follow.delete({
      where: {
        followerId_followingId_followingType: { followerId, followingId, followingType },
      },
    });
  }

  async findMany(query: FollowQuery): Promise<[FollowRecord[], number]> {
    const where: Record<string, unknown> = {};
    if (query.followerId) where.followerId = query.followerId;
    if (query.followingId) where.followingId = query.followingId;
    if (query.followingType) where.followingType = query.followingType;

    const [records, total] = await Promise.all([
      this.prisma.follow.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: query.followingId ? {
          follower: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        } : undefined,
      }),
      this.prisma.follow.count({ where }),
    ]);

    return [records as unknown as FollowRecord[], total];
  }

  async findFollowingWithUsers(
    followerId: string,
    followingType?: FollowingType,
    skip: number = 0,
    limit: number = 20
  ): Promise<[FollowRecord[], number]> {
    const where: Record<string, unknown> = { followerId };
    if (followingType) where.followingType = followingType;

    const [records, total] = await Promise.all([
      this.prisma.follow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where }),
    ]);

    return [records as unknown as FollowRecord[], total];
  }

  async findUser(userId: string): Promise<{ id: string; username: string; displayName: string | null; avatarUrl: string | null } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });
  }

  async findManga(mangaId: string): Promise<{ id: string; title: string; coverUrl: string | null } | null> {
    return this.prisma.mangaSeries.findUnique({
      where: { id: mangaId },
      select: { id: true, title: true, coverUrl: true },
    });
  }

  async countFollowers(followingId: string, followingType: FollowingType): Promise<number> {
    return this.prisma.follow.count({ where: { followingId, followingType } });
  }

  async countFollowing(followerId: string, followingType: FollowingType): Promise<number> {
    return this.prisma.follow.count({ where: { followerId, followingType } });
  }

  async findFollowingIds(followerId: string): Promise<string[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followerId, followingType: 'USER' },
      select: { followingId: true },
    });
    return follows.map(f => f.followingId);
  }

  async findPopularUsers(excludeUserId: string, limit: number): Promise<Array<{ id: string; username: string; displayName: string | null; avatarUrl: string | null }>> {
    return this.prisma.user.findMany({
      where: { id: { not: excludeUserId }, role: 'USER' },
      take: limit,
      orderBy: { xpPoints: 'desc' },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });
  }

  async findRecommendedIds(followingIds: string[], excludeIds: string[]): Promise<string[]> {
    const recommendations = await this.prisma.follow.findMany({
      where: {
        followerId: { in: followingIds },
        followingType: 'USER',
        followingId: { notIn: excludeIds },
      },
      select: { followingId: true },
    });
    return recommendations.map(r => r.followingId);
  }

  async findUsersByIds(ids: string[]): Promise<Array<{ id: string; username: string; displayName: string | null; avatarUrl: string | null }>> {
    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });
  }

  async logSecurityEvent(userId: string, action: string, targetId: string, targetType: string, severity: string): Promise<void> {
    await logSecurityEvent({ userId, action: action as SecurityAction, targetId, targetType: targetType as 'USER' | 'MANGA' | 'CHAPTER' | 'COMMENT' | 'REPORT', severity: severity as Severity });
  }
}
