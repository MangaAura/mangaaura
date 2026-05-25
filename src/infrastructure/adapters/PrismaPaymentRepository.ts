import {
  type IPaymentRepository,
  type ChapterInfo,
  type ChapterCrowdfundingInfo,
  type UserBasicInfo,
  type TipRecord,
  type CrowdfundingContributionRecord,
  type TipWithRelationsRecord,
  type ContributionWithRelationsRecord,
  type UserTipStats,
  type UserCrowdfundingStats,
  type SendTipTransactionParams,
  type ContributeTransactionParams,
} from '@/core/services/IPaymentRepository';
import { prisma } from '@/lib/prisma';

export class PrismaPaymentRepository implements IPaymentRepository {
  async getChapterWithAuthor(chapterId: string): Promise<ChapterInfo | null> {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        manga: {
          select: { authorId: true, authorName: true },
        },
      },
    });

    if (!chapter) return null;

    return {
      id: chapter.id,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title || '',
      authorId: chapter.manga.authorId,
      authorName: chapter.manga.authorName,
    };
  }

  async getChapterWithCrowdfunding(chapterId: string): Promise<ChapterCrowdfundingInfo | null> {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        manga: {
          select: { authorId: true },
        },
      },
    });

    if (!chapter) return null;

    return {
      id: chapter.id,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title || '',
      crowdfundingGoal: chapter.crowdfundingGoal,
      crowdfundingCurrent: chapter.crowdfundingCurrent,
      authorId: chapter.manga.authorId,
    };
  }

  async getUserBasicInfo(userId: string): Promise<UserBasicInfo | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true },
    });

    if (!user) return null;
    return user;
  }

  async validateBalance(userId: string, amount: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { auraBalance: true },
    });

    return user !== null && user.auraBalance >= amount;
  }

  async getUserBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { auraBalance: true },
    });

    return user?.auraBalance || 0;
  }

  async sendTipTransaction(params: SendTipTransactionParams): Promise<{ tip: TipRecord; newSenderBalance: number }> {
    const { chapterId, fromUserId, toUserId, amount, message, authorName, chapterNumber } = params;

    const result = await prisma.$transaction(async (tx) => {
      const senderUpdated = await tx.user.update({
        where: { id: fromUserId },
        data: { auraBalance: { decrement: amount } },
        select: { auraBalance: true },
      });

      await tx.user.update({
        where: { id: toUserId },
        data: { auraBalance: { increment: amount } },
      });

      const tip = await tx.tip.create({
        data: {
          chapterId,
          fromUserId,
          toUserId,
          amount,
          message: message || null,
        },
      });

      await tx.transaction.create({
        data: {
          userId: fromUserId,
          amount: -amount,
          type: 'TIP_SENT',
          referenceId: tip.id,
          description: `Propina enviada a ${authorName}`,
        },
      });

      await tx.transaction.create({
        data: {
          userId: toUserId,
          amount: amount,
          type: 'TIP_RECEIVED',
          referenceId: tip.id,
          description: `Propina recibida de capítulo ${chapterNumber}`,
        },
      });

      return { tip, balance: senderUpdated.auraBalance };
    });

    return { tip: this.toTipRecord(result.tip), newSenderBalance: result.balance };
  }

  async contributeTransaction(params: ContributeTransactionParams): Promise<{ contribution: CrowdfundingContributionRecord; newCrowdfundingCurrent: number }> {
    const { chapterId, userId, amount, isAnonymous, message, chapterNumber } = params;

    const result = await prisma.$transaction(async (tx) => {
      const existingContribution = await tx.crowdfundingContribution.findUnique({
        where: {
          chapterId_userId: { chapterId, userId },
        },
      });

      let contribution: any;

      if (existingContribution) {
        contribution = await tx.crowdfundingContribution.update({
          where: { id: existingContribution.id },
          data: {
            amount: { increment: amount },
            message: message || existingContribution.message,
            isAnonymous,
          },
        });
      } else {
        contribution = await tx.crowdfundingContribution.create({
          data: {
            chapterId,
            userId,
            amount,
            isAnonymous,
            message: message || null,
          },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { auraBalance: { decrement: amount } },
      });

      const updated = await tx.chapter.update({
        where: { id: chapterId },
        data: { crowdfundingCurrent: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'CROWDFUNDING_CONTRIBUTION',
          referenceId: chapterId,
          description: `Contribución a crowdfunding - Capítulo ${chapterNumber}`,
        },
      });

      return { contribution, updated };
    });

    return { contribution: this.toCrowdfundingContributionRecord(result.contribution), newCrowdfundingCurrent: result.updated.crowdfundingCurrent };
  }

  async getChapterTips(chapterId: string): Promise<TipWithRelationsRecord[]> {
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

    return tips as unknown as TipWithRelationsRecord[];
  }

  async getUserTipsReceived(userId: string, limit: number): Promise<TipWithRelationsRecord[]> {
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

    return tips as unknown as TipWithRelationsRecord[];
  }

  async getUserTipsGiven(userId: string, limit: number): Promise<TipWithRelationsRecord[]> {
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

    return tips as unknown as TipWithRelationsRecord[];
  }

  async getTotalTipsReceived(userId: string): Promise<number> {
    const result = await prisma.tip.aggregate({
      where: { toUserId: userId },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  }

  async getChapterCrowdfunding(chapterId: string): Promise<{ crowdfundingGoal: number | null; crowdfundingCurrent: number } | null> {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        crowdfundingGoal: true,
        crowdfundingCurrent: true,
      },
    });

    return chapter;
  }

  async countChapterContributors(chapterId: string): Promise<number> {
    return prisma.crowdfundingContribution.count({
      where: { chapterId },
    });
  }

  async getChapterContributors(chapterId: string): Promise<ContributionWithRelationsRecord[]> {
    const contributions = await prisma.crowdfundingContribution.findMany({
      where: { chapterId },
      orderBy: { amount: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return contributions.map((c: any) => ({
      ...c,
      user: c.isAnonymous ? null : c.user,
    })) as ContributionWithRelationsRecord[];
  }

  async getUserContribution(chapterId: string, userId: string): Promise<CrowdfundingContributionRecord | null> {
    const contribution = await prisma.crowdfundingContribution.findUnique({
      where: {
        chapterId_userId: { chapterId, userId },
      },
    });

    if (!contribution) return null;
    return this.toCrowdfundingContributionRecord(contribution);
  }

  async getUserTipStats(userId: string): Promise<UserTipStats> {
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

  async getUserCrowdfundingStats(userId: string): Promise<UserCrowdfundingStats> {
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

  private toTipRecord(data: any): TipRecord {
    return {
      id: data.id,
      chapterId: data.chapterId,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      amount: data.amount,
      message: data.message,
      createdAt: data.createdAt,
    };
  }

  private toCrowdfundingContributionRecord(data: any): CrowdfundingContributionRecord {
    return {
      id: data.id,
      chapterId: data.chapterId,
      userId: data.userId,
      amount: data.amount,
      isAnonymous: data.isAnonymous,
      message: data.message,
      createdAt: data.createdAt,
    };
  }
}
