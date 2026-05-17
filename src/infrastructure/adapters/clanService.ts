import { initializeClanService, clanService as existingService } from '@/core/services/ClanService';
import { PrismaClanRepository } from './PrismaClanRepository';
import { prisma } from '@/lib/prisma';

if (!existingService) {
  initializeClanService(new PrismaClanRepository(prisma));
}

export { existingService as clanService };
