import type {
  IPaymentRepository,
  TipRecord,
  TipWithRelationsRecord,
  ContributionWithRelationsRecord,
  CrowdfundingContributionRecord,
} from '@/core/services/IPaymentRepository';
import { getNotificationService } from '@/core/services/NotificationService';

export interface SendTipDTO {
  chapterId: string;
  fromUserId: string;
  amount: number;
  message?: string;
}

export interface ContributeDTO {
  chapterId: string;
  userId: string;
  amount: number;
  isAnonymous?: boolean;
  message?: string;
}

export interface TipWithRelations extends TipWithRelationsRecord {}

export interface CrowdfundingStatus {
  current: number;
  goal: number;
  contributors: number;
  percentage: number;
  isGoalReached: boolean;
}

export interface ContributionWithRelations extends ContributionWithRelationsRecord {}

export class PaymentService {
  constructor(private readonly repository: IPaymentRepository) {}

  async sendTip(data: SendTipDTO): Promise<{ success: boolean; newBalance: number; tip: TipRecord }> {
    const { chapterId, fromUserId, amount, message } = data;

    if (amount < 1) {
      throw new Error('El monto mínimo es 1 Aura');
    }

    const chapter = await this.repository.getChapterWithAuthor(chapterId);

    if (!chapter) {
      throw new Error('Capítulo no encontrado');
    }

    const toUserId = chapter.authorId;

    if (fromUserId === toUserId) {
      throw new Error('No puedes enviarte propina a ti mismo');
    }

    const hasBalance = await this.repository.validateBalance(fromUserId, amount);
    if (!hasBalance) {
      throw new Error('Saldo insuficiente');
    }

    const sender = await this.repository.getUserBasicInfo(fromUserId);

    if (!sender) {
      throw new Error('Usuario emisor no encontrado');
    }

    const { tip, newSenderBalance } = await this.repository.sendTipTransaction({
      chapterId,
      fromUserId,
      toUserId,
      amount,
      message: message || null,
      authorName: chapter.authorName,
      chapterNumber: chapter.chapterNumber,
    });

    try {
      await (await getNotificationService()).notifyTipReceived(
        toUserId,
        amount,
        { id: chapter.id, chapterNumber: chapter.chapterNumber, title: chapter.title },
        { id: sender.id, username: sender.username, displayName: sender.displayName || undefined },
        message
      );
    } catch (error) {
      console.error('Error sending tip notification:', error);
    }

    return {
      success: true,
      newBalance: newSenderBalance,
      tip,
    };
  }

  async getChapterTips(chapterId: string): Promise<TipWithRelationsRecord[]> {
    return this.repository.getChapterTips(chapterId);
  }

  async getUserTipsReceived(userId: string, limit: number = 50): Promise<TipWithRelationsRecord[]> {
    return this.repository.getUserTipsReceived(userId, limit);
  }

  async getUserTipsGiven(userId: string, limit: number = 50): Promise<TipWithRelationsRecord[]> {
    return this.repository.getUserTipsGiven(userId, limit);
  }

  async getTotalTipsReceived(userId: string): Promise<number> {
    return this.repository.getTotalTipsReceived(userId);
  }

  async contributeToCrowdfunding(data: ContributeDTO): Promise<{
    success: boolean;
    newTotal: number;
    goalReached: boolean;
    contribution: CrowdfundingContributionRecord;
  }> {
    const { chapterId, userId, amount, isAnonymous = false, message } = data;

    if (amount < 1) {
      throw new Error('El monto mínimo es 1 Aura');
    }

    const chapter = await this.repository.getChapterWithCrowdfunding(chapterId);

    if (!chapter) {
      throw new Error('Capítulo no encontrado');
    }

    if (!chapter.crowdfundingGoal) {
      throw new Error('Este capítulo no tiene crowdfunding activo');
    }

    const hasBalance = await this.repository.validateBalance(userId, amount);
    if (!hasBalance) {
      throw new Error('Saldo insuficiente');
    }

    const contributor = await this.repository.getUserBasicInfo(userId);

    if (!contributor) {
      throw new Error('Usuario contribuyente no encontrado');
    }

    const authorId = chapter.authorId;

    const { contribution, newCrowdfundingCurrent } = await this.repository.contributeTransaction({
      chapterId,
      userId,
      amount,
      isAnonymous,
      message: message || null,
      chapterNumber: chapter.chapterNumber,
    });

    const goalReached = newCrowdfundingCurrent >= (chapter.crowdfundingGoal || 0);

    try {
      await (await getNotificationService()).notifyCrowdfundingContribution(
        authorId,
        amount,
        { id: chapter.id, chapterNumber: chapter.chapterNumber, title: chapter.title },
        { id: contributor.id, username: contributor.username, displayName: contributor.displayName || undefined },
        isAnonymous,
        newCrowdfundingCurrent,
        chapter.crowdfundingGoal || 0
      );
    } catch (error) {
      console.error('Error sending crowdfunding notification:', error);
    }

    return {
      success: true,
      newTotal: newCrowdfundingCurrent,
      goalReached,
      contribution,
    };
  }

  async getChapterCrowdfunding(chapterId: string): Promise<CrowdfundingStatus> {
    const chapter = await this.repository.getChapterCrowdfunding(chapterId);

    if (!chapter || !chapter.crowdfundingGoal) {
      return {
        current: 0,
        goal: 0,
        contributors: 0,
        percentage: 0,
        isGoalReached: false,
      };
    }

    const contributorsCount = await this.repository.countChapterContributors(chapterId);

    const percentage = Math.min(
      Math.round((chapter.crowdfundingCurrent / chapter.crowdfundingGoal) * 100),
      100
    );

    return {
      current: chapter.crowdfundingCurrent,
      goal: chapter.crowdfundingGoal,
      contributors: contributorsCount,
      percentage,
      isGoalReached: chapter.crowdfundingCurrent >= chapter.crowdfundingGoal,
    };
  }

  async getChapterContributors(chapterId: string): Promise<ContributionWithRelationsRecord[]> {
    return this.repository.getChapterContributors(chapterId);
  }

  async getUserContribution(chapterId: string, userId: string): Promise<CrowdfundingContributionRecord | null> {
    return this.repository.getUserContribution(chapterId, userId);
  }

  async getUserBalance(userId: string): Promise<number> {
    return this.repository.getUserBalance(userId);
  }

  async getUserTipStats(userId: string): Promise<{
    totalGiven: number;
    totalReceived: number;
    countGiven: number;
    countReceived: number;
  }> {
    return this.repository.getUserTipStats(userId);
  }

  async getUserCrowdfundingStats(userId: string): Promise<{
    totalRaised: number;
    totalContributors: number;
    activeCampaigns: number;
    completedCampaigns: number;
  }> {
    return this.repository.getUserCrowdfundingStats(userId);
  }
}
