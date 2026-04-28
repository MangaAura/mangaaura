import { prisma } from '@/lib/prisma';

// Season configuration
const SEASON_DURATION_DAYS = 30;
const REWARD_DISTRIBUTION = {
  TOP_1: { banner: true, inkcoins: 10000, badge: 'season_champion' },
  TOP_2: { banner: false, inkcoins: 5000, badge: 'season_runner_up' },
  TOP_3: { banner: false, inkcoins: 3000, badge: 'season_third' },
  TOP_10: { banner: false, inkcoins: 1000, badge: null },
};

export interface ClanRanking {
  clanId: string;
  clanName: string;
  emblemUrl: string | null;
  monthlyScore: number;
  totalScore: number;
  memberCount: number;
  rank: number;
}

export interface SeasonResult {
  seasonNumber: number;
  endDate: Date;
  topClans: ClanRanking[];
  rewardsDistributed: boolean;
}

export class ClanService {
  /**
   * Calculate monthly rankings for clans
   */
  async calculateSeasonalRanking(
    seasonNumber?: number,
    limit: number = 100
  ): Promise<ClanRanking[]> {
    const where = seasonNumber ? { currentSeason: seasonNumber } : {};

    const clans = await prisma.clan.findMany({
      where,
      orderBy: { monthlyScore: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return clans.map((clan, index) => ({
      clanId: clan.id,
      clanName: clan.name,
      emblemUrl: clan.emblemUrl,
      monthlyScore: clan.monthlyScore,
      totalScore: clan.totalScore,
      memberCount: clan._count.members,
      rank: index + 1,
    }));
  }

  /**
   * Get current season rankings
   */
  async getCurrentRankings(limit: number = 100): Promise<ClanRanking[]> {
    return this.calculateSeasonalRanking(undefined, limit);
  }

  /**
   * Distribute seasonal rewards to top clans
   */
  async distributeSeasonRewards(
    seasonNumber: number,
    seasonWinnerId: string
  ): Promise<SeasonResult> {
    const rankings = await this.calculateSeasonalRanking(seasonNumber, 10);
    
    const endDate = new Date();
    const rewardsDistributed = await prisma.$transaction(async (tx) => {
      // Process rewards for top clans
      for (const clan of rankings) {
        const reward = this.getRewardForRank(clan.rank);
        
        if (!reward) continue;

        // Get clan members to distribute rewards
        const members = await tx.clanMembership.findMany({
          where: { clanId: clan.clanId },
          include: {
            user: {
              select: { id: true },
            },
          },
        });

        // Distribute InkCoins to members based on contribution
        const totalContributed = members.reduce(
          (sum, m) => sum + m.contributedScore,
          0
        ) || 1;

        for (const member of members) {
          const share = member.contributedScore / totalContributed;
          const memberReward = Math.floor(reward.inkcoins * share);

          if (memberReward > 0) {
            // Update user balance
            await tx.user.update({
              where: { id: member.userId },
              data: {
                inkcoinsBalance: { increment: memberReward },
              },
            });

            // Create transaction record
            await tx.transaction.create({
              data: {
                userId: member.userId,
                amount: memberReward,
                type: 'CLAN_SEASON_REWARD',
                description: `Recompensa de temporada ${seasonNumber} - Clan ${clan.clanName} (Posición #${clan.rank})`,
              },
            });
          }
        }

        // Award badge if applicable
        if (reward.badge) {
          const achievementDef = await tx.achievementDefinition.findUnique({
            where: { badgeId: reward.badge },
          });

          if (achievementDef) {
            for (const member of members) {
              const hasAchievement = await tx.userAchievement.findUnique({
                where: {
                  userId_achievementId: {
                    userId: member.userId,
                    achievementId: achievementDef.id,
                  },
                },
              });

              if (!hasAchievement) {
                await tx.userAchievement.create({
                  data: {
                    userId: member.userId,
                    achievementId: achievementDef.id,
                  },
                });
              }
            }
          }
        }
      }

      // Reset monthly scores and increment season
      await tx.clan.updateMany({
        data: {
          monthlyScore: 0,
          currentSeason: { increment: 1 },
        },
      });

      // Reset member contributed scores
      await tx.clanMembership.updateMany({
        data: {
          contributedScore: 0,
        },
      });

      return true;
    });

    return {
      seasonNumber,
      endDate,
      topClans: rankings,
      rewardsDistributed,
    };
  }

  /**
   * Get reward configuration for a specific rank
   */
  private getRewardForRank(rank: number) {
    if (rank === 1) return REWARD_DISTRIBUTION.TOP_1;
    if (rank === 2) return REWARD_DISTRIBUTION.TOP_2;
    if (rank === 3) return REWARD_DISTRIBUTION.TOP_3;
    if (rank <= 10) return REWARD_DISTRIBUTION.TOP_10;
    return null;
  }

  /**
   * Get clan statistics
   */
  async getClanStats(clanId: string): Promise<{
    totalMembers: number;
    totalContributed: number;
    averageContribution: number;
    topContributor: {
      userId: string;
      username: string;
      avatarUrl: string | null;
      contributedScore: number;
    } | null;
  }> {
    const members = await prisma.clanMembership.findMany({
      where: { clanId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { contributedScore: 'desc' },
    });

    const totalMembers = members.length;
    const totalContributed = members.reduce(
      (sum, m) => sum + m.contributedScore,
      0
    );
    const averageContribution = totalMembers > 0 ? totalContributed / totalMembers : 0;

    const topContributor = members.length > 0
      ? {
          userId: members[0].user.id,
          username: members[0].user.username,
          avatarUrl: members[0].user.avatarUrl,
          contributedScore: members[0].contributedScore,
        }
      : null;

    return {
      totalMembers,
      totalContributed,
      averageContribution,
      topContributor,
    };
  }

  /**
   * Update clan leader
   */
  async transferLeadership(
    clanId: string,
    currentLeaderId: string,
    newLeaderId: string
  ): Promise<void> {
    await prisma.$transaction([
      // Demote current leader
      prisma.clanMembership.updateMany({
        where: {
          clanId,
          userId: currentLeaderId,
          role: 'LEADER',
        },
        data: { role: 'OFFICER' },
      }),

      // Promote new leader
      prisma.clanMembership.updateMany({
        where: {
          clanId,
          userId: newLeaderId,
        },
        data: { role: 'LEADER' },
      }),

      // Update clan leaderId
      prisma.clan.update({
        where: { id: clanId },
        data: { leaderId: newLeaderId },
      }),
    ]);
  }

  /**
   * Check if season should end and distribute rewards
   */
  async checkAndEndSeason(): Promise<SeasonResult | null> {
    // Get the clan with the highest current season to determine current season
    const latestClan = await prisma.clan.findFirst({
      orderBy: { currentSeason: 'desc' },
    });

    const currentSeason = latestClan?.currentSeason || 1;

    // Season end logic - checks if 30 days have passed since season start
    // For now, this is a manual trigger and returns null
    // Future implementation: store season start date and compare with current date
    const seasonDurationMs = SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000;
    const now = new Date();

    // Placeholder: manual trigger - returns null to indicate no auto-end
    void seasonDurationMs;
    void now;

    return null;
  }
}

// Export singleton instance
export const clanService = new ClanService();
