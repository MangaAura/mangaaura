import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface JoinClanInput {
  clanId: string;
  userId: string;
}

interface JoinClanOutput {
  membership: {
    id: string;
    clanId: string;
    userId: string;
    role: string;
    joinedAt: Date;
    contributedScore: number;
  };
}

export class JoinClanUseCase {
  async execute(input: JoinClanInput): Promise<JoinClanOutput> {
    const { clanId, userId } = input;

    // Check if user is already in a clan
    const existingMembership = await prisma.clanMembership.findFirst({
      where: { userId },
    });

    if (existingMembership) {
      throw new Error('User is already a member of a clan');
    }

    // Check if clan exists
    const clan = await prisma.clan.findUnique({
      where: { id: clanId },
    });

    if (!clan) {
      throw new Error('Clan not found');
    }

    // Create membership
    const membership = await prisma.clanMembership.create({
      data: {
        clanId,
        userId,
        role: 'MEMBER',
      },
    });

    // Revalidate cache
    revalidatePath(`/community/clan/${clanId}`);
    revalidatePath('/community/clans');

    return { membership };
  }
}
