import { prisma } from '@/lib/prisma';

interface UpdateClanScoreInput {
  clanId: string;
  userId: string;
  scoreToAdd: number;
}

interface UpdateClanScoreOutput {
  clan: {
    id: string;
    totalScore: number;
    monthlyScore: number;
  };
  membership: {
    id: string;
    contributedScore: number;
  };
}

export class UpdateClanScoreUseCase {
  async execute(input: UpdateClanScoreInput): Promise<UpdateClanScoreOutput> {
    const { clanId, userId, scoreToAdd } = input;

    // Check if user is a member of this clan
    const membership = await prisma.clanMembership.findFirst({
      where: {
        clanId,
        userId,
      },
    });

    if (!membership) {
      throw new Error('User is not a member of this clan');
    }

    // Update clan and membership scores in a transaction
    const [updatedClan, updatedMembership] = await prisma.$transaction([
      prisma.clan.update({
        where: { id: clanId },
        data: {
          totalScore: { increment: scoreToAdd },
          monthlyScore: { increment: scoreToAdd },
        },
      }),
      prisma.clanMembership.update({
        where: { id: membership.id },
        data: {
          contributedScore: { increment: scoreToAdd },
        },
      }),
    ]);

    return {
      clan: {
        id: updatedClan.id,
        totalScore: updatedClan.totalScore,
        monthlyScore: updatedClan.monthlyScore,
      },
      membership: {
        id: updatedMembership.id,
        contributedScore: updatedMembership.contributedScore,
      },
    };
  }
}
