import { initializeFollowService, followService as existingService } from '@/core/services/FollowService';
import { PrismaFollowRepository } from './PrismaFollowRepository';
import { prisma } from '@/lib/prisma';

if (!existingService) {
  initializeFollowService(new PrismaFollowRepository(prisma));
}

export { existingService as followService };
