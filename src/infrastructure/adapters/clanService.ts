import { PrismaClanRepository } from './PrismaClanRepository';
import { initializeClanService, clanService as existingService } from '@/core/services/ClanService';
import { prisma } from '@/lib/prisma';

export { existingService as clanService };

export async function initClanService(): Promise<void> {
  if (typeof existingService !== 'undefined') return;
  initializeClanService(new PrismaClanRepository(prisma));
}
