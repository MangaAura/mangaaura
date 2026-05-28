'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, ChevronRight, Users, Pin } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { cn } from '@/lib/utils';

interface ClanChatPreview {
  id: string;
  name: string;
  emblemUrl: string | null;
  memberCount: number;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderName: string;
  } | null;
}

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
  lastMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
    isRead: boolean;
    isDeleted: boolean;
  } | null;
}

interface ConversationListProps {
  activeConversationId?: string;
}

export function ConversationList({ activeConversationId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [clanChat, setClanChat] = useState<ClanChatPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { handleError } = useErrorHandler();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch conversations
      const [convRes, clanRes] = await Promise.all([
        fetch('/api/conversations'),
        fetch('/api/user/clan'),
      ]);

      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(data.conversations || []);
      }

      // Fetch clan chat info if user belongs to a clan
      if (clanRes.ok) {
        const clanData = await clanRes.json();
        if (clanData.clanId) {
          try {
            // Fetch clan details with last message
            const detailRes = await fetch(`/api/clans/${clanData.clanId}`);
            if (detailRes.ok) {
              const detail = await detailRes.json();
              const clanInfo = detail.clan;

              // Fetch last message for preview
              let lastMsg = null;
              try {
                const msgRes = await fetch(`/api/clans/${clanData.clanId}/chat?limit=1`);
                if (msgRes.ok) {
                  const msgData = await msgRes.json();
                  const msgs = msgData.messages || [];
                  if (msgs.length > 0) {
                    const m = msgs[msgs.length - 1];
                    if (!m.isDeleted) {
                      const senderName = m.sender?.displayName || m.sender?.username || '';
                      lastMsg = {
                        content: m.content,
                        createdAt: m.createdAt,
                        senderName,
                      };
                    }
                  }
                }
              } catch { /* silent */ }

              setClanChat({
                id: clanInfo.id,
                name: clanInfo.name,
                emblemUrl: clanInfo.emblemUrl,
                memberCount: clanInfo.memberCount,
                lastMessage: lastMsg,
              });
            }
          } catch { /* silent */ }
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Note: empty state is handled inside the return below, alongside clan chat

  return (
    <div className="space-y-1">
      {/* ── Clan Chat (Pinned) ──────────────────────────────── */}
      {clanChat && (
        <>
          <Link
            href={`/messages/clan/${clanChat.id}`}
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg transition-all group',
              activeConversationId === `clan:${clanChat.id}`
                ? 'bg-[var(--primary)]/20 border border-[var(--primary)]/30'
                : 'hover:bg-[var(--surface-sunken)]/50 border border-transparent hover:border-[var(--primary)]/20',
            )}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)]/30 to-[var(--accent-purple)]/30 flex items-center justify-center">
                {clanChat.emblemUrl ? (
                  <img
                    src={clanChat.emblemUrl}
                    alt={clanChat.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-6 h-6 text-[var(--primary)]" />
                )}
              </div>
              {/* Pinned indicator */}
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center">
                <Pin className="w-3 h-3 text-[var(--primary)] drop-shadow-sm" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold truncate text-[var(--text-primary)] flex items-center gap-1.5">
                  <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                    Clan
                  </span>
                  {clanChat.name}
                </h4>
                <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  {clanChat.memberCount}
                </span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] truncate">
                {clanChat.lastMessage
                  ? clanChat.lastMessage.content.startsWith('[audio]')
                    ? '🎤 Audio'
                    : clanChat.lastMessage.content.length > 60
                      ? clanChat.lastMessage.content.slice(0, 60) + '...'
                      : clanChat.lastMessage.content
                  : 'Chatea con tu clan'}
              </p>
            </div>

            <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Separator between clan chat and DMs */}
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="h-px flex-1 bg-[var(--border)]/50" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Mensajes Directos
            </span>
            <div className="h-px flex-1 bg-[var(--border)]/50" />
          </div>
        </>
      )}

      {/* ── Conversation List ──────────────────────────────────── */}
      {conversations.length === 0 && !clanChat ? (
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
            href="/rankings"
            className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium"
          >
            Encontrar usuarios →
          </Link>
        </div>
      ) : (
        conversations.map((conversation) => (
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
                {conversation.isBlocked
                  ? 'Usuario bloqueado'
                  : conversation.lastMessage && !conversation.lastMessage.isDeleted
                    ? conversation.lastMessage.content.startsWith('[audio]')
                      ? '🎤 Audio'
                      : conversation.lastMessage.content.length > 60
                        ? conversation.lastMessage.content.slice(0, 60) + '...'
                        : conversation.lastMessage.content
                    : 'Click para ver mensajes'}
              </p>
            </div>

            <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
        ))
      )}
    </div>
  );
}
