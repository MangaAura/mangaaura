import { PrismaClient } from '@prisma/client';

import type {
  IClanRepository,
  ClanRecord,
  ClanMembershipRecord,
  AchievementDefRecord,
} from '@/core/services/IClanRepository';

export class PrismaClanRepository implements IClanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findClansOrderedByScore(where: { currentSeason?: number }, limit: number): Promise<ClanRecord[]> {
    return this.prisma.clan.findMany({
      where,
      orderBy: { monthlyScore: 'desc' },
      take: limit,
      include: { _count: { select: { members: true } } },
    }) as unknown as ClanRecord[];
  }

  async findMembersByClan(clanId: string): Promise<ClanMembershipRecord[]> {
    return this.prisma.clanMembership.findMany({
      where: { clanId },
    }) as unknown as ClanMembershipRecord[];
  }

  async updateUserInkCoins(userId: string, amount: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { inkcoinsBalance: { increment: amount } },
    });
  }

  async createTransaction(userId: string, amount: number, type: string, description: string): Promise<void> {
    await this.prisma.transaction.create({
      data: { userId, amount, type, description },
    });
  }

  async findAchievementByBadge(badgeId: string): Promise<AchievementDefRecord | null> {
    return this.prisma.achievementDefinition.findUnique({
      where: { badgeId },
      select: { id: true, badgeId: true, name: true },
    });
  }

  async findUserAchievement(userId: string, achievementId: string): Promise<unknown | null> {
    return this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    });
  }

  async createUserAchievement(userId: string, achievementId: string): Promise<void> {
    await this.prisma.userAchievement.create({
      data: { userId, achievementId },
    });
  }

  async resetSeasonalScores(): Promise<void> {
    await this.prisma.clan.updateMany({
      data: { monthlyScore: 0, currentSeason: { increment: 1 } },
    });
    await this.prisma.clanMembership.updateMany({
      data: { contributedScore: 0 },
    });
  }

  async findLatestSeason(): Promise<number> {
    const clan = await this.prisma.clan.findFirst({
      orderBy: { currentSeason: 'desc' },
      select: { currentSeason: true },
    });
    return clan?.currentSeason ?? 1;
  }

  async findMembersWithUsers(clanId: string): Promise<ClanMembershipRecord[]> {
    return this.prisma.clanMembership.findMany({
      where: { clanId },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { contributedScore: 'desc' },
    }) as unknown as ClanMembershipRecord[];
  }

  async transferLeadershipInTransaction(clanId: string, currentLeaderId: string, newLeaderId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.clanMembership.updateMany({
        where: { clanId, userId: currentLeaderId, role: 'LEADER' },
        data: { role: 'OFFICER' },
      }),
      this.prisma.clanMembership.updateMany({
        where: { clanId, userId: newLeaderId },
        data: { role: 'LEADER' },
      }),
      this.prisma.clan.update({
        where: { id: clanId },
        data: { leaderId: newLeaderId },
      }),
    ]);
  }
}
