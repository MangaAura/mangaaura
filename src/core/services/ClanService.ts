import type { IClanRepository } from './IClanRepository';

const REWARD_DISTRIBUTION = {
  TOP_1: { banner: true, aura: 10000, badge: 'season_champion' },
  TOP_2: { banner: false, aura: 5000, badge: 'season_runner_up' },
  TOP_3: { banner: false, aura: 3000, badge: 'season_third' },
  TOP_10: { banner: false, aura: 1000, badge: null },
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
  constructor(private readonly repo: IClanRepository) {}

  async calculateSeasonalRanking(
    seasonNumber?: number,
    limit: number = 100
  ): Promise<ClanRanking[]> {
    const where = seasonNumber ? { currentSeason: seasonNumber } : {};
    const clans = await this.repo.findClansOrderedByScore(where as { currentSeason?: number }, limit);

    return clans.map((clan, index) => ({
      clanId: clan.id,
      clanName: clan.name,
      emblemUrl: clan.emblemUrl,
      monthlyScore: clan.monthlyScore,
      totalScore: clan.totalScore,
      memberCount: clan._count?.members ?? 0,
      rank: index + 1,
    }));
  }

  async getCurrentRankings(limit: number = 100): Promise<ClanRanking[]> {
    return this.calculateSeasonalRanking(undefined, limit);
  }

  async distributeSeasonRewards(
    seasonNumber: number,
    _seasonWinnerId: string
  ): Promise<SeasonResult> {
    const rankings = await this.calculateSeasonalRanking(seasonNumber, 10);

    const endDate = new Date();

    for (const clan of rankings) {
      const reward = this.getRewardForRank(clan.rank);
      if (!reward) continue;

      const members = await this.repo.findMembersByClan(clan.clanId);

      const totalContributed = members.reduce(
        (sum, m) => sum + m.contributedScore,
        0
      ) || 1;

      for (const member of members) {
        const share = member.contributedScore / totalContributed;
        const memberReward = Math.floor(reward.aura * share);

        if (memberReward > 0) {
          await this.repo.updateUserAura(member.userId, memberReward);
          await this.repo.createTransaction(
            member.userId,
            memberReward,
            'CLAN_SEASON_REWARD',
            `Recompensa de temporada ${seasonNumber} - Clan ${clan.clanName} (Posición #${clan.rank})`
          );
        }
      }

      if (reward.badge) {
        const achievementDef = await this.repo.findAchievementByBadge(reward.badge);
        if (achievementDef) {
          for (const member of members) {
            const hasAchievement = await this.repo.findUserAchievement(member.userId, achievementDef.id);
            if (!hasAchievement) {
              await this.repo.createUserAchievement(member.userId, achievementDef.id);
            }
          }
        }
      }
    }

    await this.repo.resetSeasonalScores();

    return {
      seasonNumber,
      endDate,
      topClans: rankings,
      rewardsDistributed: true,
    };
  }

  private getRewardForRank(rank: number) {
    if (rank === 1) return REWARD_DISTRIBUTION.TOP_1;
    if (rank === 2) return REWARD_DISTRIBUTION.TOP_2;
    if (rank === 3) return REWARD_DISTRIBUTION.TOP_3;
    if (rank <= 10) return REWARD_DISTRIBUTION.TOP_10;
    return null;
  }

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
    const members = await this.repo.findMembersWithUsers(clanId);

    const totalMembers = members.length;
    const totalContributed = members.reduce(
      (sum, m) => sum + (m.contributedScore || 0),
      0
    );
    const averageContribution = totalMembers > 0 ? totalContributed / totalMembers : 0;

    const topContributor = members.length > 0
      ? {
          userId: members[0].user!.id,
          username: members[0].user!.username,
          avatarUrl: members[0].user!.avatarUrl,
          contributedScore: members[0].contributedScore || 0,
        }
      : null;

    return {
      totalMembers,
      totalContributed,
      averageContribution,
      topContributor,
    };
  }

  async transferLeadership(
    clanId: string,
    currentLeaderId: string,
    newLeaderId: string
  ): Promise<void> {
    await this.repo.transferLeadershipInTransaction(clanId, currentLeaderId, newLeaderId);
  }

  async checkAndEndSeason(): Promise<SeasonResult | null> {
    const currentSeason = await this.repo.findLatestSeason();
    const seasonEndDate = await this.repo.findSeasonEndDate();
    const now = new Date();

    if (!seasonEndDate || now < seasonEndDate) {
      return null;
    }

    const rankings = await this.calculateSeasonalRanking(currentSeason, 10);
    
    if (rankings.length === 0) {
      await this.repo.resetSeasonalScores();
      return null;
    }

    const seasonWinnerId = rankings[0].clanId;

    return this.distributeSeasonRewards(currentSeason, seasonWinnerId);
  }
}

export let clanService: ClanService | undefined;

export function initializeClanService(repo: IClanRepository): ClanService {
  const service = new ClanService(repo);
  clanService = service;
  return service;
}

export { ClanService as ClanServiceClass };
export default ClanService;
