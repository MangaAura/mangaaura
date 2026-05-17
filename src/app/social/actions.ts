'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { ToggleFollowUseCase } from '@/application/use-cases/follows/ToggleFollowUseCase';

const toggleFollowUseCase = new ToggleFollowUseCase();

export async function toggleFollow(
  targetId: string,
  targetType: 'USER' | 'MANGA',
  pathToRevalidate?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const result = await toggleFollowUseCase.execute({
    followerId: session.user.id,
    targetId,
    targetType,
  });

  if (pathToRevalidate) {
    revalidatePath(pathToRevalidate);
  }

  return {
    success: result.success,
    isFollowing: result.isFollowing,
    message: result.message,
  };
}
