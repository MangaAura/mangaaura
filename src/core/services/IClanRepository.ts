export interface ClanRecord {
  id: string;
  name: string;
  emblemUrl: string | null;
  monthlyScore: number;
  totalScore: number;
  currentSeason: number;
  seasonStartDate: Date;
  seasonEndDate: Date | null;
  leaderId: string;
  _count?: { members: number };
}

export interface ClanMembershipRecord {
  id: string;
  clanId: string;
  userId: string;
  role: string;
  contributedScore: number;
  user?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface AchievementDefRecord {
  id: string;
  badgeId: string;
  name: string;
}

export interface IClanRepository {
  findClansOrderedByScore(where: { currentSeason?: number }, limit: number): Promise<ClanRecord[]>;
  findMembersByClan(clanId: string): Promise<ClanMembershipRecord[]>;
  updateUserAura(userId: string, amount: number): Promise<void>;
  createTransaction(userId: string, amount: number, type: string, description: string): Promise<void>;
  findAchievementByBadge(badgeId: string): Promise<AchievementDefRecord | null>;
  findUserAchievement(userId: string, achievementId: string): Promise<unknown | null>;
  createUserAchievement(userId: string, achievementId: string): Promise<void>;
  resetSeasonalScores(): Promise<void>;
  findLatestSeason(): Promise<number>;
  findSeasonEndDate(): Promise<Date | null>;
  updateSeasonDates(clanId: string, seasonNumber: number, startDate: Date, endDate: Date): Promise<void>;
  findMembersWithUsers(clanId: string): Promise<ClanMembershipRecord[]>;
  transferLeadershipInTransaction(clanId: string, currentLeaderId: string, newLeaderId: string): Promise<void>;
}
