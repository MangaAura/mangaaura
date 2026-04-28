import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface LeaveClanInput {
  clanId: string;
  userId: string;
}

interface LeaveClanOutput {
  success: boolean;
  clanDeleted?: boolean;
}

export class LeaveClanUseCase {
  async execute(input: LeaveClanInput): Promise<LeaveClanOutput> {
    const { clanId, userId } = input;

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

    // If user is the leader
    if (membership.role === 'LEADER') {
      const memberCount = await prisma.clanMembership.count({
        where: { clanId },
      });

      // If leader is the only member, delete the clan
      if (memberCount === 1) {
        await prisma.clan.delete({
          where: { id: clanId },
        });

        // Revalidate cache
        revalidatePath('/community/clans');
        revalidatePath(`/community/clan/${clanId}`);

        return { success: true, clanDeleted: true };
      }

      throw new Error('Leader must transfer leadership before leaving');
    }

    // Remove membership for regular members
    await prisma.clanMembership.delete({
      where: { id: membership.id },
    });

    // Revalidate cache
    revalidatePath(`/community/clan/${clanId}`);
    revalidatePath('/community/clans');

    return { success: true };
  }
}
