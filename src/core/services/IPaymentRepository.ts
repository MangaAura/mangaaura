export interface IStripeProvider {
  createCheckoutSession(params: { priceId: string; userId: string; mangaId?: string; successUrl: string; cancelUrl: string }): Promise<{ sessionId: string; url: string | null }>;
  createPaymentIntent(params: { amount: number; currency: string; userId: string }): Promise<{ clientSecret: string }>;
  retrieveSession(sessionId: string): Promise<any>;
  handleWebhookEvent(payload: string, signature: string): Promise<any>;
}

export interface ChapterInfo {
  id: string;
  chapterNumber: number;
  title: string;
  authorId: string;
  authorName: string;
}

export interface ChapterCrowdfundingInfo {
  id: string;
  chapterNumber: number;
  title: string;
  crowdfundingGoal: number | null;
  crowdfundingCurrent: number;
  authorId: string;
}

export interface UserBasicInfo {
  id: string;
  username: string;
  displayName: string | null;
}

export interface TipRecord {
  id: string;
  chapterId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  message: string | null;
  createdAt: Date;
}

export interface CrowdfundingContributionRecord {
  id: string;
  chapterId: string;
  userId: string;
  amount: number;
  isAnonymous: boolean;
  message: string | null;
  createdAt: Date;
}

export interface TipWithRelationsRecord {
  id: string;
  chapterId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  message: string | null;
  createdAt: Date;
  chapter: { id: string; chapterNumber: number; title: string };
  fromUser: { id: string; username: string; avatarUrl: string | null };
  toUser: { id: string; username: string; avatarUrl: string | null };
}

export interface ContributionWithRelationsRecord {
  id: string;
  chapterId: string;
  userId: string;
  amount: number;
  isAnonymous: boolean;
  message: string | null;
  createdAt: Date;
  user: { id: string; username: string; avatarUrl: string | null } | null;
}

export interface UserTipStats {
  totalGiven: number;
  totalReceived: number;
  countGiven: number;
  countReceived: number;
}

export interface UserCrowdfundingStats {
  totalRaised: number;
  totalContributors: number;
  activeCampaigns: number;
  completedCampaigns: number;
}

export interface SendTipTransactionParams {
  chapterId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  message: string | null;
  authorName: string;
  chapterNumber: number;
}

export interface ContributeTransactionParams {
  chapterId: string;
  userId: string;
  amount: number;
  isAnonymous: boolean;
  message: string | null;
  chapterNumber: number;
}

export interface IPaymentRepository {
  getChapterWithAuthor(chapterId: string): Promise<ChapterInfo | null>;
  getChapterWithCrowdfunding(chapterId: string): Promise<ChapterCrowdfundingInfo | null>;
  getUserBasicInfo(userId: string): Promise<UserBasicInfo | null>;
  validateBalance(userId: string, amount: number): Promise<boolean>;
  getUserBalance(userId: string): Promise<number>;

  sendTipTransaction(params: SendTipTransactionParams): Promise<{ tip: TipRecord; newSenderBalance: number }>;
  contributeTransaction(params: ContributeTransactionParams): Promise<{ contribution: CrowdfundingContributionRecord; newCrowdfundingCurrent: number }>;

  getChapterTips(chapterId: string): Promise<TipWithRelationsRecord[]>;
  getUserTipsReceived(userId: string, limit: number): Promise<TipWithRelationsRecord[]>;
  getUserTipsGiven(userId: string, limit: number): Promise<TipWithRelationsRecord[]>;
  getTotalTipsReceived(userId: string): Promise<number>;

  getChapterCrowdfunding(chapterId: string): Promise<{ crowdfundingGoal: number | null; crowdfundingCurrent: number } | null>;
  countChapterContributors(chapterId: string): Promise<number>;
  getChapterContributors(chapterId: string): Promise<ContributionWithRelationsRecord[]>;
  getUserContribution(chapterId: string, userId: string): Promise<CrowdfundingContributionRecord | null>;

  getUserTipStats(userId: string): Promise<UserTipStats>;
  getUserCrowdfundingStats(userId: string): Promise<UserCrowdfundingStats>;
}
