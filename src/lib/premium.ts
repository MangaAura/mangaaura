import { prisma } from '@/lib/prisma';

export async function requirePremium(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true },
  });
  return user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';
}

export async function getPremiumStatus(userId: string): Promise<{
  isPremium: boolean;
  tier: string | null;
  endsAt: Date | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscriptionTier: true,
      subscriptionEndsAt: true,
    },
  });

  const isPremium =
    user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';

  return {
    isPremium,
    tier: user?.subscriptionTier ?? null,
    endsAt: user?.subscriptionEndsAt ?? null,
  };
}
