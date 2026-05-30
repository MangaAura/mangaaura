/**
 * Unit tests for NotificationWorker
 *
 * Tests the processing of notification jobs (in-app, push, combined, bulk-push)
 * with BullMQ mocked.
 *
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('bullmq', () => ({
  Worker: class {
    on = vi.fn();
    close = vi.fn().mockResolvedValue(undefined);
  },
  Job: vi.fn(),
}));

const createNotificationMock = vi.fn().mockResolvedValue({ id: 'notif-1' });

vi.mock('@/core/services/NotificationService', () => ({
  getNotificationService: vi.fn().mockResolvedValue({
    createNotification: createNotificationMock,
  }),
  NotificationService: vi.fn(),
}));

const sendPushNotificationMock = vi.fn().mockResolvedValue({ success: true });
const sendBulkPushNotificationsMock = vi.fn().mockResolvedValue({ sent: 3, failed: 0 });

vi.mock('@/lib/push-notifications', () => ({
  sendPushNotification: (...args: unknown[]) => sendPushNotificationMock(...args),
  sendBulkPushNotifications: (...args: unknown[]) => sendBulkPushNotificationsMock(...args),
}));

async function createWorker() {
  const { NotificationWorker } = await import('@/infrastructure/workers/NotificationWorker');
  const worker = new NotificationWorker();
  return worker as unknown as { processJob(job: unknown): Promise<void>; close(): Promise<void> };
}

const makeJob = (data: Record<string, unknown>) => ({
  id: 'notif-job-id',
  data,
});

describe('NotificationWorker', () => {
  let worker: { processJob(job: unknown): Promise<void>; close(): Promise<void> };

  beforeEach(async () => {
    vi.clearAllMocks();
    worker = await createWorker();
  });

  describe('Procesamiento de jobs', () => {
    it('debe procesar notificación in-app', async () => {
      const job = makeJob({
        type: 'in-app',
        userId: 'user-1',
        notificationType: 'ACHIEVEMENT_UNLOCKED',
        title: 'Logro desbloqueado',
        message: 'Has desbloqueado el logro Primer Capítulo',
        data: { achievementId: 'ach-1' },
        linkUrl: '/achievements',
      });

      await worker.processJob(job);

      expect(createNotificationMock).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'ACHIEVEMENT_UNLOCKED',
        title: 'Logro desbloqueado',
        message: 'Has desbloqueado el logro Primer Capítulo',
        data: { achievementId: 'ach-1' },
        imageUrl: undefined,
        linkUrl: '/achievements',
      });
    });

    it('debe procesar push notification', async () => {
      const job = makeJob({
        type: 'push',
        userId: 'user-2',
        payload: {
          title: 'Nuevo capítulo',
          body: 'Capítulo 5 de Test Manga disponible',
          url: '/manga/test-manga/chapter/5',
          tag: 'new-chapter',
        },
      });

      await worker.processJob(job);

      expect(sendPushNotificationMock).toHaveBeenCalledWith('user-2', {
        title: 'Nuevo capítulo',
        body: 'Capítulo 5 de Test Manga disponible',
        url: '/manga/test-manga/chapter/5',
        tag: 'new-chapter',
      });
    });

    it('debe procesar notificación combinada (in-app + push)', async () => {
      const job = makeJob({
        type: 'in-app-with-push',
        userId: 'user-3',
        notificationType: 'NEW_CHAPTER',
        title: 'Nuevo capítulo',
        message: 'Capítulo 5 disponible',
        data: { mangaId: 'manga-1', chapterNumber: 5 },
        linkUrl: '/manga/test-manga/chapter/5',
        pushPayload: {
          title: 'Nuevo capítulo',
          body: 'Capítulo 5 disponible',
          url: '/manga/test-manga/chapter/5',
          tag: 'new-chapter',
        },
      });

      await worker.processJob(job);

      expect(createNotificationMock).toHaveBeenCalledWith({
        userId: 'user-3',
        type: 'NEW_CHAPTER',
        title: 'Nuevo capítulo',
        message: 'Capítulo 5 disponible',
        data: { mangaId: 'manga-1', chapterNumber: 5 },
        imageUrl: undefined,
        linkUrl: '/manga/test-manga/chapter/5',
      });
      expect(sendPushNotificationMock).toHaveBeenCalledWith('user-3', {
        title: 'Nuevo capítulo',
        body: 'Capítulo 5 disponible',
        url: '/manga/test-manga/chapter/5',
        tag: 'new-chapter',
      });
    });

    it('debe procesar push notification masiva', async () => {
      const job = makeJob({
        type: 'bulk-push',
        userIds: ['user-1', 'user-2', 'user-3'],
        payload: {
          title: 'Anuncio importante',
          body: 'Tenemos un nuevo manga disponible',
          url: '/discover',
          tag: 'announcement',
        },
      });

      await worker.processJob(job);

      expect(sendBulkPushNotificationsMock).toHaveBeenCalledWith(
        ['user-1', 'user-2', 'user-3'],
        {
          title: 'Anuncio importante',
          body: 'Tenemos un nuevo manga disponible',
          url: '/discover',
          tag: 'announcement',
        }
      );
    });

    it('debe rechazar tipo de trabajo desconocido', async () => {
      const job = makeJob({
        type: 'unknown',
        userId: 'user-1',
      });

      await expect(worker.processJob(job)).rejects.toThrow(
        'Unknown notification job type'
      );
    });
  });

  describe('Manejo de errores en push', () => {
    it('debe manejar push notification fallida sin lanzar error', async () => {
      sendPushNotificationMock.mockResolvedValueOnce({
        success: false,
        error: 'No push subscriptions found',
      });

      const job = makeJob({
        type: 'push',
        userId: 'user-4',
        payload: {
          title: 'Test',
          body: 'Test body',
        },
      });

      await expect(worker.processJob(job)).resolves.toBeUndefined();
    });

    it('debe manejar error en bulk push con algunos fallos', async () => {
      sendBulkPushNotificationsMock.mockResolvedValueOnce({
        sent: 2,
        failed: 1,
      });

      const job = makeJob({
        type: 'bulk-push',
        userIds: ['user-1', 'user-2', 'user-3'],
        payload: {
          title: 'Test',
          body: 'Test body',
        },
      });

      await expect(worker.processJob(job)).resolves.toBeUndefined();
    });
  });

  describe('Datos adicionales en notificación in-app', () => {
    it('debe incluir imageUrl cuando se proporciona', async () => {
      const job = makeJob({
        type: 'in-app',
        userId: 'user-5',
        notificationType: 'EVENT',
        title: 'Evento especial',
        message: 'Un evento ha comenzado',
        data: { eventId: 'event-1' },
        imageUrl: 'https://example.com/image.jpg',
        linkUrl: '/events',
      });

      await worker.processJob(job);

      expect(createNotificationMock).toHaveBeenCalledWith({
        userId: 'user-5',
        type: 'EVENT',
        title: 'Evento especial',
        message: 'Un evento ha comenzado',
        data: { eventId: 'event-1' },
        imageUrl: 'https://example.com/image.jpg',
        linkUrl: '/events',
      });
    });
  });

  describe('Ciclo de vida', () => {
    it('debe cerrar el worker sin errores', async () => {
      await expect(worker.close()).resolves.toBeUndefined();
    });
  });
});
