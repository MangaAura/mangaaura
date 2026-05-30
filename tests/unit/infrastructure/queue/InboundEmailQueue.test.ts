/**
 * Unit tests for InboundEmailQueue
 *
 * Tests the in-memory mock mode of InboundEmailQueue to verify
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

import { InboundEmailQueue } from '@/infrastructure/queue/InboundEmailQueue';
import type { InboundEmailData, EmailClassification } from '@/core/services/IInboundEmailRepository';

const sampleEmail: InboundEmailData = {
  messageId: 'msg-1',
  fromEmail: 'test@test.com',
  fromName: 'Test User',
  toEmails: ['support@mangaaura.com'],
  subject: 'Test Subject',
  textBody: 'Hello, this is a test email body.',
  htmlBody: null,
  attachments: [],
  receivedAt: new Date('2024-01-01T00:00:00Z'),
  headers: { 'message-id': '<msg-1>' },
};

const sampleClassification: EmailClassification = {
  intent: 'support',
  confidence: 0.95,
  requiresHuman: false,
  suggestedResponse: 'Thank you for contacting us.',
  extractedUserId: null,
  extractedMangaSlug: null,
  extractedCommentId: null,
};

describe('InboundEmailQueue (in-memory mode)', () => {
  let queue: InboundEmailQueue;

  beforeAll(() => {
    process.env.NODE_ENV = 'development';
    queue = new InboundEmailQueue();
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

  it('adds a classify job', async () => {
    const job = await queue.addClassifyJob(sampleEmail);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('classify');
    expect(job.data.email.fromEmail).toBe('test@test.com');
  });

  it('adds a process job with classification', async () => {
    const job = await queue.addProcessJob(sampleEmail, sampleClassification);
    expect(job).toBeDefined();
    expect(job.id).toBeTruthy();
    expect(job.data.type).toBe('process');
    expect(job.data.classification).toBeDefined();
    expect(job.data.classification!.intent).toBe('support');
  });

  it('returns stats after adding jobs', async () => {
    const stats = await queue.getStats();
    expect(typeof stats.waiting).toBe('number');
    expect(typeof stats.active).toBe('number');
  });

  it('clean does not throw in in-memory mode', async () => {
    await expect(queue.clean(1)).resolves.toBeUndefined();
  });

  it('pause and resume do not throw in in-memory mode', async () => {
    await expect(queue.pause()).resolves.toBeUndefined();
    await expect(queue.resume()).resolves.toBeUndefined();
  });

  it('returns correct queue name', () => {
    expect(queue.name).toBe('inbound-emails');
  });
});
