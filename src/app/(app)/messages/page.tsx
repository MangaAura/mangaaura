import { MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ConversationList } from '@/components/Messages/ConversationList';
import { auth } from '@/lib/auth';


export const metadata: Metadata = {
  title: 'Mensajes | Inkverse',
  description: 'Tus conversaciones y mensajes directos',
};

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/messages');
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 mb-6">
          <MessageSquare className="text-[var(--primary)]" size={30} /> Mensajes
        </h1>

    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] min-h-[500px]">
          <ConversationList />
        </div>
      </div>
    </div>
  );
}
