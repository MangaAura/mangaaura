import { NextResponse } from 'next/server';

import { PrismaFollowRepository } from '@/infrastructure/adapters/PrismaFollowRepository';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ users: [] });
  }

  const followRepo = new PrismaFollowRepository(prisma);
  const followingIds = await followRepo.findFollowingIds(session.user.id);

  // If user follows at least 3 people, show recommendations based on their follows
  if (followingIds.length >= 3) {
    const recommendedIds = await followRepo.findRecommendedIds(followingIds, [
      session.user.id,
      ...followingIds,
    ]);
    if (recommendedIds.length > 0) {
      const uniqueIds = [...new Set(recommendedIds)].slice(0, 6);
      const users = await followRepo.findUsersByIds(uniqueIds);
      return NextResponse.json({ users });
    }
  }

  // Fallback: popular users by XP
  const popular = await followRepo.findPopularUsers(session.user.id, 6);
  const filtered = popular.filter((u) => !followingIds.includes(u.id));
  return NextResponse.json({ users: filtered.slice(0, 6) });
}
