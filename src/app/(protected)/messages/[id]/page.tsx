import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';

import { ChatInterface } from '@/components/Messages/ChatInterface';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';



interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ConversationPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return { title: 'Conversación | Inkverse' };
  }

  const conversation = await prisma.conversation.findFirst({
  where: {
    id,
    OR: [
      { participant1Id: session.user.id },
      { participant2Id: session.user.id },
    ],
  },
  include: {
    participant1: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    participant2: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  },
  });

  if (!conversation) {
    return { title: 'Conversación | Inkverse' };
  }

  const participant = conversation.participant1Id === session.user.id
    ? conversation.participant2
    : conversation.participant1;

  return {
    title: `${participant.displayName || participant.username} | Inkverse`,
    description: `Chat con ${participant.displayName || participant.username}`,
  };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/messages/' + id);
  }

  const conversation = await prisma.conversation.findFirst({
  where: {
    id,
    OR: [
      { participant1Id: session.user.id },
      { participant2Id: session.user.id },
    ],
  },
  include: {
    participant1: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    participant2: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    messages: {
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        senderId: true,
        isRead: true,
      },
    },
  },
  });

  if (!conversation) {
    notFound();
  }

  const participant = conversation.participant1Id === session.user.id
    ? conversation.participant2
    : conversation.participant1;

  // Marcar mensajes como leídos
  await prisma.directMessage.updateMany({
    where: {
      conversationId: id,
      senderId: participant.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] min-h-[500px]">
        <ChatInterface
          conversationId={id}
          currentUserId={session.user.id}
          participant={participant}
          initialMessages={conversation.messages.map((m) => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
            senderId: m.senderId,
            isRead: m.isRead,
          }))}
        />
      </div>
    </div>
  );
}
