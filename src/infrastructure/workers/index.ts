/**
 * Workers Index
 * Inicializa y gestiona el ciclo de vida de los workers BullMQ
 */

import { EmailWorker, getEmailWorker, stopEmailWorker } from './EmailWorker';
import { resetEmailQueue } from '@/infrastructure/queue/EmailQueue';
import { closeRedisConnection } from '@/lib/redis';

export { EmailWorker, getEmailWorker, stopEmailWorker };

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
    resetEmailQueue();
    console.info('[Workers] EmailQueue closed');
  } catch (error) {
    console.error('[Workers] Error closing EmailQueue:', error);
  }

  try {
    await closeRedisConnection();
    console.info('[Workers] Redis connection closed');
  } catch (error) {
    console.error('[Workers] Error closing Redis:', error);
  }
}
