'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function createCollection(name: string, description?: string, isPublic: boolean = true) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const collection = await prisma.collection.create({
    data: { title: name, description, isPublic, userId: session.user.id },
  });
  revalidatePath('/collections');
  return { success: true, collection: { id: collection.id, name: collection.title } };
}

export async function deleteCollection(collectionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!collection || collection.userId !== session.user.id) throw new Error('Forbidden');

  await prisma.collection.delete({ where: { id: collectionId } });
  revalidatePath('/collections');
  return { success: true };
}

export async function addToCollection(collectionId: string, mangaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!collection || collection.userId !== session.user.id) throw new Error('Forbidden');

  await prisma.collectionItem.create({ data: { collectionId, mangaId } });
  revalidatePath('/collections');
  return { success: true };
}

export async function removeFromCollection(collectionId: string, mangaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.collectionItem.deleteMany({
    where: { collectionId, mangaId },
  });
  revalidatePath('/collections');
  return { success: true };
}

export async function updateCollection(
  collectionId: string,
  data: { name?: string; description?: string; isPublic?: boolean }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!collection || collection.userId !== session.user.id) throw new Error('Forbidden');

  await prisma.collection.update({
    where: { id: collectionId },
    data: {
      ...(data.name !== undefined && { title: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
  });
  revalidatePath('/collections');
  return { success: true };
}
