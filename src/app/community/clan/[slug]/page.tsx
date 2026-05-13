import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Prisma } from '@prisma/client';
import ClanDetailClient from './ClanDetailClient';
import type { Metadata } from 'next';

// ── Shared Prisma query (deduplicated across metadata and page) ──

const clanInclude = Prisma.validator<Prisma.ClanInclude>()({
  members: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          xpPoints: true,
          level: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' },
      { contributedScore: 'desc' },
    ],
  },
});

const getClan = cache(async (slug: string) => {
  // Try by name first
  let clan = await prisma.clan.findFirst({
    where: { name: slug },
    include: clanInclude,
  });

  // If not found by name, try by id (UUID)
  if (!clan) {
    clan = await prisma.clan.findFirst({
      where: { id: slug },
      include: clanInclude,
    });
  }

  return clan;
});

// ── Metadata ────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const clan = await getClan(slug);

  if (!clan) {
    return { title: 'Clan no encontrado - InkVerse' };
  }

  return {
    title: `${clan.name} - InkVerse`,
    description:
      clan.description?.slice(0, 160) || `Clan ${clan.name} en InkVerse`,
    openGraph: {
      title: `${clan.name} - Clan en InkVerse`,
      description: clan.description?.slice(0, 160) || undefined,
    },
  };
}

// ── Page ────────────────────────────────────────────────

export default async function ClanDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clan = await getClan(slug);

  if (!clan) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id || null;    const members = (clan.members || []).map((m) => ({
      ...m,
      joinedAt: m.joinedAt.toISOString(),
    }));
    const userMembership = userId
      ? (members.find((m) => m.userId === userId) || null)
      : null;

    return (
      <ClanDetailClient
        clan={{
          ...clan,
          createdAt: clan.createdAt.toISOString(),
          members,
          memberCount: members.length,
        }}
      userMembership={userMembership as { role: 'MEMBER' | 'LEADER' | 'OFFICER' } | null}
      userId={userId}
    />
  );
}
