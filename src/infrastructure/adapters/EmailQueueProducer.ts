/**
 * EmailQueueProducer
 *
 * Implementa IEmailQueueProducer resolviendo userId → email desde la BD
 * y encolando los jobs de email en la EmailQueue vía BullMQ.
 *
 * @packageDocumentation
 */

import type { IEmailQueueProducer } from '@/core/services/NotificationService';
import { getEmailQueue } from '@/infrastructure/queue/EmailQueue';
import { prisma } from '@/lib/prisma';

export class EmailQueueProducer implements IEmailQueueProducer {
  async sendAchievementEmail(
    userId: string,
    data: {
      achievementId: string;
      achievementName: string;
      achievementDescription: string;
      achievementIconUrl?: string | null;
      xpReward: number;
    },
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      });
      if (!user?.email) return;

      await getEmailQueue().addAchievementEmail({
        to: user.email,
        userId,
        username: user.username,
        achievementId: data.achievementId,
        achievementName: data.achievementName,
        achievementDescription: data.achievementDescription,
        achievementIconUrl: data.achievementIconUrl ?? undefined,
        xpReward: data.xpReward,
      });
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to queue achievement email:', error);
    }
  }

  async sendTipReceivedEmail(
    userId: string,
    data: {
      tipId: string;
      amount: number;
      message?: string | null;
      fromUserId: string;
      fromUsername: string;
    },
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      });
      if (!user?.email) return;

      await getEmailQueue().addTipReceivedEmail({
        to: user.email,
        userId,
        username: user.username,
        tipId: data.tipId,
        amount: data.amount,
        message: data.message ?? undefined,
        fromUserId: data.fromUserId,
        fromUsername: data.fromUsername,
      });
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to queue tip email:', error);
    }
  }

  async sendCommentReplyEmail(
    userId: string,
    data: {
      commentId: string;
      replyContent: string;
      replierUsername: string;
      chapterId: string;
      chapterNumber: number;
      mangaTitle: string;
    },
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      });
      if (!user?.email) return;

      // Resolve the actual chapter number from DB if not provided
      let chapterNumber = data.chapterNumber;
      if (!chapterNumber) {
        const chapter = await prisma.chapter.findUnique({
          where: { id: data.chapterId },
          select: { chapterNumber: true },
        });
        if (chapter) {
          chapterNumber = chapter.chapterNumber;
        }
      }

      await getEmailQueue().addCommentReplyEmail({
        to: user.email,
        userId,
        username: user.username,
        commentId: data.commentId,
        replyContent: data.replyContent,
        replierUsername: data.replierUsername,
        chapterId: data.chapterId,
        chapterNumber,
        mangaTitle: data.mangaTitle,
      });
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to queue comment reply email:', error);
    }
  }

  async sendLevelUpEmail(
    userId: string,
    data: {
      oldLevel: number;
      newLevel: number;
    },
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      });
      if (!user?.email) return;

      await getEmailQueue().addLevelUpEmail({
        to: user.email,
        userId,
        username: user.username,
        oldLevel: data.oldLevel,
        newLevel: data.newLevel,
      });
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to queue level-up email:', error);
    }
  }

  async sendMentionEmail(
    userId: string,
    data: {
      mentionerUsername: string;
      commentContent: string;
      chapterId: string;
      commentId: string;
      mangaTitle?: string;
    },
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      });
      if (!user?.email) return;

      await getEmailQueue().addMentionEmail({
        to: user.email,
        userId,
        username: user.username,
        mentionerUsername: data.mentionerUsername,
        commentContent: data.commentContent,
        mangaTitle: data.mangaTitle,
        chapterId: data.chapterId,
        commentId: data.commentId,
      });
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to queue mention email:', error);
    }
  }

  async sendClanInviteEmail(
    userId: string,
    data: {
      clanId: string;
      clanName: string;
      clanSlug: string;
      inviterUsername: string;
    },
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      });
      if (!user?.email) return;

      await getEmailQueue().addClanInviteEmail({
        to: user.email,
        userId,
        username: user.username,
        clanId: data.clanId,
        clanName: data.clanName,
        clanSlug: data.clanSlug,
        inviterUsername: data.inviterUsername,
      });
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to queue clan invite email:', error);
    }
  }
}

export default EmailQueueProducer;
