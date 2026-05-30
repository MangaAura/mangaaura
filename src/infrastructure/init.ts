export async function initInfrastructure(): Promise<void> {
  if (typeof window !== 'undefined') return;
  if (process.env.NEXT_RUNTIME === 'edge') return;

  const { initCollectionService } = await import('./adapters/collectionService');
  const { initFollowService } = await import('./adapters/followService');
  const { initMessageService } = await import('./adapters/messageService');
  const { initClanService } = await import('./adapters/clanService');

  await Promise.all([
    initCollectionService(),
    initFollowService(),
    initMessageService(),
    initClanService(),
  ]);
}

let initialized = false;

/**
 * Initialize BullMQ workers lazily.
 * Uses dynamic import to avoid pulling BullMQ/ioredis during static build or Edge runtime.
 */
async function initializeWorkers(): Promise<void> {
  try {
    const { initialize } = await import('@/lib/startup');
    initialize();
  } catch (err) {
    console.warn('[Infrastructure] Worker startup failed (non-blocking):', err);
  }
}

/**
 * Ensure infrastructure is initialized.
 * Called from root layout at server module scope.
 * Runs once per server process.
 */
export function ensureInfrastructure(): void {
  if (initialized) return;
  initialized = true;

  // Initialize infrastructure services (dynamic imports, lazy-loaded)
  initInfrastructure().catch((err) =>
    console.warn('[Infrastructure] Init failed (non-blocking):', err)
  );

  // Initialize BullMQ workers (dynamic import, lazy-loaded)
  initializeWorkers().catch((err) =>
    console.warn('[Infrastructure] Worker startup failed (non-blocking):', err)
  );
}
