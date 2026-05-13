import { prisma } from '@/lib/prisma';
import { XP } from '@/core/value-objects/XP';
import { IUserRepositoryPort } from '../../application/use-cases/PostCommentUseCase';

export class UserXPRepositoryAdapter implements IUserRepositoryPort {
  async findById(id: string): Promise<{ id: string; xp: { amount: number } } | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, xpPoints: true },
    });
    if (!user) return null;
    return { id: user.id, xp: { amount: user.xpPoints } };
  }

  async updateXP(userId: string, amount: number): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xpPoints: true, level: true },
    });
    if (!user) return 0;

    const currentXP = XP.create(user.xpPoints);
    const newXP = currentXP.add(XP.create(amount));

    await prisma.user.update({
      where: { id: userId },
      data: {
        xpPoints: newXP.amount,
        level: newXP.level,
      },
    });

    return newXP.amount;
  }
}
