import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/redis', () => ({
  redis: {},
  isMockRedis: () => true,
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn(),
  Job: vi.fn(),
}));

vi.mock('ioredis', () => ({
  Redis: vi.fn(),
}));

const { EmailQueue, resetEmailQueue, getEmailQueue } = await import(
  '@/infrastructure/queue/EmailQueue'
);

describe('EmailQueue', () => {
  beforeEach(() => {
    resetEmailQueue();
  });

  describe('queue accepts jobs', () => {
    it('should add a welcome email job', async () => {
      const queue = new EmailQueue();
      const job = await queue.addWelcomeEmail({
        to: 'test@example.com',
        userId: 'user-1',
        username: 'testuser',
        displayName: 'Test',
      });

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.name).toBe('welcome');
    });

    it('should add a password reset email job', async () => {
      const queue = new EmailQueue();
      const job = await queue.addPasswordResetEmail({
        to: 'user@example.com',
        userId: 'user-2',
        username: 'resetuser',
        resetToken: 'token-123',
        resetLink: 'https://inkverse.app/reset/token-123',
      });

      expect(job).toBeDefined();
      expect(job.name).toBe('password-reset');
    });

    it('should add a new chapter notification job', async () => {
      const queue = new EmailQueue();
      const job = await queue.addNewChapterEmail({
        to: 'fan@example.com',
        userId: 'user-3',
        username: 'fanuser',
        mangaId: 'manga-1',
        mangaTitle: 'Test Manga',
        mangaSlug: 'test-manga',
        chapterId: 'ch-1',
        chapterNumber: 5,
      });

      expect(job).toBeDefined();
      expect(job.name).toBe('new-chapter');
    });

    it('should add an achievement email job', async () => {
      const queue = new EmailQueue();
      const job = await queue.addAchievementEmail({
        to: 'player@example.com',
        userId: 'user-4',
        username: 'player1',
        achievementId: 'ach-1',
        achievementName: 'First Chapter',
        achievementDescription: 'Read your first chapter',
        xpReward: 10,
      });

      expect(job).toBeDefined();
      expect(job.name).toBe('achievement');
    });

    it('should add a tip received email job', async () => {
      const queue = new EmailQueue();
      const job = await queue.addTipReceivedEmail({
        to: 'creator@example.com',
        userId: 'user-5',
        username: 'creator1',
        tipId: 'tip-1',
        amount: 100,
        fromUserId: 'user-6',
        fromUsername: 'fan1',
      });

      expect(job).toBeDefined();
      expect(job.name).toBe('tip-received');
    });

    it('should add a crowdfunding goal email job', async () => {
      const queue = new EmailQueue();
      const job = await queue.addCrowdfundingGoalEmail({
        to: 'author@example.com',
        userId: 'user-7',
        username: 'author1',
        mangaId: 'manga-2',
        mangaTitle: 'Popular Manga',
        mangaSlug: 'popular-manga',
        chapterId: 'ch-10',
        chapterNumber: 10,
      });

      expect(job).toBeDefined();
      expect(job.name).toBe('crowdfunding-goal-reached');
    });

    it('should add a comment reply email job', async () => {
      const queue = new EmailQueue();
      const job = await queue.addCommentReplyEmail({
        to: 'commenter@example.com',
        userId: 'user-8',
        username: 'commenter',
        commentId: 'comment-1',
        replyContent: 'Great point!',
        replierUsername: 'replier',
        chapterId: 'ch-1',
        chapterNumber: 1,
        mangaTitle: 'Test Manga',
      });

      expect(job).toBeDefined();
      expect(job.name).toBe('comment-reply');
    });
  });

  describe('queue stats work', () => {
    it('should return stats with the correct shape', async () => {
      const queue = new EmailQueue();
      const stats = await queue.getStats();

      expect(stats).toHaveProperty('waiting');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('delayed');
      expect(typeof stats.waiting).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.delayed).toBe('number');
    });

    it('should reflect added jobs in waiting count', async () => {
      const queue = new EmailQueue();
      await queue.addWelcomeEmail({
        to: 'a@b.com',
        userId: 'u1',
        username: 'u1',
      });

      const stats = await queue.getStats();
      expect(stats.waiting).toBeGreaterThanOrEqual(1);
    });
  });

  describe('mock mode fallback works', () => {
    it('should create queue without throwing', () => {
      expect(() => new EmailQueue()).not.toThrow();
    });

    it('should return queue name', () => {
      const queue = new EmailQueue();
      expect(queue.name).toBe('emails');
    });

    it('should handle close gracefully', async () => {
      const queue = new EmailQueue();
      await expect(queue.close()).resolves.toBeUndefined();
    });

    it('should handle pause and resume gracefully', async () => {
      const queue = new EmailQueue();
      await expect(queue.pause()).resolves.toBeUndefined();
      await expect(queue.resume()).resolves.toBeUndefined();
    });

    it('should handle clean old jobs gracefully', async () => {
      const queue = new EmailQueue();
      await expect(queue.cleanOldJobs(24)).resolves.toBeUndefined();
    });

    it('should get singleton instance', () => {
      const queue1 = getEmailQueue();
      const queue2 = getEmailQueue();
      expect(queue1).toBe(queue2);
    });

    it('should reset singleton', () => {
      const queue1 = getEmailQueue();
      resetEmailQueue();
      const queue2 = getEmailQueue();
      expect(queue1).not.toBe(queue2);
    });
  });
});
