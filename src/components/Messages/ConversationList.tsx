'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';


interface Conversation {
  id: string;
  participant: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  lastMessageAt: Date;
  unreadCount: number;
  isBlocked: boolean;
}

interface ConversationListProps {
  activeConversationId?: string;
}

export function ConversationList({ activeConversationId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={`conv-skeleton-${i}`} className="flex items-center gap-3 p-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-[var(--surface-sunken)] rounded-full flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          Sin mensajes
        </h3>
        <p className="text-[var(--text-secondary)] text-sm mb-4">
          Tus conversaciones aparecerán aquí
        </p>
        <Link
          href="/browse"
          className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium"
        >
          Encontrar usuarios →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          href={`/messages/${conversation.id}`}
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg transition-colors',
            activeConversationId === conversation.id
              ? 'bg-[var(--primary)]/20 border border-[var(--primary)]/30'
              : 'hover:bg-[var(--surface-sunken)]/50'
          )}
        >
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarImage src={conversation.participant.avatarUrl || undefined} />
              <AvatarFallback className="bg-[var(--surface-sunken)] text-[var(--text-secondary)]">
                {conversation.participant.displayName?.[0] ||
                  conversation.participant.username[0]}
              </AvatarFallback>
            </Avatar>
            {conversation.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center text-xs font-bold text-[var(--text-inverse)]">
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4
                className={cn(
                  'font-medium truncate',
                  conversation.unreadCount > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                )}
              >
                {conversation.participant.displayName ||
                  conversation.participant.username}
              </h4>
              <span className="text-xs text-[var(--text-tertiary)]">
                {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
            <p className="text-sm text-[var(--text-tertiary)] truncate">
              {conversation.isBlocked ? 'Usuario bloqueado' : 'Click para ver mensajes'}
            </p>
          </div>

          <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
      ))}
    </div>
  );
}
