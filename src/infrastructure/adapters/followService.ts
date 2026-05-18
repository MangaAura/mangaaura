import { PrismaFollowRepository } from './PrismaFollowRepository';
import { initializeFollowService, followService as existingService } from '@/core/services/FollowService';
import { prisma } from '@/lib/prisma';

export { existingService as followService };

export async function initFollowService(): Promise<void> {
  if (typeof existingService !== 'undefined') return;
  initializeFollowService(new PrismaFollowRepository(prisma));
}
