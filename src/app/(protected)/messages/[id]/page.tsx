import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ChatClient } from './ChatClient';
import { auth } from '@/lib/auth';

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ConversationPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: 'Conversación | MangaAura',
    description: 'Mensajes directos en MangaAura.',
    robots: { index: false, follow: false },
    openGraph: {
      title: 'Conversación | MangaAura',
      description: 'Mensajes directos en MangaAura.',
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Conversación | MangaAura',
      description: 'Mensajes directos en MangaAura.',
      images: ['/og-image.png'],
    },
    alternates: { canonical: `/messages/${id}` },
  };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/messages');
  }

  return <ChatClient conversationId={id} currentUserId={session.user.id} />;
}
