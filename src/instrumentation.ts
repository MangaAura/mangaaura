export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { closeRedisConnection } = await import('@/lib/redis');

    const shutdown = async (signal: string) => {
      console.log(`[Shutdown] Received ${signal}, cleaning up...`);

      // 1. Cerrar servidor Socket.IO (desconectar Redis adapter)
      try {
        const { getIO } = await import('@/lib/socket');
        const io = getIO();
        if (io) {
          await new Promise<void>((resolve) => {
            io.close(() => {
              console.log('[Shutdown] Socket.IO server closed');
              resolve();
            });
          });
        }
      } catch (error) {
        console.error('[Shutdown] Error closing Socket.IO:', error);
      }

      // 2. Cerrar conexión Redis (pub/sub clients del adapter)
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
