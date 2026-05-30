/**
 * Unit tests for InboundEmailWorker
 *
 * Tests the processing of inbound email jobs (classify, process)
 * with BullMQ and ResendInboundRepository mocked.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────
// Use function constructors (not vi.fn() or arrow functions inside vi.mock)
// to avoid "is not a constructor" errors at module load time.

vi.mock('bullmq', () => {
  const mockOn = vi.fn().mockReturnThis();
  const mockClose = vi.fn().mockResolvedValue(undefined);
  return {
    Worker: function MockWorker() {
      this.on = mockOn;
      this.close = mockClose;
    },
    Job: vi.fn(),
  };
});

vi.mock('@/infrastructure/queue/connection', () => ({
  getBullConnection: () => ({ status: 'ready' }),
  closeBullConnection: vi.fn(),
}));

// Shared mocks for the inbound repo — defined as plain objects so
// per-test .mockResolvedValue() calls work via the runtime mock instances.
const mockClassifyEmail = vi.fn();
const mockProcessEmail = vi.fn();

vi.mock('@/infrastructure/adapters/ResendInboundRepository', () => ({
  ResendInboundRepository: function MockResendInboundRepository() {
    this.classifyEmail = mockClassifyEmail;
    this.processEmail = mockProcessEmail;
    this.fetchEmailContent = vi.fn();
    this.parseWebhookPayload = vi.fn();
  },
}));

// ─── Fixtures ───────────────────────────────────────────────────────

const sampleEmail = {
  messageId: 'msg-1',
  fromEmail: 'user@test.com',
  fromName: 'Test User',
  toEmails: ['support@mangaaura.com'],
  subject: 'Help with my account',
  textBody: 'I need help logging in.',
  htmlBody: null,
  attachments: [],
  receivedAt: new Date('2024-01-01T00:00:00Z'),
  headers: { 'message-id': '<msg-1>' },
};

const sampleClassification = {
  intent: 'support' as const,
  confidence: 0.95,
  requiresHuman: false,
  suggestedResponse: 'Thank you for contacting us.',
  extractedUserId: null,
  extractedMangaSlug: null,
  extractedCommentId: null,
};

function makeJob(data: Record<string, unknown>) {
  return { id: 'inbound-job-id', data };
}

// ─── Create worker helper ───────────────────────────────────────────

async function createWorker(): Promise<{
  processJob(job: unknown): Promise<void>;
  close(): Promise<void>;
}> {
  const { InboundEmailWorker } = await import(
    '@/infrastructure/workers/InboundEmailWorker'
  );
  const worker = new InboundEmailWorker();
  return worker as unknown as {
    processJob(job: unknown): Promise<void>;
    close(): Promise<void>;
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('InboundEmailWorker', () => {
  let worker: {
    processJob(job: unknown): Promise<void>;
    close(): Promise<void>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    worker = await createWorker();
  });

  describe('Procesamiento de jobs', () => {
    it('debe procesar job de clasificación', async () => {
      mockClassifyEmail.mockResolvedValueOnce(sampleClassification);
      mockProcessEmail.mockResolvedValueOnce({
        action: 'processed',
        intent: 'support',
        confidence: 0.95,
        responseSent: false,
        ticketCreated: false,
        loggedId: 'log-1',
      });

      await worker.processJob(makeJob({ type: 'classify', email: sampleEmail }));

      expect(mockClassifyEmail).toHaveBeenCalledWith(sampleEmail);
      expect(mockProcessEmail).toHaveBeenCalledWith(
        sampleEmail,
        expect.objectContaining({ intent: 'support', confidence: 0.95 })
      );
    });

    it('debe procesar job de proceso con clasificación preexistente', async () => {
      mockProcessEmail.mockResolvedValueOnce({
        action: 'processed',
        intent: 'support',
        confidence: 0.95,
        responseSent: false,
        ticketCreated: false,
        loggedId: 'log-2',
      });

      await worker.processJob(
        makeJob({
          type: 'process',
          email: sampleEmail,
          classification: sampleClassification,
        })
      );

      expect(mockClassifyEmail).not.toHaveBeenCalled();
      expect(mockProcessEmail).toHaveBeenCalledWith(
        sampleEmail,
        sampleClassification
      );
    });

    it('debe rechazar tipo de trabajo desconocido', async () => {
      await expect(
        worker.processJob(makeJob({ type: 'unknown', email: sampleEmail }))
      ).rejects.toThrow('Unknown inbound email job type');
    });
  });

  describe('Manejo de correos con diferentes intenciones', () => {
    it('debe clasificar correctamente un correo de reporte', async () => {
      const reportEmail = {
        ...sampleEmail,
        subject: 'Report content',
        textBody: 'This manga contains inappropriate content.',
      };

      mockClassifyEmail.mockResolvedValueOnce({
        intent: 'report',
        confidence: 0.88,
        requiresHuman: true,
        suggestedResponse: null,
        extractedUserId: null,
        extractedMangaSlug: 'offensive-manga',
        extractedCommentId: 'comment-123',
      });
      mockProcessEmail.mockResolvedValueOnce({
        action: 'processed',
        intent: 'report',
        confidence: 0.88,
        responseSent: false,
        ticketCreated: true,
        loggedId: 'log-3',
      });

      await worker.processJob(makeJob({ type: 'classify', email: reportEmail }));

      expect(mockClassifyEmail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Report content' })
      );
      expect(mockProcessEmail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Report content' }),
        expect.objectContaining({ intent: 'report' })
      );
    });

    it('debe clasificar correctamente un correo de unsubscribe', async () => {
      const unsubscribeEmail = {
        ...sampleEmail,
        subject: 'Unsubscribe',
        textBody: 'Please unsubscribe me from all emails.',
      };

      mockClassifyEmail.mockResolvedValueOnce({
        intent: 'unsubscribe',
        confidence: 0.99,
        requiresHuman: false,
        suggestedResponse: 'You have been unsubscribed.',
        extractedUserId: 'user-42',
        extractedMangaSlug: null,
        extractedCommentId: null,
      });
      mockProcessEmail.mockResolvedValueOnce({
        action: 'processed',
        intent: 'unsubscribe',
        confidence: 0.99,
        responseSent: true,
        ticketCreated: false,
        loggedId: 'log-4',
      });

      await worker.processJob(
        makeJob({ type: 'classify', email: unsubscribeEmail })
      );

      expect(mockClassifyEmail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Unsubscribe' })
      );
      expect(mockProcessEmail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Unsubscribe' }),
        expect.objectContaining({ intent: 'unsubscribe' })
      );
    });
  });

  describe('Ciclo de vida', () => {
    it('debe cerrar el worker sin errores', async () => {
      await expect(worker.close()).resolves.toBeUndefined();
    });
  });
});
