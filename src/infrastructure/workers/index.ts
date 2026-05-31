/**
 * Workers Index
 * Inicializa y gestiona el ciclo de vida de los workers BullMQ
 */

import { EmailWorker, getEmailWorker, stopEmailWorker } from './EmailWorker';
import { InboundEmailWorker, getInboundEmailWorker, stopInboundEmailWorker } from './InboundEmailWorker';
import { NotificationWorker, getNotificationWorker, stopNotificationWorker } from './NotificationWorker';
import { closeBullConnection } from '@/infrastructure/queue/connection';
import { resetEmailQueue } from '@/infrastructure/queue/EmailQueue';
import { resetInboundEmailQueue } from '@/infrastructure/queue/InboundEmailQueue';
import { resetNotificationQueue } from '@/infrastructure/queue/NotificationQueue';
import { closeRedisConnection } from '@/lib/redis';

export { EmailWorker, getEmailWorker, stopEmailWorker };
export { InboundEmailWorker, getInboundEmailWorker, stopInboundEmailWorker };
export { NotificationWorker, getNotificationWorker, stopNotificationWorker };

let started = false;

export function startWorkers(): void {
  if (started) return;
  started = true;

  if (process.env.NODE_ENV !== 'production' && !process.env.REDIS_URL) {
    console.info('[Workers] Skipping worker startup (no Redis in development)');
    return;
  }

  try {
    getEmailWorker();
    console.info('[Workers] EmailWorker started');
  } catch (error) {
    console.error('[Workers] Failed to start EmailWorker:', error);
  }

  try {
    getNotificationWorker();
    console.info('[Workers] NotificationWorker started');
  } catch (error) {
    console.error('[Workers] Failed to start NotificationWorker:', error);
  }

  try {
    getInboundEmailWorker();
    console.info('[Workers] InboundEmailWorker started');
  } catch (error) {
    console.error('[Workers] Failed to start InboundEmailWorker:', error);
  }
}

export async function stopWorkers(): Promise<void> {
  if (!started) return;
  started = false;

  console.info('[Workers] Shutting down workers...');

  try {
    stopEmailWorker();
    console.info('[Workers] EmailWorker stopped');
  } catch (error) {
    console.error('[Workers] Error stopping EmailWorker:', error);
  }

  try {
    stopNotificationWorker();
    console.info('[Workers] NotificationWorker stopped');
  } catch (error) {
    console.error('[Workers] Error stopping NotificationWorker:', error);
  }

  try {
    resetEmailQueue();
    console.info('[Workers] EmailQueue closed');
  } catch (error) {
    console.error('[Workers] Error closing EmailQueue:', error);
  }

  try {
    resetNotificationQueue();
    console.info('[Workers] NotificationQueue closed');
  } catch (error) {
    console.error('[Workers] Error closing NotificationQueue:', error);
  }

  try {
    stopInboundEmailWorker();
    console.info('[Workers] InboundEmailWorker stopped');
  } catch (error) {
    console.error('[Workers] Error stopping InboundEmailWorker:', error);
  }

  try {
    resetInboundEmailQueue();
    console.info('[Workers] InboundEmailQueue closed');
  } catch (error) {
    console.error('[Workers] Error closing InboundEmailQueue:', error);
  }

  try {
    await closeBullConnection();
    console.info('[Workers] BullMQ connection closed');
  } catch (error) {
    console.error('[Workers] Error closing BullMQ connection:', error);
  }

  try {
    await closeRedisConnection();
    console.info('[Workers] Redis connection closed');
  } catch (error) {
    console.error('[Workers] Error closing Redis:', error);
  }
}
