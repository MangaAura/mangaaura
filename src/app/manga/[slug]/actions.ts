'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function toggleLibrary(mangaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const existing = await prisma.userLibrary.findUnique({
    where: { userId_mangaId: { userId: session.user.id, mangaId } },
  });

  if (existing) {
    await prisma.userLibrary.delete({ where: { id: existing.id } });
    revalidatePath(`/manga/${mangaId}`);
    return { isInLibrary: false, status: null };
  } else {
    await prisma.userLibrary.create({
      data: { userId: session.user.id, mangaId },
    });
    revalidatePath(`/manga/${mangaId}`);
    return { isInLibrary: true, status: 'READING' };
  }
}

export async function setLibraryStatus(mangaId: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const entry = await prisma.userLibrary.upsert({
    where: { userId_mangaId: { userId: session.user.id, mangaId } },
    update: { status },
    create: { userId: session.user.id, mangaId, status },
  });

  revalidatePath(`/manga/${mangaId}`);
  return { isInLibrary: true, status: entry.status };
}

export async function removeFromLibrary(mangaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const existing = await prisma.userLibrary.findUnique({
    where: { userId_mangaId: { userId: session.user.id, mangaId } },
  });

  if (!existing) return { isInLibrary: false, status: null };

  await prisma.userLibrary.delete({ where: { id: existing.id } });
  revalidatePath(`/manga/${mangaId}`);
  return { isInLibrary: false, status: null };
}
