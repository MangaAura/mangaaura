export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { closeRedisConnection } = await import('@/lib/redis');

    const shutdown = async (signal: string) => {
      console.log(`[Shutdown] Received ${signal}, cleaning up...`);
      try {
        await closeRedisConnection();
        console.log('[Shutdown] Redis connection closed');
      } catch (error) {
        console.error('[Shutdown] Error closing Redis:', error);
      }
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}
