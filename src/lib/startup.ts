/**
 * Application Startup
 * Initializes background workers and other startup tasks.
 */

import { startWorkers, stopWorkers } from '@/infrastructure/workers';

let initialized = false;

/**
 * Initialize the application startup sequence.
 * Called once during server initialization via ensureInfrastructure().
 */
export function initialize(): void {
  if (initialized) return;
  initialized = true;

  console.info('[Startup] Initializing application...');
  startWorkers();

  // Start AI service (lazy, non-blocking)
  startAIService();

  // Register graceful shutdown handlers once (gated by `initialized`)
  registerShutdownHandlers();
}

/**
 * Start the UnifiedAIService (lazy import, non-blocking).
 * Starts health checks and processing loop that never ran before.
 */
async function startAIService(): Promise<void> {
  try {
    const { getUnifiedAIService } = await import('@/infrastructure/ai');
    await getUnifiedAIService().start();
    console.info('[Startup] AI service started');
  } catch (err) {
    console.warn('[Startup] AI service startup failed (non-blocking):', err);
  }
}

/**
 * Gracefully shutdown all workers and connections.
 * Called on SIGTERM/SIGINT or by the application shutdown sequence.
 */
export async function shutdown(): Promise<void> {
  if (!initialized) return;
  initialized = false;

  console.info('[Startup] Shutting down...');

  await stopWorkers();

  // Stop AI service gracefully
  await stopAIService();

  console.info('[Startup] Shutdown complete');
}

/**
 * Stop the UnifiedAIService (lazy import, non-blocking).
 */
async function stopAIService(): Promise<void> {
  try {
    const { resetUnifiedAIService } = await import('@/infrastructure/ai');
    await resetUnifiedAIService();
    console.info('[Startup] AI service stopped');
  } catch (err) {
    console.warn('[Startup] AI service shutdown failed (non-blocking):', err);
  }
}

/**
 * Register process signal handlers for graceful shutdown.
 * Prevents orphaned jobs on deployment/restart.
 */
function registerShutdownHandlers(): void {
  const handleShutdown = async (signal: string) => {
    console.info(`[Startup] Received ${signal}, starting graceful shutdown...`);

    // Give in-flight jobs time to complete before exit
    const timeout = setTimeout(() => {
      console.warn('[Startup] Forced shutdown after timeout');
      process.exit(1);
    }, 30000); // 30 second timeout

    try {
      await shutdown();
    } catch (error) {
      console.error('[Startup] Error during shutdown:', error);
    }

    clearTimeout(timeout);
    process.exit(0);
  };

  // Node.js signals — Sentry handles unhandledRejection separately
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}
