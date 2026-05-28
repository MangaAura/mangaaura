import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';

import { ClanChatInterface } from '@/components/Messages/ClanChatInterface';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ClanChatPageProps {
  params: Promise<{ clanId: string }>;
}

export async function generateMetadata({ params }: ClanChatPageProps): Promise<Metadata> {
  const { clanId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return { title: 'Chat de Clan | MangaAura' };
  }

  const clan = await prisma.clan.findUnique({
    where: { id: clanId },
    select: { name: true },
  });

  if (!clan) {
    return { title: 'Chat de Clan | MangaAura' };
  }

  return {
    title: `${clan.name} - Chat | MangaAura`,
    description: `Chat del clan ${clan.name}`,
  };
}

export default async function ClanChatPage({ params }: ClanChatPageProps) {
  const { clanId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/messages/clan/' + clanId);
  }

  // Verify user is a member of this clan
  const membership = await prisma.clanMembership.findFirst({
    where: { clanId, userId: session.user.id },
  });

  if (!membership) {
    notFound();
  }

  // Get clan info
  const clan = await prisma.clan.findUnique({
    where: { id: clanId },
    select: {
      id: true,
      name: true,
      emblemUrl: true,
      description: true,
      _count: { select: { members: true } },
    },
  });

  if (!clan) {
    notFound();
  }

  // Get initial messages (last 50)
  const messages = await prisma.clanChatMessage.findMany({
    where: { clanId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
          sender: {
            select: { username: true, displayName: true },
          },
        },
      },
      reactions: {
        select: {
          id: true,
          emoji: true,
          userId: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] min-h-[500px]">
        <ClanChatInterface
          clanId={clanId}
          currentUserId={session.user.id}
          clan={{
            id: clan.id,
            name: clan.name,
            emblemUrl: clan.emblemUrl,
            description: clan.description,
            memberCount: clan._count.members,
          }}
          currentUserRole={membership.role}
          initialMessages={messages.map((m) => ({
            id: m.id,
            content: m.content,
            clanId: m.clanId,
            senderId: m.senderId,
            senderName: m.sender.displayName || m.sender.username,
            senderAvatar: m.sender.avatarUrl,
            createdAt: m.createdAt.toISOString(),
            isEdited: m.isEdited,
            editedAt: m.editedAt?.toISOString(),
            isDeleted: m.isDeleted,
            replyTo: m.replyTo
              ? {
                  id: m.replyTo.id,
                  content: m.replyTo.content,
                  senderId: m.replyTo.senderId,
                  senderName: m.replyTo.sender.displayName || m.replyTo.sender.username,
                }
              : null,
            reactions: m.reactions.map((r) => ({
              id: r.id,
              emoji: r.emoji,
              userId: r.userId,
            })),
          }))}
        />
      </div>
    </div>
  );
}
