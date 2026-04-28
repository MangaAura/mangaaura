import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

interface CreateClanInput {
  name: string;
  description?: string;
  emblemUrl?: string;
  leaderId: string;
}

interface CreateClanOutput {
  clan: {
    id: string;
    name: string;
    description: string | null;
    emblemUrl: string | null;
    totalScore: number;
    monthlyScore: number;
    currentSeason: number;
    leaderId: string | null;
    createdAt: Date;
  };
}

export class CreateClanUseCase {
  async execute(input: CreateClanInput): Promise<CreateClanOutput> {
    const { name, description, emblemUrl, leaderId } = input;

    // Check if user is already in a clan
    const existingMembership = await prisma.clanMembership.findFirst({
      where: { userId: leaderId },
    });

    if (existingMembership) {
      throw new Error('User is already a member of a clan');
    }

    // Check if clan name is unique
    const existingClan = await prisma.clan.findUnique({
      where: { name: name.trim() },
    });

    if (existingClan) {
      throw new Error('Clan name already exists');
    }

    // Create clan with leader
    const clan = await prisma.$transaction(async (tx) => {
      const newClan = await tx.clan.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          emblemUrl: emblemUrl?.trim(),
          leaderId,
        },
      });

      await tx.clanMembership.create({
        data: {
          clanId: newClan.id,
          userId: leaderId,
          role: 'LEADER',
        },
      });

      return newClan;
    });

    // Revalidate cache
    revalidatePath('/community/clans');

    return { clan };
  }
}
