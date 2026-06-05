/**
 * EmailQueueProducer
 *
 * Implementa IEmailQueueProducer resolviendo userId → email desde la BD
 * y encolando los jobs de email en la EmailQueue vía BullMQ.
 *
 * @packageDocumentation
 */

import type { IEmailQueueProducer } from '@/core/services/NotificationService';
import { emailService } from '@/infrastructure/adapters/emailService';
import { baseEmailTemplate } from '@/lib/email-templates';
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

      await emailService.sendAchievementUnlockedEmail(
        { id: userId, email: user.email, username: user.username },
        {
          name: data.achievementName,
          description: data.achievementDescription,
          xpReward: data.xpReward,
        }
      );
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to send achievement email:', error);
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

      await emailService.sendTipReceivedEmail(
        { id: userId, email: user.email, username: user.username },
        {
          id: data.tipId,
          amount: data.amount,
          message: data.message ?? null,
          createdAt: new Date(),
        },
        { id: data.fromUserId, email: '', username: data.fromUsername }
      );
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to send tip email:', error);
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

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const chapterLink = `${baseUrl}/reader?chapterId=${data.chapterId}#comment-${data.commentId}`;

      const { html, text } = baseEmailTemplate({
        title: `${data.replierUsername} respondió a tu comentario`,
        preview: `${data.replierUsername} respondió a tu comentario en ${data.mangaTitle}`,
        content: `
          <p><strong>${data.replierUsername}</strong> respondió a tu comentario en <strong>"${data.mangaTitle}"</strong>.</p>
          <div style="margin: 15px 0; padding: 15px; background: #f1f5f9; border-radius: 8px; border-left: 4px solid #6366f1; color: #475569; font-style: italic;">
            "${data.replyContent}"
          </div>
          <p>Haz clic en el botón para ver la respuesta completa.</p>
        `,
        ctaText: 'Ver respuesta',
        ctaUrl: chapterLink,
      });

      await emailService.sendEmail(user.email, {
        subject: `${data.replierUsername} respondió a tu comentario en ${data.mangaTitle}`,
        html,
        text,
      });
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to send comment reply email:', error);
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

      await emailService.sendLevelUpEmail(
        { id: userId, email: user.email, username: user.username },
        data.oldLevel,
        data.newLevel
      );
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to send level-up email:', error);
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

      await emailService.sendMentionEmail(
        { id: userId, email: user.email, username: user.username },
        data.mentionerUsername,
        data.commentContent.substring(0, 200),
        data.chapterId,
        data.commentId
      );
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to send mention email:', error);
    }
  }

  async sendReferralSignupEmail(
    userId: string,
    data: {
      refereeId: string;
      refereeUsername: string;
    },
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      });
      if (!user?.email) return;

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const referralsUrl = `${baseUrl}/economy/referrals`;

      const { html, text } = baseEmailTemplate({
        title: '🎉 Nuevo Referido Registrado',
        preview: `${data.refereeUsername} se registró con tu código`,
        content: `
          <p>¡<strong>${data.refereeUsername}</strong> se registró en MangaAura con tu código de referido!</p>
          <p>Cuando haga su primera compra de Aura, ganarás un bono del 10%.</p>
        `,
        ctaText: 'Ver mis referidos',
        ctaUrl: referralsUrl,
      });

      await emailService.sendEmail(user.email, {
        subject: `🎉 ${data.refereeUsername} se registró con tu código — MangaAura`,
        html,
        text,
      });
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to send referral signup email:', error);
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

      await emailService.sendClanInviteEmail(
        { id: userId, email: user.email, username: user.username },
        data.clanName,
        data.inviterUsername,
        data.clanSlug
      );
    } catch (error) {
      console.error('[EmailQueueProducer] Failed to send clan invite email:', error);
    }
  }
}

export default EmailQueueProducer;
