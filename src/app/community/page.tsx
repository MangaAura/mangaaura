import type { Metadata } from 'next';

import CommunityTabs from './CommunityTabs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Comunidad | MangaAura',
  description:
    'Conecta con otros lectores de manga. Únete a clanes, participa en eventos y compite en el ranking.',
};

export default async function CommunityPage() {
  const session = await auth();
  let userClanSlug: string | null = null;

  // Fetch all data in parallel
  const [topClans, activeEvents, userMembership, totalClans] = await Promise.all([
    // Top 6 clans by monthly score
    prisma.clan.findMany({
      orderBy: { monthlyScore: 'desc' },
      take: 6,
      include: {
        _count: { select: { members: true } },
      },
    }),
    // Active events (up to 4)
    prisma.event.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { endDate: 'asc' },
      take: 4,
      include: {
        _count: { select: { submissions: true } },
      },
    }),

    // User's clan membership (with slug)
    session?.user?.id
      ? prisma.clanMembership.findFirst({
          where: { userId: session.user.id },
          select: {
            clanId: true,
            clan: { select: { slug: true } },
          },
        })
      : null,
    // Total clan count
    prisma.clan.count(),
  ]);

  userClanSlug = userMembership?.clan?.slug ?? null;

  // Serialize dates
  const serializedClans = topClans.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    emblemUrl: c.emblemUrl,
    totalScore: c.totalScore,
    monthlyScore: c.monthlyScore,
    memberCount: c._count.members,
  }));

  const serializedEvents = activeEvents.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.type,
    status: e.status,
    prize: e.prize,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    imageUrl: e.imageUrl,
    color: e.color,
    borderColor: e.borderColor,
    _count: { submissions: e._count.submissions },
  }));

  return (
    <CommunityTabs
      topClans={serializedClans}
      activeEvents={serializedEvents}
      totalClans={totalClans}
      userClanSlug={userClanSlug}
    />
  );
}
