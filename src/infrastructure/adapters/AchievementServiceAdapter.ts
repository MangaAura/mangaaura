import { PrismaAchievementRepository } from './PrismaAchievementRepository';
import { IAchievementChecker } from '../../application/use-cases/PostCommentUseCase';
import { achievementService, initializeAchievementService } from '@/core/services/AchievementService';
import { prisma } from '@/lib/prisma';

if (!achievementService) {
  initializeAchievementService(new PrismaAchievementRepository(prisma));
}

export class AchievementServiceAdapter implements IAchievementChecker {
  async checkAchievements(userId: string): Promise<void> {
    if (!achievementService) return;
    await achievementService.checkAchievements(userId);
  }
}
