import { achievementService, initializeAchievementService } from '@/core/services/AchievementService';
import { PrismaAchievementRepository } from './PrismaAchievementRepository';
import { prisma } from '@/lib/prisma';
import { IAchievementChecker } from '../../application/use-cases/PostCommentUseCase';

if (!achievementService) {
  initializeAchievementService(new PrismaAchievementRepository(prisma));
}

export class AchievementServiceAdapter implements IAchievementChecker {
  async checkAchievements(userId: string): Promise<void> {
    if (!achievementService) return;
    await achievementService.checkAchievements(userId);
  }
}
