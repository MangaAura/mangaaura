import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import ClanDetailClient from './ClanDetailClient';
import { Prisma } from '@/generated/prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ── Shared Prisma query (deduplicated across metadata and page) ──

const clanInclude = {
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
} satisfies Prisma.ClanInclude;

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
    return { title: 'Clan no encontrado - MangaAura' };
  }

  const ogImage = `/api/og?type=clan&title=${encodeURIComponent(clan.name)}&cover=${clan.emblemUrl ? encodeURIComponent(clan.emblemUrl) : ''}`;

  return {
    title: `${clan.name} - MangaAura`,
    description:
      clan.description?.slice(0, 160) || `Clan ${clan.name} en MangaAura`,
    openGraph: {
      title: `${clan.name} - Clan en MangaAura`,
      description: clan.description?.slice(0, 160) || undefined,
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: clan.name }],
      publishedTime: clan.createdAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${clan.name} - Clan en MangaAura`,
      description: clan.description?.slice(0, 160) || undefined,
      images: [ogImage],
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

  const session = await auth();    const userId = session?.user?.id || null;
    const members = (clan.members || []).map((m) => ({
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
