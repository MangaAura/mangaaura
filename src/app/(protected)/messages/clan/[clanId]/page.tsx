import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ClanChatClient } from './ClanChatClient';
import { auth } from '@/lib/auth';

interface ClanChatPageProps {
  params: Promise<{ clanId: string }>;
}

export async function generateMetadata({ params }: ClanChatPageProps): Promise<Metadata> {
  const { clanId } = await params;
  return {
    title: 'Chat del Clan | MangaAura',
    description: 'Chat del clan en MangaAura.',
    robots: { index: false, follow: false },
    openGraph: {
      title: 'Chat del Clan | MangaAura',
      description: 'Chat del clan en MangaAura.',
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Chat del Clan | MangaAura',
      description: 'Chat del clan en MangaAura.',
      images: ['/og-image.png'],
    },
    alternates: { canonical: `/messages/clan/${clanId}` },
  };
}

export default async function ClanChatPage({ params }: ClanChatPageProps) {
  const { clanId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/messages');
  }

  return <ClanChatClient clanId={clanId} currentUserId={session.user.id} />;
}
