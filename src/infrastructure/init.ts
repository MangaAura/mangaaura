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

export function ensureInfrastructure(): void {
  if (initialized) return;
  initialized = true;
  initInfrastructure().catch((err) =>
    console.warn('[Infrastructure] Init failed (non-blocking):', err)
  );
}
