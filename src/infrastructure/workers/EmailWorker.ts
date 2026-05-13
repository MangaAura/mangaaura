/**
 * Email Worker para InkVerse
 * Procesa jobs de la cola de emails usando BullMQ
 * @packageDocumentation
 */

import { Worker, Job } from 'bullmq';
import type { Redis } from 'ioredis';
import { emailService } from '@/core/services/EmailService';
import { baseEmailTemplate } from '@/lib/email-templates';
import { redis, isMockRedis } from '@/lib/redis';
import type {
  EmailJobData,
  WelcomeEmailData,
  PasswordResetData,
  NewChapterData,
  AchievementData,
  TipReceivedData,
  CrowdfundingGoalData,
  CommentReplyData,
} from '@/infrastructure/queue/EmailQueue';

// ============================================================================
// Mock Worker for Development (when Redis is not available)
// ============================================================================

class MockEmailWorker {
  async close(): Promise<void> {
    if (process.env.DEBUG_EMAIL) {
      console.log('[EmailWorker] Mock worker stopped');
    }
  }

  on(_event: string, _listener: (...args: unknown[]) => void): void {
    // No-op
  }
}

// ============================================================================
// Email Worker
// ============================================================================

export class EmailWorker {
  private worker: Worker | MockEmailWorker | null = null;
  private useMock: boolean;

  constructor() {
    this.useMock = isMockRedis();

    if (this.useMock) {
      this.initializeMockWorker();
    } else {
      this.initializeRealWorker();
    }
  }

  /**
   * Inicializa un worker mock para desarrollo sin Redis
   */
  private initializeMockWorker(): void {
    this.worker = new MockEmailWorker();

    // Log once that we're using mock mode
    if (process.env.DEBUG_EMAIL) {
      console.log('[EmailWorker] Running in mock mode (Redis not available)');
      console.log('[EmailWorker] Emails will be logged but not actually sent');
    }
  }

  /**
   * Inicializa el worker de emails real con BullMQ
   */
  private initializeRealWorker(): void {
    if (isMockRedis()) {
      this.useMock = true;
      this.initializeMockWorker();
      return;
    }
    try {
      this.worker = new Worker(
        'emails',
        async (job: Job<EmailJobData>) => {
          await this.processJob(job);
        },
        {
          connection: redis as Redis,
          concurrency: 5,
          limiter: {
            max: 10,
            duration: 1000,
          },
          stalledInterval: 30000,
          maxStalledCount: 3,
        }
      );

      this.setupEventHandlers();
    } catch (error) {
      console.error('[EmailWorker] Failed to initialize worker:', error);
      // Fallback to mock mode on error
      this.useMock = true;
      this.initializeMockWorker();
    }
  }

  /**
   * Configura los event handlers del worker
   */
  private setupEventHandlers(): void {
    if (!this.worker || this.useMock) return;

    const bullWorker = this.worker as Worker;

    bullWorker.on('completed', (job: any) => {
      console.info(`[EmailWorker] Job ${job.id} completed: ${job.data.type}`);
    });

    bullWorker.on('failed', (job: any, err: any) => {
      console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
    });

    bullWorker.on('error', (error: any) => {
      // Only log errors in production or with DEBUG_EMAIL flag
      if (process.env.NODE_ENV === 'production' || process.env.DEBUG_EMAIL) {
        console.error('[EmailWorker] Worker error:', error);
      }
    });
  }

  /**
   * Procesa un job segun su tipo
   */
  private async processJob(job: Job<EmailJobData>): Promise<void> {
    const { data } = job;
    console.info(`[EmailWorker] Processing job ${job.id}: ${data.type}`);

    try {
      // In mock mode, just log the email instead of sending
      if (this.useMock) {
        this.logMockEmail(data);
        return;
      }

      switch (data.type) {
        case 'welcome':
          await this.processWelcomeEmail(job as Job<WelcomeEmailData>);
          break;
        case 'password-reset':
          await this.processPasswordResetEmail(job as Job<PasswordResetData>);
          break;
        case 'new-chapter':
          await this.processNewChapterEmail(job as Job<NewChapterData>);
          break;
        case 'achievement':
          await this.processAchievementEmail(job as Job<AchievementData>);
          break;
        case 'tip-received':
          await this.processTipReceivedEmail(job as Job<TipReceivedData>);
          break;
        case 'crowdfunding-goal-reached':
          await this.processCrowdfundingGoalEmail(job as Job<CrowdfundingGoalData>);
          break;
        case 'comment-reply':
          await this.processCommentReplyEmail(job as Job<CommentReplyData>);
          break;
        case 'custom':
          await this.processCustomEmail(job);
          break;
        case 'marketing':
          await this.processMarketingEmail(job);
          break;
        default:
          throw new Error(`Unknown job type: ${(data as EmailJobData).type}`);
      }
    } catch (error) {
      console.error(`[EmailWorker] Error processing job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Log mock email for development
   */
  private logMockEmail(data: EmailJobData): void {
    if (!process.env.DEBUG_EMAIL) return;

    const { type, to, userId, username } = data;
    console.log('[EmailWorker] MOCK EMAIL:', {
      type,
      to,
      userId,
      username,
      timestamp: new Date().toISOString(),
    });
  }

  private async processWelcomeEmail(job: Job<WelcomeEmailData>): Promise<void> {
    const { to, userId, username, displayName } = job.data;
    await emailService.sendWelcomeEmail({
      id: userId,
      email: to,
      username,
      displayName,
    });
  }

  private async processPasswordResetEmail(job: Job<PasswordResetData>): Promise<void> {
    const { to, userId, username, resetToken } = job.data;
    await emailService.sendPasswordResetEmail(
      { id: userId, email: to, username },
      resetToken
    );
  }

  private async processNewChapterEmail(job: Job<NewChapterData>): Promise<void> {
    const { to, userId, username, mangaTitle, chapterTitle, mangaCoverUrl } = job.data;
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const mangaSlug = job.data.mangaSlug;
    const chapterNumber = job.data.chapterNumber;
    const chapterLink = `${baseUrl}/manga/${mangaSlug}/chapter/${chapterNumber}`;

    await emailService.sendNewChapterNotification(
      { id: userId, email: to, username },
      { id: job.data.mangaId, title: mangaTitle, slug: mangaSlug, coverUrl: mangaCoverUrl, authorName: '' },
      { id: job.data.chapterId, chapterNumber, title: chapterTitle }
    );
  }

  private async processAchievementEmail(job: Job<AchievementData>): Promise<void> {
    const { to, userId, username, achievementName, xpReward, achievementIconUrl } = job.data;
    const achievement = {
      id: job.data.achievementId,
      name: achievementName,
      description: job.data.achievementDescription,
      xpReward,
      iconUrl: achievementIconUrl || null,
condition: '',
category: 'general',
      difficulty: 'EASY',
      createdAt: new Date(),
      badgeId: `badge-${achievementName}`,
    };

    await emailService.sendAchievementUnlockedEmail(
      { id: userId, email: to, username },
      achievement
    );
  }

  private async processTipReceivedEmail(job: Job<TipReceivedData>): Promise<void> {
    const { to, userId, username, fromUsername, amount, message } = job.data;
    const tip = {
      id: job.data.tipId,
      amount,
      message: message || null,
      createdAt: new Date(),
    };

    await emailService.sendTipReceivedEmail(
      { id: userId, email: to, username },
      tip,
      { id: job.data.fromUserId, email: '', username: fromUsername }
    );
  }

  private async processCrowdfundingGoalEmail(job: Job<CrowdfundingGoalData>): Promise<void> {
    const { to, userId, username, mangaTitle, mangaSlug, chapterTitle } = job.data;
    const chapterNumber = job.data.chapterNumber;

    await emailService.sendCrowdfundingGoalReachedEmail(
      { id: userId, email: to, username },
      { id: job.data.mangaId, title: mangaTitle, slug: mangaSlug, authorName: '' },
      { id: job.data.chapterId, chapterNumber, title: chapterTitle }
    );
  }

  private async processCustomEmail(job: Job<EmailJobData>): Promise<void> {
    const { to, userId, username } = job.data;
    const subject = job.data.subject as string | undefined;
    const htmlContent = job.data.htmlContent as string | undefined;
    const textContent = job.data.textContent as string | undefined;

    if (!subject || !htmlContent) {
      throw new Error('Custom email missing required fields: subject, htmlContent');
    }

    await emailService.sendEmail(to, {
      subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
    });

    console.info(`[EmailWorker] Custom email sent to ${to} (user: ${username})`);
  }

  private async processMarketingEmail(job: Job<EmailJobData>): Promise<void> {
    const { to, userId, username } = job.data;
    const subject = job.data.subject as string | undefined;
    const htmlContent = job.data.htmlContent as string | undefined;

    if (!subject || !htmlContent) {
      throw new Error('Marketing email missing required fields: subject, htmlContent');
    }

    await emailService.sendEmail(to, {
      subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, ''),
    });

    console.info(`[EmailWorker] Marketing email sent to ${to} (user: ${username})`);
  }

  private async processCommentReplyEmail(job: Job<CommentReplyData>): Promise<void> {
    const { to, userId, username, commentId, replyContent, replierUsername, chapterId, chapterNumber, mangaTitle } = job.data;
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const chapterLink = `${baseUrl}/chapter/${chapterId}#comment-${commentId}`;

    const { html, text } = baseEmailTemplate({
      title: `${replierUsername} respondió a tu comentario`,
      preview: `${replierUsername} respondió a tu comentario en ${mangaTitle}`,
      content: `
        <p><strong>${replierUsername}</strong> respondió a tu comentario en <strong>"${mangaTitle}"</strong> (Capítulo ${chapterNumber}).</p>
        <div style="margin: 15px 0; padding: 15px; background: #f1f5f9; border-radius: 8px; border-left: 4px solid #6366f1; color: #475569; font-style: italic;">
          "${replyContent}"
        </div>
        <p>Haz clic en el botón para ver la respuesta completa.</p>
      `,
      ctaText: 'Ver respuesta',
      ctaUrl: chapterLink,
    });

    await emailService.sendEmail(to, {
      html,
      text,
      subject: `${replierUsername} respondió a tu comentario en ${mangaTitle}`,
    });

    console.info(`[EmailWorker] Comment reply email sent to ${to} from ${replierUsername}`);
  }

  /**
   * Cierra el worker
   */
  async close(): Promise<void> {
    await this.worker?.close();
  }
}

let globalWorker: EmailWorker | null = null;

export function getEmailWorker(): EmailWorker {
  if (!globalWorker) {
    globalWorker = new EmailWorker();
  }
  return globalWorker;
}

export function stopEmailWorker(): void {
  globalWorker?.close();
  globalWorker = null;
}

export default EmailWorker;
