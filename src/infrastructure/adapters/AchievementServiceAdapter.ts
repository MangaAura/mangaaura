import { achievementService } from '@/core/services/AchievementService';
import { IAchievementChecker } from '../../application/use-cases/PostCommentUseCase';

export class AchievementServiceAdapter implements IAchievementChecker {
  async checkAchievements(userId: string): Promise<void> {
    await achievementService.checkAchievements(userId);
  }
}
