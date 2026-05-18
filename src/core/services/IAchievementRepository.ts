export interface AchievementCondition {
  type: 'CHAPTERS_READ' | 'COMMENTS_POSTED' | 'CORRECTIONS_APPROVED' |
        'MANGAS_COMPLETED' | 'COMMENT_LIKES_RECEIVED' | 'MANGAS_CREATED' |
        'SPONSORSHIPS_WON' | 'LEVEL_REACHED' | 'STREAK_REACHED' | 'QUESTS_COMPLETED';
  count?: number;
  level?: number;
  days?: number;
}

export interface Achievement {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  xpReward: number;
  iconUrl: string | null;
  condition: AchievementCondition;
  category: string;
  difficulty: string;
  createdAt: Date;
}

export interface UserStats {
  chaptersRead: number;
  commentsPosted: number;
  correctionsApproved: number;
  mangasCompleted: number;
  commentLikesReceived: number;
  mangasCreated: number;
  sponsorshipsWon: number;
  currentLevel: number;
  readingStreak: number;
  questsCompleted: number;
}

export interface IAchievementRepository {
  findAll(): Promise<Achievement[]>;
  findByBadgeId(badgeId: string): Promise<Achievement | null>;
  isUnlocked(userId: string, achievementId: string): Promise<boolean>;
  createUserAchievement(userId: string, achievementId: string): Promise<void>;
  getUserStats(userId: string): Promise<UserStats>;
  getTotalXPEarned(userId: string): Promise<number>;
  getUserAchievementRecords(userId: string): Promise<Array<{ achievementId: string; unlockedAt: Date }>>;
}
