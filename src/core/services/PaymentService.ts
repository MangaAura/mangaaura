import { prisma } from '@/lib/prisma';
import { notificationService } from '@/core/services/NotificationService';
import type { Tip, CrowdfundingContribution, Chapter, User } from '@prisma/client';

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

export interface TipWithRelations extends Tip {
  chapter: Pick<Chapter, 'id' | 'chapterNumber' | 'title'>;
  fromUser: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  toUser: Pick<User, 'id' | 'username' | 'avatarUrl'>;
}

export interface CrowdfundingStatus {
  current: number;
  goal: number;
  contributors: number;
  percentage: number;
  isGoalReached: boolean;
}

export interface ContributionWithRelations extends CrowdfundingContribution {
  user: Pick<User, 'id' | 'username' | 'avatarUrl'> | null;
}

export class PaymentService {
  /**
   * Send a tip to a chapter author
   */
  async sendTip(data: SendTipDTO): Promise<{ success: boolean; newBalance: number; tip: Tip }> {
    const { chapterId, fromUserId, amount, message } = data;

    // Validate minimum amount
    if (amount < 1) {
      throw new Error('El monto mínimo es 1 InkCoin');
    }

    // Get chapter with author info
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        manga: {
          select: { authorId: true, authorName: true },
        },
      },
    });

    if (!chapter) {
      throw new Error('Capítulo no encontrado');
    }

    const toUserId = chapter.manga.authorId;

    // Prevent self-tipping
    if (fromUserId === toUserId) {
      throw new Error('No puedes enviarte propina a ti mismo');
    }

    // Validate balance
    const hasBalance = await this.validateBalance(fromUserId, amount);
    if (!hasBalance) {
      throw new Error('Saldo insuficiente');
    }

    // Get sender info for notification
    const sender = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: { id: true, username: true, displayName: true },
    });

    if (!sender) {
      throw new Error('Usuario emisor no encontrado');
    }

    // Execute atomic transaction
    const [tip, newSenderBalance] = await prisma.$transaction(async (tx) => {
      // Deduct from sender
      const senderUpdated = await tx.user.update({
        where: { id: fromUserId },
        data: { inkcoinsBalance: { decrement: amount } },
        select: { inkcoinsBalance: true },
      });

      // Add to receiver
      await tx.user.update({
        where: { id: toUserId },
        data: { inkcoinsBalance: { increment: amount } },
      });

      // Create tip record
      const tipRecord = await tx.tip.create({
        data: {
          chapterId,
          fromUserId,
          toUserId,
          amount,
          message: message || null,
        },
      });

      // Create transaction records for both parties
      await tx.transaction.create({
        data: {
          userId: fromUserId,
          amount: -amount,
          type: 'TIP_SENT',
          referenceId: tipRecord.id,
          description: `Propina enviada a ${chapter.manga.authorName}`,
        },
      });

      await tx.transaction.create({
        data: {
          userId: toUserId,
          amount: amount,
          type: 'TIP_RECEIVED',
          referenceId: tipRecord.id,
          description: `Propina recibida de capítulo ${chapter.chapterNumber}`,
        },
      });

      return [tipRecord, senderUpdated.inkcoinsBalance];
    });

    // Send notification to author (async, don't wait)
    try {
      await notificationService.notifyTipReceived(
        toUserId,
        amount,
        { id: chapter.id, chapterNumber: chapter.chapterNumber, title: chapter.title },
        { id: sender.id, username: sender.username, displayName: sender.displayName || undefined },
        message
      );
    } catch (error) {
      console.error('Error sending tip notification:', error);
      // Don't throw - notification failure shouldn't break the transaction
    }

    return {
      success: true,
      newBalance: newSenderBalance,
      tip,
    };
  }

  /**
   * Get tips for a specific chapter
   */
  async getChapterTips(chapterId: string): Promise<TipWithRelations[]> {
    const tips = await prisma.tip.findMany({
      where: { chapterId },
      orderBy: { createdAt: 'desc' },
      include: {
        chapter: {
          select: { id: true, chapterNumber: true, title: true },
        },
        fromUser: {
          select: { id: true, username: true, avatarUrl: true },
        },
        toUser: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return tips as TipWithRelations[];
  }

  /**
   * Get tips received by a user
   */
  async getUserTipsReceived(userId: string, limit: number = 50): Promise<TipWithRelations[]> {
    const tips = await prisma.tip.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        chapter: {
          select: { id: true, chapterNumber: true, title: true },
        },
        fromUser: {
          select: { id: true, username: true, avatarUrl: true },
        },
        toUser: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return tips as TipWithRelations[];
  }

  /**
   * Get tips given by a user
   */
  async getUserTipsGiven(userId: string, limit: number = 50): Promise<TipWithRelations[]> {
    const tips = await prisma.tip.findMany({
      where: { fromUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        chapter: {
          select: { id: true, chapterNumber: true, title: true },
        },
        fromUser: {
          select: { id: true, username: true, avatarUrl: true },
        },
        toUser: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return tips as TipWithRelations[];
  }

  /**
   * Get total tips received by a user
   */
  async getTotalTipsReceived(userId: string): Promise<number> {
    const result = await prisma.tip.aggregate({
      where: { toUserId: userId },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  }

  /**
   * Contribute to a chapter's crowdfunding
   */
  async contributeToCrowdfunding(data: ContributeDTO): Promise<{ 
    success: boolean; 
    newTotal: number; 
    goalReached: boolean;
    contribution: CrowdfundingContribution;
  }> {
    const { chapterId, userId, amount, isAnonymous = false, message } = data;

    // Validate minimum amount
    if (amount < 1) {
      throw new Error('El monto mínimo es 1 InkCoin');
    }

    // Get chapter with crowdfunding info
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        manga: {
          select: { authorId: true },
        },
      },
    });

    if (!chapter) {
      throw new Error('Capítulo no encontrado');
    }

    if (!chapter.crowdfundingGoal) {
      throw new Error('Este capítulo no tiene crowdfunding activo');
    }

    // Validate balance
    const hasBalance = await this.validateBalance(userId, amount);
    if (!hasBalance) {
      throw new Error('Saldo insuficiente');
    }

    // Get contributor info for notification
    const contributor = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true },
    });

    if (!contributor) {
      throw new Error('Usuario contribuyente no encontrado');
    }

    const authorId = chapter.manga.authorId;

    // Execute atomic transaction
    const [contribution, newChapter] = await prisma.$transaction(async (tx) => {
      // Check if user already contributed
      const existingContribution = await tx.crowdfundingContribution.findUnique({
        where: {
          chapterId_userId: { chapterId, userId },
        },
      });

      let contributionRecord: CrowdfundingContribution;

      if (existingContribution) {
        // Update existing contribution
        contributionRecord = await tx.crowdfundingContribution.update({
          where: { id: existingContribution.id },
          data: {
            amount: { increment: amount },
            message: message || existingContribution.message,
            isAnonymous,
          },
        });
      } else {
        // Create new contribution
        contributionRecord = await tx.crowdfundingContribution.create({
          data: {
            chapterId,
            userId,
            amount,
            isAnonymous,
            message: message || null,
          },
        });
      }

      // Deduct from user
      await tx.user.update({
        where: { id: userId },
        data: { inkcoinsBalance: { decrement: amount } },
      });

      // Update chapter crowdfunding
      const updatedChapter = await tx.chapter.update({
        where: { id: chapterId },
        data: { crowdfundingCurrent: { increment: amount } },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'CROWDFUNDING_CONTRIBUTION',
          referenceId: chapterId,
          description: `Contribución a crowdfunding - Capítulo ${chapter.chapterNumber}`,
        },
      });

      return [contributionRecord, updatedChapter];
    });

    const goalReached = newChapter.crowdfundingCurrent >= (chapter.crowdfundingGoal || 0);

    // Send notification to author (async, don't wait)
    try {
      await notificationService.notifyCrowdfundingContribution(
        authorId,
        amount,
        { id: chapter.id, chapterNumber: chapter.chapterNumber, title: chapter.title },
        { id: contributor.id, username: contributor.username, displayName: contributor.displayName || undefined },
        isAnonymous,
        newChapter.crowdfundingCurrent,
        chapter.crowdfundingGoal || 0
      );
    } catch (error) {
      console.error('Error sending crowdfunding notification:', error);
      // Don't throw - notification failure shouldn't break the transaction
    }

    return {
      success: true,
      newTotal: newChapter.crowdfundingCurrent,
      goalReached,
      contribution,
    };
  }

  /**
   * Get crowdfunding status for a chapter
   */
  async getChapterCrowdfunding(chapterId: string): Promise<CrowdfundingStatus> {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        crowdfundingGoal: true,
        crowdfundingCurrent: true,
      },
    });

    if (!chapter || !chapter.crowdfundingGoal) {
      return {
        current: 0,
        goal: 0,
        contributors: 0,
        percentage: 0,
        isGoalReached: false,
      };
    }

    const contributorsCount = await prisma.crowdfundingContribution.count({
      where: { chapterId },
    });

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

  /**
   * Get contributors for a chapter's crowdfunding
   */
  async getChapterContributors(chapterId: string): Promise<ContributionWithRelations[]> {
    const contributions = await prisma.crowdfundingContribution.findMany({
      where: { chapterId },
      orderBy: { amount: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return contributions.map(c => ({
      ...c,
      user: c.isAnonymous ? null : c.user,
    })) as ContributionWithRelations[];
  }

  /**
   * Get user's contribution to a chapter
   */
  async getUserContribution(chapterId: string, userId: string): Promise<CrowdfundingContribution | null> {
    return prisma.crowdfundingContribution.findUnique({
      where: {
        chapterId_userId: { chapterId, userId },
      },
    });
  }

  /**
   * Validate if user has sufficient balance
   */
  private async validateBalance(userId: string, amount: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { inkcoinsBalance: true },
    });

    return user !== null && user.inkcoinsBalance >= amount;
  }

  /**
   * Get user's current balance
   */
  async getUserBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { inkcoinsBalance: true },
    });

    return user?.inkcoinsBalance || 0;
  }

  /**
   * Get total tips statistics for a user
   */
  async getUserTipStats(userId: string): Promise<{
    totalGiven: number;
    totalReceived: number;
    countGiven: number;
    countReceived: number;
  }> {
    const [givenStats, receivedStats] = await Promise.all([
      prisma.tip.aggregate({
        where: { fromUserId: userId },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.tip.aggregate({
        where: { toUserId: userId },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      totalGiven: givenStats._sum.amount || 0,
      totalReceived: receivedStats._sum.amount || 0,
      countGiven: givenStats._count || 0,
      countReceived: receivedStats._count || 0,
    };
  }

  /**
   * Get total crowdfunding statistics for a user (as author)
   */
  async getUserCrowdfundingStats(userId: string): Promise<{
    totalRaised: number;
    totalContributors: number;
    activeCampaigns: number;
    completedCampaigns: number;
  }> {
    const chapters = await prisma.chapter.findMany({
      where: {
        manga: { authorId: userId },
        crowdfundingGoal: { not: null },
      },
      include: {
        crowdfundingContributions: true,
      },
    });

    let totalRaised = 0;
    let totalContributors = 0;
    let activeCampaigns = 0;
    let completedCampaigns = 0;

    const uniqueContributors = new Set<string>();

    for (const chapter of chapters) {
      totalRaised += chapter.crowdfundingCurrent;
      
      for (const contribution of chapter.crowdfundingContributions) {
        uniqueContributors.add(contribution.userId);
      }

      if (chapter.crowdfundingCurrent >= (chapter.crowdfundingGoal || 0)) {
        completedCampaigns++;
      } else {
        activeCampaigns++;
      }
    }

    return {
      totalRaised,
      totalContributors: uniqueContributors.size,
      activeCampaigns,
      completedCampaigns,
    };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
