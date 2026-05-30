'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { ChatInterface } from '@/components/Messages/ChatInterface';
import { Button } from '@/components/ui/Button';

interface Participant {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export function ChatClient({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          const conv = data.conversation;
          if (conv) {
            const otherUser = conv.participants?.find(
              (p: { id: string }) => p.id !== currentUserId
            ) || conv.participant;
            setParticipant(otherUser || null);
          }
        }
      } catch {
        // silent
      }
      setLoading(false);
    })();
  }, [conversationId, currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Conversación no encontrada
          </h1>
          <p className="text-[var(--text-tertiary)] mb-4">
            Esta conversación no existe o no tienes acceso.
          </p>
          <Link href="/messages">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a mensajes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link
            href="/messages"
            className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a mensajes
          </Link>
        </div>
        <div className="h-[calc(100dvh-180px)] min-h-[500px]">
          <ChatInterface
            conversationId={conversationId}
            currentUserId={currentUserId}
            participant={participant}
          />
        </div>
      </div>
    </div>
  );
}
