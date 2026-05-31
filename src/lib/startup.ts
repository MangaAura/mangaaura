/**
 * Application Startup
 * 
 * Now purely for graceful shutdown handling.
 * No background workers or AI services are started automatically.
 * They start lazily on first use (first job enqueue, first AI submission).
 */

let initialized = false;

/**
 * Initialize the application startup sequence.
 * Called once during server initialization via ensureInfrastructure().
 * No longer starts workers or AI service — they are lazy-initialized.
 */
export function initialize(): void {
  if (initialized) return;
  initialized = true;

  // Workers and AI service are NOT started here anymore.
  // They start lazily on first job enqueue or first API call.
  //
  // This eliminates all background Redis connections and intervals
  // when there is no traffic.

  registerShutdownHandlers();
}

/**
 * Gracefully shutdown all workers and connections.
 * Called on SIGTERM/SIGINT or by the application shutdown sequence.
 */
export async function shutdown(): Promise<void> {
  if (!initialized) return;
  initialized = false;

  console.info('[Startup] Shutting down...');

  // Stop any running workers (lazy-imported, may not be loaded)
  try {
    const { stopWorkers } = await import('@/infrastructure/workers');
    await stopWorkers();
  } catch {
    // Workers may not have been started
  }

  // Stop AI service if running
  try {
    const { resetUnifiedAIService } = await import('@/infrastructure/ai');
    await resetUnifiedAIService();
  } catch {
    // AI service may not have been started
  }

  console.info('[Startup] Shutdown complete');
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
