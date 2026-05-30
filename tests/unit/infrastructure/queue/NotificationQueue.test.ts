/**
 * Unit tests for NotificationQueue
 *
 * Tests the in-memory mock mode of NotificationQueue to verify
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

import { NotificationQueue } from '@/infrastructure/queue/NotificationQueue';
import type {
  InAppNotificationData,
  PushNotificationData,
  CombinedNotificationData,
  BulkPushNotificationData,
} from '@/infrastructure/queue/NotificationQueue';

describe('NotificationQueue (in-memory mode)', () => {
  let queue: NotificationQueue;

  beforeAll(() => {
    // Force in-memory mode by setting NODE_ENV and simulating mock Redis
    process.env.NODE_ENV = 'development';
    // The queue checks isMockRedis() which returns true when no REDIS_URL
    queue = new NotificationQueue();
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

  it('adds an in-app notification job', async () => {
    const data: Omit<InAppNotificationData, 'type'> = {
      userId: 'user-1',
      notificationType: 'ACHIEVEMENT_UNLOCKED',
      title: 'Test Achievement',
      message: 'You unlocked a test achievement!',
      data: { achievementId: 'ach-1' },
      linkUrl: '/achievements',
    };

    const job = await queue.addInAppNotification(data);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('in-app');
  });

  it('adds a push notification job', async () => {
    const data: Omit<PushNotificationData, 'type'> = {
      userId: 'user-2',
      payload: {
        title: 'Test Push',
        body: 'This is a test push notification',
        url: '/test',
        tag: 'test-push',
      },
    };

    const job = await queue.addPushNotification(data);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('push');
  });

  it('adds a combined notification job', async () => {
    const data: Omit<CombinedNotificationData, 'type'> = {
      userId: 'user-3',
      notificationType: 'NEW_CHAPTER',
      title: 'New Chapter',
      message: 'Chapter 5 is now available!',
      data: { mangaId: 'manga-1', chapterNumber: 5 },
      linkUrl: '/manga/slug/chapter/5',
      pushPayload: {
        title: 'New Chapter',
        body: 'Chapter 5 is now available!',
        url: '/manga/slug/chapter/5',
        tag: 'new-chapter',
      },
    };

    const job = await queue.addCombinedNotification(data);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('in-app-with-push');
  });

  it('adds a bulk push notification job', async () => {
    const data: Omit<BulkPushNotificationData, 'type'> = {
      userIds: ['user-1', 'user-2', 'user-3'],
      payload: {
        title: 'Bulk Test',
        body: 'This is a bulk push notification',
        url: '/test',
        tag: 'bulk-test',
      },
    };

    const job = await queue.addBulkPushNotification(data);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('bulk-push');
    expect((job.data as BulkPushNotificationData).userIds.length).toBe(3);
  });

  it('returns stats after adding jobs', async () => {
    const stats = await queue.getStats();
    expect(typeof stats.waiting).toBe('number');
    expect(typeof stats.active).toBe('number');
  });

  it('clean does not throw in in-memory mode', async () => {
    await expect(queue.clean(1)).resolves.toBeUndefined();
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

  it('returns correct queue name', () => {
    expect(queue.name).toBe('notifications');
  });

  it('pause and resume do not throw in in-memory mode', async () => {
    await expect(queue.pause()).resolves.toBeUndefined();
    await expect(queue.resume()).resolves.toBeUndefined();
  });

  it('retryFailed returns 0 in in-memory mode', async () => {
    const retried = await queue.retryFailed();
    expect(retried).toBe(0);
  });
});
