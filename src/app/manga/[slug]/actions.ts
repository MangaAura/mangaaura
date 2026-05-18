'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function toggleLibrary(mangaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const existing = await prisma.userLibrary.findUnique({
    where: { userId_mangaId: { userId: session.user.id, mangaId } },
  });

  if (existing) {
    await prisma.userLibrary.delete({ where: { id: existing.id } });
    revalidatePath(`/manga/${mangaId}`);
    return { isInLibrary: false };
  } else {
    await prisma.userLibrary.create({
      data: { userId: session.user.id, mangaId },
    });
    revalidatePath(`/manga/${mangaId}`);
    return { isInLibrary: true };
  }
}
