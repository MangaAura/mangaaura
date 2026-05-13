/**
 * Application Startup
 * Initializes background workers and other startup tasks.
 */

import { startWorkers, stopWorkers } from '@/infrastructure/workers';

let initialized = false;

export function initialize(): void {
  if (initialized) return;
  initialized = true;

  console.info('[Startup] Initializing application...');
  startWorkers();
}

export async function shutdown(): Promise<void> {
  if (!initialized) return;
  initialized = false;

  console.info('[Startup] Shutting down...');
  await stopWorkers();
}
