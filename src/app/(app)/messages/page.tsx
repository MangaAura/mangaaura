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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Mensajes</h1>

    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] min-h-[500px]">
          <ConversationList />
        </div>
      </div>
    </div>
  );
}
