/**
 * Unit tests for EmailQueue
 *
 * Tests the in-memory mock mode of EmailQueue to verify
 * enqueue, stats, and cleanup operations work without Redis.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock isMockRedis to return true so InMemoryQueue is enabled
vi.mock('@/lib/redis', () => ({
  redis: {},
  isMockRedis: () => true,
}));

import { EmailQueue } from '@/infrastructure/queue/EmailQueue';
import type {
  WelcomeEmailData,
  PasswordResetData,
  NewChapterData,
  AchievementData,
  TipReceivedData,
  CrowdfundingGoalData,
  VerificationEmailData,
  CommentReplyData,
  LevelUpData,
  MentionData,
  ClanInviteData,
} from '@/infrastructure/queue/EmailQueue';

describe('EmailQueue (in-memory mode)', () => {
  let queue: EmailQueue;

  beforeAll(() => {
    // Force in-memory mode by setting NODE_ENV and simulating mock Redis
    process.env.NODE_ENV = 'development';
    queue = new EmailQueue();
  });

  afterAll(() => {
    queue.close();
  });

  it('returns empty stats on fresh queue', async () => {
    const stats = await queue.getStats();
    expect(stats).toHaveProperty('waiting');
    expect(stats).toHaveProperty('active');
    expect(stats).toHaveProperty('completed');
    expect(stats).toHaveProperty('failed');
    expect(stats).toHaveProperty('delayed');
  });

  it('adds a welcome email job', async () => {
    const data: Omit<WelcomeEmailData, 'type'> = {
      to: 'user@test.com',
      userId: 'user-1',
      username: 'testuser',
      displayName: 'Test User',
    };

    const job = await queue.addWelcomeEmail(data);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('welcome');
    expect(job.data.to).toBe('user@test.com');
  });

  it('adds a password reset email job', async () => {
    const data: PasswordResetData['type'] extends 'password-reset' ? Omit<PasswordResetData, 'type'> : never = {
      to: 'user@test.com',
      userId: 'user-2',
      username: 'testuser2',
      resetToken: 'reset-token-123',
      resetLink: 'https://example.com/reset?token=123',
    };

    const job = await queue.addPasswordResetEmail(data);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('password-reset');
  });

  it('adds a verification email job', async () => {
    const data: Omit<VerificationEmailData, 'type'> = {
      to: 'user@test.com',
      userId: 'user-3',
      username: 'testuser3',
      verificationUrl: 'https://example.com/verify?token=abc',
    };

    const job = await queue.addVerificationEmail(data);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('verification');
  });

  it('adds a new chapter email job', async () => {
    const data: Omit<NewChapterData, 'type'> = {
      to: 'user@test.com',
      userId: 'user-4',
      username: 'testuser4',
      mangaId: 'manga-1',
      mangaTitle: 'Test Manga',
      mangaSlug: 'test-manga',
      chapterId: 'chapter-1',
      chapterNumber: 5,
      chapterTitle: 'The Big Reveal',
      mangaCoverUrl: 'https://example.com/cover.jpg',
    };

    const job = await queue.addNewChapterEmail(data);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('new-chapter');
    expect((job.data as NewChapterData).mangaTitle).toBe('Test Manga');
  });

  it('adds an achievement email job', async () => {
    const data: Omit<AchievementData, 'type'> = {
      to: 'user@test.com',
      userId: 'user-5',
      username: 'testuser5',
      achievementId: 'ach-1',
      achievementName: 'First Chapter',
      achievementDescription: 'Read your first chapter!',
      xpReward: 100,
    };

    const job = await queue.addAchievementEmail(data);
    expect(job).toBeDefined();
    expect(job.data.type).toBe('achievement');
    expect((job.data as AchievementData).xpReward).toBe(100);
  });

  it('adds a tip received email job', async () => {
    const data: Omit<TipReceivedData, 'type'> = {
      to: 'creator@test.com',
      userId: 'user-6',
      username: 'creator',
      tipId: 'tip-1',
      amount: 500,
      fromUserId: 'fan-1',
      fromUsername: 'bigfan',
      message: 'Love your work!',
    };

    const job = await queue.addTipReceivedEmail(data);
    expect(job).toBeDefined();
    expect(job.data.type).toBe('tip-received');
    expect((job.data as TipReceivedData).amount).toBe(500);
  });

  it('adds a crowdfunding goal email job', async () => {
    const data: Omit<CrowdfundingGoalData, 'type'> = {
      to: 'creator@test.com',
      userId: 'user-7',
      username: 'creator',
      mangaId: 'manga-1',
      mangaTitle: 'Test Manga',
      mangaSlug: 'test-manga',
      chapterId: 'chapter-1',
      chapterNumber: 5,
    };

    const job = await queue.addCrowdfundingGoalEmail(data);
    expect(job).toBeDefined();
    expect(job.data.type).toBe('crowdfunding-goal-reached');
  });

  it('adds a comment reply email job', async () => {
    const data: Omit<CommentReplyData, 'type'> = {
      to: 'user@test.com',
      userId: 'user-8',
      username: 'testuser8',
      commentId: 'comment-1',
      replyContent: 'Great point!',
      replierUsername: 'replier',
      chapterId: 'chapter-1',
      chapterNumber: 5,
      mangaTitle: 'Test Manga',
    };

    const job = await queue.addCommentReplyEmail(data);
    expect(job).toBeDefined();
    expect(job.data.type).toBe('comment-reply');
    expect((job.data as CommentReplyData).replierUsername).toBe('replier');
  });

  it('returns stats after adding jobs', async () => {
    const stats = await queue.getStats();
    expect(typeof stats.waiting).toBe('number');
    expect(typeof stats.active).toBe('number');
  });

  it('clean does not throw in in-memory mode', async () => {
    await expect(queue.cleanOldJobs(1)).resolves.toBeUndefined();
  });

  it('returns correct queue name', () => {
    expect(queue.name).toBe('emails');
  });

  it('pause and resume do not throw in in-memory mode', async () => {
    await expect(queue.pause()).resolves.toBeUndefined();
    await expect(queue.resume()).resolves.toBeUndefined();
  });

  it('retryFailed returns 0 in in-memory mode', async () => {
    const retried = await queue.retryFailed();
    expect(retried).toBe(0);
  });

  // ─── New email types ────────────────────────────────────────

  it('adds a level-up email job', async () => {
    const data: Omit<LevelUpData, 'type'> = {
      to: 'user@test.com',
      userId: 'user-10',
      username: 'leveler',
      oldLevel: 4,
      newLevel: 5,
    };

    const job = await queue.addLevelUpEmail(data);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('level-up');
    expect((job.data as LevelUpData).oldLevel).toBe(4);
    expect((job.data as LevelUpData).newLevel).toBe(5);
  });

  it('adds a mention email job', async () => {
    const data: Omit<MentionData, 'type'> = {
      to: 'user@test.com',
      userId: 'user-11',
      username: 'mentioned',
      mentionerUsername: 'someone',
      commentContent: 'Great comment!',
      chapterId: 'chapter-1',
      commentId: 'comment-1',
      mangaTitle: 'Test Manga',
    };

    const job = await queue.addMentionEmail(data);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('mention');
    expect((job.data as MentionData).mentionerUsername).toBe('someone');
    expect((job.data as MentionData).commentId).toBe('comment-1');
  });

  it('adds a clan invite email job', async () => {
    const data: Omit<ClanInviteData, 'type'> = {
      to: 'user@test.com',
      userId: 'user-12',
      username: 'invited',
      clanId: 'clan-1',
      clanName: 'Samurai Warriors',
      clanSlug: 'samurai-warriors',
      inviterUsername: 'inviter',
    };

    const job = await queue.addClanInviteEmail(data);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('clan-invite');
    expect((job.data as ClanInviteData).clanName).toBe('Samurai Warriors');
    expect((job.data as ClanInviteData).clanSlug).toBe('samurai-warriors');
  });

  it('returns jobs list for each state', async () => {
    const waiting = await queue.getJobs('waiting');
    expect(Array.isArray(waiting)).toBe(true);
    const active = await queue.getJobs('active');
    expect(Array.isArray(active)).toBe(true);
    const completed = await queue.getJobs('completed');
    expect(Array.isArray(completed)).toBe(true);
    const failed = await queue.getJobs('failed');
    expect(Array.isArray(failed)).toBe(true);
    const delayed = await queue.getJobs('delayed');
    expect(Array.isArray(delayed)).toBe(true);
  });
});
