import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/redis', () => ({
  redis: {},
  isMockRedis: vi.fn(() => false),
}));

vi.mock('bullmq', () => ({
  Worker: class {
    on = vi.fn();
    close = vi.fn().mockResolvedValue(undefined);
  },
  Job: vi.fn(),
}));

const emailServiceMock = {
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendNewChapterNotification: vi.fn().mockResolvedValue(undefined),
  sendAchievementUnlockedEmail: vi.fn().mockResolvedValue(undefined),
  sendTipReceivedEmail: vi.fn().mockResolvedValue(undefined),
  sendCrowdfundingGoalReachedEmail: vi.fn().mockResolvedValue(undefined),
  sendEmail: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/infrastructure/adapters/emailService', () => ({
  emailService: emailServiceMock,
}));

vi.mock('@/core/services/EmailService', () => ({
  EmailService: vi.fn(),
  emailService: emailServiceMock,
}));

vi.mock('@/lib/email-templates', () => ({
  baseEmailTemplate: vi.fn().mockReturnValue({
    html: '<p>respuesta template</p>',
    text: 'respuesta template',
  }),
}));

async function createWorker() {
  const { EmailWorker } = await import('@/infrastructure/workers/EmailWorker');
  const worker = new EmailWorker();
  return worker as unknown as { processJob(job: unknown): Promise<void>; close(): Promise<void> };
}

const makeJob = (data: Record<string, unknown>) => ({
  id: 'test-job-id',
  data,
});

describe('EmailWorker', () => {
  let worker: { processJob(job: unknown): Promise<void>; close(): Promise<void> };

  beforeEach(async () => {
    vi.clearAllMocks();
    const redisModule = await import('@/lib/redis');
    (redisModule.isMockRedis as any).mockReturnValue(false);
    worker = await createWorker();
  });

  describe('Procesamiento de emails', () => {
    it('debe procesar email de bienvenida', async () => {
      const job = makeJob({
        type: 'welcome',
        to: 'user@test.com',
        userId: 'user-1',
        username: 'testuser',
        displayName: 'Test User',
      });

      await worker.processJob(job);

      expect(emailServiceMock.sendWelcomeEmail).toHaveBeenCalledWith({
        id: 'user-1',
        email: 'user@test.com',
        username: 'testuser',
        displayName: 'Test User',
      });
    });

    it('debe procesar email de restablecimiento de contraseña', async () => {
      const job = makeJob({
        type: 'password-reset',
        to: 'user@test.com',
        userId: 'user-1',
        username: 'testuser',
        resetToken: 'token-123',
        resetLink: 'https://inkverse.app/reset/token-123',
      });

      await worker.processJob(job);

      expect(emailServiceMock.sendPasswordResetEmail).toHaveBeenCalledWith(
        { id: 'user-1', email: 'user@test.com', username: 'testuser' },
        'token-123'
      );
    });

    it('debe procesar email de nuevo capítulo', async () => {
      const job = makeJob({
        type: 'new-chapter',
        to: 'fan@test.com',
        userId: 'user-2',
        username: 'fanuser',
        mangaId: 'manga-1',
        mangaTitle: 'Test Manga',
        mangaSlug: 'test-manga',
        chapterId: 'ch-1',
        chapterNumber: 5,
      });

      await worker.processJob(job);

      expect(emailServiceMock.sendNewChapterNotification).toHaveBeenCalled();
    });

    it('debe procesar email de logro', async () => {
      const job = makeJob({
        type: 'achievement',
        to: 'player@test.com',
        userId: 'user-3',
        username: 'player1',
        achievementId: 'ach-1',
        achievementName: 'First Chapter',
        achievementDescription: 'Read first chapter',
        xpReward: 10,
      });

      await worker.processJob(job);

      expect(emailServiceMock.sendAchievementUnlockedEmail).toHaveBeenCalled();
    });

    it('debe procesar email de propina recibida', async () => {
      const job = makeJob({
        type: 'tip-received',
        to: 'creator@test.com',
        userId: 'user-4',
        username: 'creator1',
        tipId: 'tip-1',
        amount: 100,
        fromUserId: 'user-5',
        fromUsername: 'fan1',
      });

      await worker.processJob(job);

      expect(emailServiceMock.sendTipReceivedEmail).toHaveBeenCalled();
    });

    it('debe procesar email de meta de crowdfunding', async () => {
      const job = makeJob({
        type: 'crowdfunding-goal-reached',
        to: 'author@test.com',
        userId: 'user-6',
        username: 'author1',
        mangaId: 'manga-2',
        mangaTitle: 'Popular Manga',
        mangaSlug: 'popular-manga',
        chapterId: 'ch-10',
        chapterNumber: 10,
      });

      await worker.processJob(job);

      expect(emailServiceMock.sendCrowdfundingGoalReachedEmail).toHaveBeenCalled();
    });

    it('debe procesar email de respuesta a comentario', async () => {
      const job = makeJob({
        type: 'comment-reply',
        to: 'commenter@test.com',
        userId: 'user-7',
        username: 'commenter',
        commentId: 'comment-1',
        replyContent: 'Great point!',
        replierUsername: 'replier',
        chapterId: 'ch-1',
        chapterNumber: 1,
        mangaTitle: 'Test Manga',
      });

      await worker.processJob(job);

      expect(emailServiceMock.sendEmail).toHaveBeenCalled();
    });

    it('debe procesar email personalizado', async () => {
      const job = makeJob({
        type: 'custom',
        to: 'user@test.com',
        userId: 'user-8',
        username: 'testuser',
        subject: 'Asunto personalizado',
        htmlContent: '<h1>Hola</h1>',
      });

      await worker.processJob(job);

      expect(emailServiceMock.sendEmail).toHaveBeenCalledWith(
        'user@test.com',
        expect.objectContaining({
          subject: 'Asunto personalizado',
          html: '<h1>Hola</h1>',
        })
      );
    });

    it('debe rechazar email personalizado sin subject', async () => {
      const job = makeJob({
        type: 'custom',
        to: 'user@test.com',
        userId: 'user-8',
        username: 'testuser',
        htmlContent: '<h1>Hola</h1>',
      });

      await expect(worker.processJob(job)).rejects.toThrow(
        'Custom email missing required fields'
      );
    });

    it('debe rechazar tipo de trabajo desconocido', async () => {
      const job = makeJob({
        type: 'unknown',
        to: 'user@test.com',
        userId: 'user-9',
        username: 'testuser',
      });

      await expect(worker.processJob(job)).rejects.toThrow(
        'Unknown job type'
      );
    });
  });

  describe('Modo mock', () => {
    it('debe funcionar en modo mock cuando Redis no está disponible', async () => {
      const redisModule = await import('@/lib/redis');
      (redisModule.isMockRedis as any).mockReturnValue(true);

      const { EmailWorker } = await import('@/infrastructure/workers/EmailWorker');
      const mockWorker = new EmailWorker() as unknown as { processJob(job: unknown): Promise<void>; close(): Promise<void> };

      const job = makeJob({
        type: 'welcome',
        to: 'test@test.com',
        userId: 'u1',
        username: 'test',
      });

      await mockWorker.processJob(job);

      expect(emailServiceMock.sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });

  describe('Ciclo de vida', () => {
    it('debe cerrar el worker sin errores', async () => {
      await expect(worker.close()).resolves.toBeUndefined();
    });
  });
});
