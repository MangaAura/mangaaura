'use client';

import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Send,
  Flag,
  Smile,
  ChevronDown,
  Pencil,
  Trash2,
  Forward,
  Search,
  ShieldOff,
  Mic,
  Square,
  Volume2,
  Reply as ReplyIcon,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';

import { AccessibleModal } from '@/components/A11y/AccessibleModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────

interface ReplyTo {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
}

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user?: { id: string; username: string };
}

interface Message {
  id: string;
  content: string;
  createdAt: Date | string;
  senderId: string;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: Date | string;
  isDeleted?: boolean;
  replyTo?: ReplyTo | null;
  reactions?: Reaction[];
}

interface ChatInterfaceProps {
  conversationId: string;
  currentUserId: string;
  participant: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  initialMessages?: Message[];
}

// ─── Emoji categories ────────────────────────────────────────────────

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'Smileys',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
      '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
      '🤫', '🤔', '😐', '😑', '😶', '😏', '😒', '🙄',
      '😬', '😔', '😕', '🙃', '😢', '😭', '😤', '😠',
      '🤬', '😡', '🥺', '😳', '🤯', '😱', '😨', '😰',
    ],
  },
  {
    name: 'Gestos',
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌',
      '👐', '🤲', '🤝', '🙏', '✌️', '🤟', '🤘', '👌',
      '✋', '🤚', '💪', '🦶', '🦵', '🖕', '💅', '👀',
    ],
  },
  {
    name: 'Corazones',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '💌', '✨', '⭐',
    ],
  },
  {
    name: 'Objetos',
    emojis: [
      '🎉', '🎊', '🎀', '🎁', '🎈', '🎃', '🎄', '🎆',
      '🎇', '🧨', '✨', '🔥', '💯', '💢', '💬', '🗨️',
      '🗯️', '🕳️', '💤', '💦', '💨', '🫂', '🎵', '🎶',
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDateHeader(date: Date): string {
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  return format(date, 'd MMMM yyyy', { locale: es });
}

function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: es });
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'ahora';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD} d`;
  return format(date, "d MMM", { locale: es });
}

function shouldShowDateSeparator(
  current: Date,
  previous: Date | null,
): boolean {
  if (!previous) return true;
  return !isSameDay(current, previous);
}

function groupMessages(messages: Message[]) {
  const groups: { senderId: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (last && last.senderId === msg.senderId) {
      last.messages.push(msg);
    } else {
      groups.push({ senderId: msg.senderId, messages: [msg] });
    }
  }
  return groups;
}

// ─── Sub-components ───────────────────────────────────────────────────

function DateSeparator({ date }: { date: Date }) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="px-3 py-1 text-xs font-medium text-[var(--text-tertiary)] bg-[var(--surface-elevated)]/70 rounded-full border border-[var(--border)]/50 backdrop-blur-sm">
        {formatDateHeader(date)}
      </span>
    </div>
  );
}

function ReadReceipt({ isRead }: { isRead: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] leading-none ml-1 -mb-0.5',
        isRead ? 'text-[#53bdeb]' : 'text-[var(--text-tertiary)]',
      )}
      aria-label={isRead ? 'Leído' : 'Enviado'}
    >
      {isRead ? (
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden="true">
          <path
            d="M11.071.659a.5.5 0 0 0-.708 0L5.657 5.364a.5.5 0 0 0 0 .707l.707.708a.5.5 0 0 0 .708 0l4.596-4.597a.5.5 0 0 0 0-.707l-.354-.354a.5.5 0 0 0-.243-.131V.66Z"
            fill="currentColor"
          />
          <path
            d="M15.071.659a.5.5 0 0 0-.708 0L9.657 5.364a.5.5 0 0 0 0 .707l.707.708a.5.5 0 0 0 .708 0l4.596-4.597a.5.5 0 0 0 0-.707l-.354-.354a.5.5 0 0 0-.243-.131V.66Z"
            fill="currentColor"
          />
          <path
            d="M7.364 6.778a.5.5 0 0 0-.708 0l-3.89 3.89a.5.5 0 0 1-.706 0l-1.95-1.95a.5.5 0 0 0-.707 0l-.354.353a.5.5 0 0 0 0 .708l2.657 2.657a.5.5 0 0 0 .707 0l4.95-4.95a.5.5 0 0 0 0-.707l-.707-.707Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden="true">
          <path
            d="M11.071.659a.5.5 0 0 0-.708 0L5.657 5.364a.5.5 0 0 0 0 .707l.707.708a.5.5 0 0 0 .708 0l4.596-4.597a.5.5 0 0 0 0-.707l-.354-.354a.5.5 0 0 0-.243-.131V.66Z"
            fill="currentColor"
          />
          <path
            d="M15.071.659a.5.5 0 0 0-.708 0L9.657 5.364a.5.5 0 0 0 0 .707l.707.708a.5.5 0 0 0 .708 0l4.596-4.597a.5.5 0 0 0 0-.707l-.354-.354a.5.5 0 0 0-.243-.131V.66Z"
            fill="currentColor"
          />
        </svg>
      )}
    </span>
  );
}

function MessageBubble({
  content,
  time,
  isOwn,
  isRead,
  isEdited,
  editedAt,
  isDeleted,
  showTail,
  showTimestamp,
  replyTo,
  reactions,
  currentUserId,
  onReplyClick,
  onReactionClick,
}: {
  content: string;
  time: Date;
  isOwn: boolean;
  isRead: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  showTail: boolean;
  showTimestamp: boolean;
  replyTo?: ReplyTo | null;
  reactions?: Reaction[];
  currentUserId: string;
  onReplyClick?: () => void;
  onReactionClick?: (emoji: string) => void;
}) {
  // Detect if this is an audio message
  const isAudio = !isDeleted && content.startsWith('[audio]') && content.endsWith('[/audio]');

  return (
    <div
      className={cn(
        'relative max-w-[75%] px-3 py-2 text-sm leading-relaxed break-words group',
        isOwn
          ? 'bg-[#005c4b] text-white rounded-[18px] rounded-br-[6px]'
          : 'bg-[var(--surface-sunken)] text-[var(--text-primary)] rounded-[18px] rounded-bl-[6px]',
        !showTimestamp && isOwn && 'rounded-br-[18px]',
        !showTimestamp && !isOwn && 'rounded-bl-[18px]',
        isDeleted && 'opacity-60',
      )}
    >
      {isDeleted ? (
        <p className="italic text-sm whitespace-pre-wrap">
          {isOwn
            ? 'Eliminaste este mensaje'
            : 'Este mensaje fue eliminado'}
        </p>
      ) : (
        <>
          {/* Reply quote */}
          {replyTo && (
            <button
              type="button"
              onClick={onReplyClick}
              className="flex items-start gap-1.5 mb-1.5 pl-2 border-l-2 border-current opacity-60 hover:opacity-80 transition-opacity text-left w-full"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {replyTo.senderName}
                </p>
                <p className="text-xs truncate">{replyTo.content}</p>
              </div>
            </button>
          )}

          {/* Content: Audio or Text */}
          {isAudio ? (
            <AudioPlayer content={content} isOwn={isOwn} />
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}

          {/* Reactions bar */}
          {reactions && reactions.length > 0 && (
            <div className={cn(
              'flex flex-wrap gap-0.5 mt-1 -mb-1',
            )}>
              {Array.from(
                reactions.reduce((acc, r) => {
                  const existing = acc.get(r.emoji) || { count: 0, hasMine: false };
                  acc.set(r.emoji, {
                    count: existing.count + 1,
                    hasMine: existing.hasMine || r.userId === currentUserId,
                  });
                  return acc;
                }, new Map<string, { count: number; hasMine: boolean }>()),
              ).map(([emoji, { count, hasMine }]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReactionClick?.(emoji)}
                  className={cn(
                    'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-all',
                    hasMine
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30'
                      : 'bg-[var(--surface)]/50 border-transparent hover:bg-[var(--surface)]',
                    isOwn ? 'text-white/80' : 'text-[var(--text-secondary)]',
                  )}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="font-medium">{count}</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {showTimestamp && (
        <span
          className={cn(
            'flex items-center justify-end gap-0.5 mt-1 text-[11px] leading-none select-none',
            isOwn ? 'text-white/60' : 'text-[var(--text-tertiary)]',
          )}
        >
          {!isDeleted && isEdited && editedAt && (
            <span className="mr-1 opacity-70">{formatRelativeTime(editedAt)}</span>
          )}
          {formatTime(time)}
          {!isDeleted && isOwn && <ReadReceipt isRead={isRead} />}
        </span>
      )}
      {/* Message tail */}
      {!isDeleted && showTail && (
        <span
          className={cn(
            'absolute bottom-0 w-2 h-2',
            isOwn ? 'right-[-4px]' : 'left-[-4px]',
          )}
          aria-hidden="true"
        >
          <svg
            width="8"
            height="13"
            viewBox="0 0 8 13"
            className={cn(
              'w-2 h-3',
              isOwn ? 'text-[#005c4b]' : 'text-[var(--surface-sunken)]',
            )}
          >
            {isOwn ? (
              <path
                d="M8 13C8 13 8 6.5 8 5.5C8 3 6 0 3 0C1.5 0 0 1.5 0 3L0 13L8 13Z"
                fill="currentColor"
              />
            ) : (
              <path
                d="M0 13C0 13 0 6.5 0 5.5C0 3 2 0 5 0C6.5 0 8 1.5 8 3L8 13L0 13Z"
                fill="currentColor"
              />
            )}
          </svg>
        </span>
      )}
    </div>
  );
}

function AudioPlayer({ content, isOwn }: { content: string; isOwn: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const match = content.match(/\[audio\](.*?)\[\/audio\]/);
  if (!match) return <p className="whitespace-pre-wrap">[Audio no disponible]</p>;

  const audioUrl = match[1];

  const handlePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  return (
    <div className="flex items-center gap-2 py-0.5">
      <button
        type="button"
        onClick={handlePlay}
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all',
          isOwn
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)]',
        )}
        aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
      >
        {isPlaying ? (
          <span className="flex gap-0.5 items-end h-4">
            <span className="w-0.5 bg-current rounded-full h-3 animate-pulse" />
            <span className="w-0.5 bg-current rounded-full h-4 animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-0.5 bg-current rounded-full h-2 animate-pulse" style={{ animationDelay: '300ms' }} />
          </span>
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>
      <div className="flex-1 h-1 rounded-full bg-current opacity-20 relative overflow-hidden">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
            isOwn ? 'bg-white/60' : 'bg-[var(--primary)]/60',
          )}
          style={{ width: isPlaying ? '60%' : '0%' }}
        />
      </div>
    </div>
  );
}

// ── Quick Reaction Bar ───────────────────────────────────────────

function QuickReactionBar({
  emojis,
  currentUserId,
  reactions,
  onReact,
  isOwn,
}: {
  emojis: string[];
  currentUserId: string;
  reactions?: Reaction[];
  onReact: (emoji: string) => void;
  isOwn: boolean;
}) {
  return (
    <div
      className={cn(
        'absolute bottom-full mb-1 hidden group-hover:flex items-center gap-0.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full px-1.5 py-1 shadow-lg z-20',
        isOwn ? 'right-0' : 'left-0',
      )}
    >
      {emojis.map((emoji) => {
        const hasReacted = reactions?.some(
          (r) => r.userId === currentUserId && r.emoji === emoji,
        );
        return (
          <button
            key={emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReact(emoji);
            }}
            className={cn(
              'w-7 h-7 flex items-center justify-center text-base rounded-full transition-all hover:scale-125 active:scale-90',
              hasReacted ? 'bg-[var(--primary)]/10 scale-110' : 'hover:bg-[var(--surface-sunken)]',
            )}
            aria-label={`Reaccionar con ${emoji}`}
          >
            {emoji}
          </button>
        );
      })}
      <div className="w-px h-4 bg-[var(--border)] mx-0.5" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="w-6 h-6 flex items-center justify-center text-sm rounded-full hover:bg-[var(--surface-sunken)] transition-all"
        aria-label="Más reacciones"
      >
        +
      </button>
    </div>
  );
}

function AvatarThumb({
  src,
  fallback,
}: {
  src: string | null | undefined;
  fallback: string;
}) {
  return (
    <Avatar className="w-7 h-7 flex-shrink-0">
      <AvatarImage src={src || undefined} />
      <AvatarFallback className="bg-[var(--surface-sunken)] text-[var(--text-secondary)] text-[10px]">
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export function ChatInterface({
  conversationId,
  currentUserId,
  participant,
  initialMessages,
}: ChatInterfaceProps) {
  const loadedInitialMessages = initialMessages ?? [];
  const [messages, setMessages] = useState<Message[]>(loadedInitialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    messageId: string;
  } | null>(null);
  const [confirmDeleteMessageId, setConfirmDeleteMessageId] = useState<string | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessageContent, setForwardMessageContent] = useState('');
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  const [conversations, setConversations] = useState<{
    id: string;
    participant: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
    lastMessageAt: Date;
  }[]>([]);
  const filteredConversations = conversations.filter(
    (c) =>
      c.id !== conversationId &&
      (c.participant.username.toLowerCase().includes(forwardSearchQuery.toLowerCase()) ||
        c.participant.displayName?.toLowerCase().includes(forwardSearchQuery.toLowerCase())),
  );
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [, setTick] = useState(0);

  // ── Reply state ────────────────────────────────────────────────────
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

  // ── Search state ───────────────────────────────────────────────────
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultIndex, setSearchResultIndex] = useState(0);

  // ── Voice recording state ─────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ── Block state ────────────────────────────────────────────────────
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);

  // ── Recording error ────────────────────────────────────────────────
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // ── Refresh relative times every 60s ───────────────────────────────

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const t = useT();
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const hasMessagesRef = useRef(messages.length > 0);

  // ── Derived state ──────────────────────────────────────────────────

  const groupedMessages = groupMessages(messages);

  // ── Auto-scroll ────────────────────────────────────────────────────

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // Auto-scroll when new messages arrive (only if not scrolled up)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && !isScrolledUp) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, isScrolledUp, scrollToBottom]);



  // ── Initial fetch: load messages when conversationId changes ──

  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    if (loadedInitialMessages.length > 0) return;

    let mounted = true;
    const loadingTimer = setTimeout(() => {
      if (mounted) setInitialLoading(true);
    }, 0);
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages?limit=50`);
        if (res.ok && mounted) {
          const data = await res.json();
          const msgs = data.messages || [];
          setMessages(msgs);
          hasMessagesRef.current = msgs.length > 0;
        }
      } catch { /* silent */ }
      if (mounted) setInitialLoading(false);
    })();

    return () => {
      mounted = false;
      clearTimeout(loadingTimer);
      setMessages([]);
      setNewMessage('');
      setReplyTo(null);
      setEditingMessageId(null);
      setContextMenu(null);
    };
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polling: fetch new messages every 5s ───────────────────────

  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const poll = async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages?limit=50`);
        if (!res.ok || !mounted) return;
        const data = await res.json();
        const serverMessages: Message[] = data.messages || [];

        setMessages((prev) => {
          const serverIds = new Set<string>(serverMessages.map((m) => m.id));
          const optimistic = prev.filter((m) => !serverIds.has(m.id));
          const merged = [...serverMessages, ...optimistic];
          merged.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          return merged;
        });
      } catch {
        // Silently fail — network issues or blocked conversation
      }
    };

    intervalId = setInterval(poll, 5000);

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        poll();
        intervalId = setInterval(poll, 5000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [conversationId]);

  // Keep hasMessagesRef in sync with messages
  useEffect(() => {
    hasMessagesRef.current = messages.length > 0;
  }, [messages.length]);

  // ── Block state sync from server ──────────────────────────────────

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (res.ok && mounted) {
          const data = await res.json();
          setIsBlocked(!!data.conversation?.isBlocked);
          setBlockedByMe(data.conversation?.blockedBy === currentUserId);
        }
      } catch { /* silent */ }
    })();
    return () => { mounted = false; };
  }, [conversationId, currentUserId]);

  // ── Scroll to search result ───────────────────────────────────────

  useEffect(() => {
    if (searchResults.length > 0 && searchResultIndex < searchResults.length) {
      const el = document.getElementById(`msg-${searchResults[searchResultIndex].id}`);
      if (el) {
        const scrollEl = scrollContainerRef.current;
    if (scrollEl) {
      const top = el.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop - scrollEl.clientHeight / 2 + el.clientHeight / 2;
      scrollEl.scrollTo({ top, behavior: 'smooth' });
    }
        // Highlight briefly
        el.classList.add('ring-2', 'ring-[var(--primary)]/40', 'rounded-xl');
        setTimeout(() => el.classList.remove('ring-2', 'ring-[var(--primary)]/40', 'rounded-xl'), 2000);
      }
    }
  }, [searchResultIndex, searchResults]);

  // ── Search messages ───────────────────────────────────────────────

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?search=${encodeURIComponent(query)}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.messages || []);
        setSearchResultIndex(0);
      }
    } catch {
      // Silently fail
    } finally {
      setIsSearching(false);
    }
  }, [conversationId]);

  // ── Debounced auto-search ─────────────────────────────────────────

  const handleSearchRef = useRef(handleSearch);
  useEffect(() => {
    handleSearchRef.current = handleSearch;
  }, [handleSearch]);

  useEffect(() => {
    if (!searchQuery.trim() || !isSearchOpen) {
      const timer = setTimeout(() => setSearchResults([]), 0);
      return () => clearTimeout(timer);
    }
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) handleSearchRef.current(searchQuery.trim());
    }, 300);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, isSearchOpen]);  

  // ── Click outside emoji picker ────────────────────────────────────

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    // Delay to avoid immediate close from the toggle button click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // ── Click outside context menu ────────────────────────────────────

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    const handleScroll = () => setContextMenu(null);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu]);

  // ── Scroll detection ──────────────────────────────────────────────

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const threshold = 150;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsScrolledUp(!isBottom);
  }, []);



  // ── Send message ───────────────────────────────────────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const tempId = crypto.randomUUID();
    const trimmed = newMessage.trim();

    const replyPayload = replyTo;
    setNewMessage('');
    setReplyTo(null);
    setIsLoading(true);

    const optimistic: Message = {
      id: tempId,
      content: trimmed,
      createdAt: new Date(),
      senderId: currentUserId,
      isRead: false,
      replyTo: replyPayload || undefined,
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          replyToId: replyPayload?.id || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to send');

      const { message } = await response.json();
      setMessages((prev) => prev.map((m) => (m.id === tempId ? message : m)));
      inputRef.current?.focus();
    } catch {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Report user ────────────────────────────────────────────────────

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedId: participant.id,
          reason: reportReason,
          type: 'USER',
        }),
      });
      if (response.ok) {
        setShowReportModal(false);
        setReportReason('');
      }
    } catch {
      // Silently fail
    }
  };

  // ── Insert emoji ───────────────────────────────────────────────────

  // ── Context menu handlers ─────────────────────────────────────────

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, messageId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, messageId });
    },
    [],
  );

  const handleEditMessage = useCallback((messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditContent(currentContent);
    setContextMenu(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditContent('');
  }, []);

  const handleSaveEdit = useCallback(
    async (messageId: string) => {
      if (!editContent.trim()) return;

      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages/${messageId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editContent.trim() }),
          },
        );

        if (!res.ok) throw new Error('Failed to edit');

        const { message } = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, content: message.content, isEdited: true, editedAt: message.editedAt }
              : m,
          ),
        );
        setEditingMessageId(null);
        setEditContent('');
      } catch {
        // Silently fail
      }
    },
    [editContent, conversationId],
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      setContextMenu(null);

      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages/${messageId}`,
          { method: 'DELETE' },
        );

        if (!res.ok) throw new Error('Failed to delete');

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, content: '', isDeleted: true } : m,
          ),
        );
      } catch {
        // Silently fail
      }
    },
    [conversationId],
  );

  // ── Forward message ────────────────────────────────────────────────

  const handleOpenForward = useCallback((messageId: string) => {
    setContextMenu(null);
    const msg = messages.find((m) => m.id === messageId);
    if (msg && !msg.isDeleted) {
      setForwardMessageContent(msg.content);
      setShowForwardModal(true);
    }
  }, [messages]);

  const handleFetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const res = await fetch('/api/conversations?limit=50');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // ── Fetch conversations when forward modal opens ─────────────────

  useEffect(() => {
    let mounted = true;
    if (showForwardModal) {
      const timer = setTimeout(() => {
        if (mounted) handleFetchConversations();
      }, 0);
      return () => {
        mounted = false;
        clearTimeout(timer);
      };
    }
    return () => { mounted = false; };
  }, [showForwardModal, handleFetchConversations]);

  const handleForwardToConversation = useCallback(
    async (targetConversationId: string) => {
      try {
        await fetch(`/api/conversations/${targetConversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: forwardMessageContent }),
        });
        setShowForwardModal(false);
        setForwardMessageContent('');
      } catch {
        // Silently fail
      }
    },
    [forwardMessageContent],
  );

  // ── Reactions ──────────────────────────────────────────────────────

  const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const msg = messages.find((m) => m.id === messageId);
    const existingReaction = msg?.reactions?.find(
      (r) => r.userId === currentUserId && r.emoji === emoji,
    );

    // ── Optimistic update (immediate, no waiting for socket) ───
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions || [];
        if (existingReaction) {
          return {
            ...m,
            reactions: reactions.filter(
              (r) => !(r.userId === currentUserId && r.emoji === emoji),
            ),
          };
        } else {
          if (reactions.some((r) => r.userId === currentUserId && r.emoji === emoji)) return m;
          return {
            ...m,
            reactions: [
              ...reactions,
              { id: crypto.randomUUID(), emoji, userId: currentUserId },
            ],
          };
        }
      }),
    );

    if (existingReaction) {
      try {
        await fetch(
          `/api/conversations/${conversationId}/messages/reactions?messageId=${messageId}&emoji=${encodeURIComponent(emoji)}`,
          { method: 'DELETE' },
        );
      } catch { /* silent */ }
    } else {
      try {
        await fetch(`/api/conversations/${conversationId}/messages/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, emoji }),
        });
      } catch { /* silent */ }
    }
  }, [conversationId, currentUserId, messages]);

  const QUICK_REACTIONS = ['👍', '❤️', '😄', '😮', '😢', '🙏'];

  // ── Voice recording ────────────────────────────────────────────────

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordingError(null);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado. Concede el permiso en la configuración del navegador.'
          : 'No se pudo acceder al micrófono.';
      setRecordingError(message);
      setTimeout(() => setRecordingError(null), 4000);
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  // ── Auto-stop recording at 5 min ──────────────────────────────────

  const prevRecordingRef = useRef({ isRecording: false, duration: 0 });

  useEffect(() => {
    if (isRecording && recordingDuration >= 300 && !prevRecordingRef.current.isRecording) {
      prevRecordingRef.current = { isRecording: true, duration: recordingDuration };
      handleStopRecording();
    }
  }, [recordingDuration, isRecording, handleStopRecording]);

  const handleCancelRecording = useCallback(() => {
    handleStopRecording();
    setAudioBlob(null);
    setRecordingDuration(0);
  }, [handleStopRecording]);

  const handleSendAudio = useCallback(async () => {
    if (!audioBlob) return;

    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const tempId = crypto.randomUUID();

      const optimistic: Message = {
        id: tempId,
        content: `[audio]${base64Audio}[/audio]`,
        createdAt: new Date(),
        senderId: currentUserId,
        isRead: false,
      };

      setMessages((prev) => [...prev, optimistic]);

      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `[audio]${base64Audio}[/audio]` }),
        });

        if (!response.ok) throw new Error('Failed to send');

        const { message } = await response.json();
        setMessages((prev) => prev.map((m) => (m.id === tempId ? message : m)));
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }

      setAudioBlob(null);
      setRecordingDuration(0);
    };
  }, [audioBlob, conversationId, currentUserId]);

  // ── Insert emoji ───────────────────────────────────────────────────

  const insertEmoji = useCallback((emoji: string) => {
    const input = inputRef.current;
    if (!input) {
      setNewMessage((prev) => prev + emoji);
      setShowEmojiPicker(false);
      return;
    }
    const start = input.selectionStart ?? newMessage.length;
    const end = input.selectionEnd ?? newMessage.length;
    const newVal = newMessage.slice(0, start) + emoji + newMessage.slice(end);
    setNewMessage(newVal);
    setShowEmojiPicker(false);
    // Restore cursor position after emoji
    requestAnimationFrame(() => {
      input.focus();
      const pos = start + emoji.length;
      input.setSelectionRange(pos, pos);
    });
  }, [newMessage]);

  // ── Auto-resize textarea (cross-browser, replaces fieldSizing:'content') ─

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [newMessage, autoResize]);

  // ── Keyboard shortcut ──────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      (e.currentTarget as HTMLTextAreaElement).form?.requestSubmit();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10 ring-2 ring-[var(--border)]">
              <AvatarImage src={participant.avatarUrl || undefined} />
              <AvatarFallback className="bg-[var(--surface-sunken)] text-[var(--text-primary)]">
                {participant.displayName?.[0] || participant.username[0]}
              </AvatarFallback>
            </Avatar>

          </div>
          <Link href={`/user/${participant.username}`} className="min-w-0 hover:opacity-80 transition-opacity">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm truncate">
              {participant.displayName || participant.username}
            </h3>
            <p className="text-[11px] text-[var(--text-tertiary)] truncate">
              @{participant.username}
            </p>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {/* Search toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsSearchOpen((prev) => !prev);
              setSearchQuery('');
              setSearchResults([]);
            }}
            aria-label="Buscar en conversación"
            className={cn('w-9 h-9 rounded-full hover:bg-[var(--surface-sunken)]', isSearchOpen && 'bg-[var(--primary)]/10 text-[var(--primary)]')}
          >
            <Search className="w-4 h-4" />
          </Button>
          {/* Block/Unblock */}
          <Button
            variant="ghost"
            size="icon"
            disabled={isBlocked && !blockedByMe}
            onClick={async () => {
              try {
                const res = await fetch(`/api/conversations/${conversationId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(blockedByMe ? { unblock: true } : { block: true }),
                });
                if (res.ok) {
                  setBlockedByMe(!blockedByMe);
                  setIsBlocked(!blockedByMe);
                }
              } catch { /* silent */ }
            }}
            aria-label={blockedByMe ? 'Desbloquear usuario' : isBlocked ? 'Te han bloqueado' : 'Bloquear usuario'}
            className={cn(
              'w-9 h-9 rounded-full hover:bg-[var(--surface-sunken)] transition-colors',
              blockedByMe && 'text-[var(--error)]',
              isBlocked && !blockedByMe && 'opacity-40 cursor-not-allowed',
            )}
            title={isBlocked && !blockedByMe ? `${participant.displayName || participant.username} te ha bloqueado` : undefined}
          >
            <ShieldOff className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReportModal(true)}
            aria-label="Reportar usuario"
            className="w-9 h-9 rounded-full hover:bg-[var(--surface-sunken)]"
          >
            <Flag className="w-4 h-4 text-[var(--text-tertiary)]" />
          </Button>
        </div>
      </div>

      {/* ── Search bar (collapsible) ───────────────────────────── */}
      {isSearchOpen && (
        <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                    setSearchResults([]);
                  }
                }}
                placeholder="Buscar mensajes..."
                autoFocus
                className="w-full pl-9 pr-10 py-2 text-sm bg-[var(--surface-sunken)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition-all"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {searchResults.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                <span>{searchResultIndex + 1} de {searchResults.length}</span>
                <button
                  type="button"
                  onClick={() => setSearchResultIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1 hover:bg-[var(--surface-sunken)] rounded-lg transition-colors"
                  aria-label="Resultado anterior"
                >
                  <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                </button>
                <button
                  type="button"
                  onClick={() => setSearchResultIndex((prev) => Math.min(searchResults.length - 1, prev + 1))}
                  className="p-1 hover:bg-[var(--surface-sunken)] rounded-lg transition-colors"
                  aria-label="Siguiente resultado"
                >
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}



      {/* ── Messages area ─────────────────────────────────────── */}
      <div className="flex-1 relative">
        <ScrollArea
          ref={scrollContainerRef}
          className="h-full px-4 py-3"
          onScroll={handleScroll}
        >
          {initialLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center mb-4">
                <Send className="w-7 h-7 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                {participant.displayName || participant.username}
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] max-w-xs">
                Envía un mensaje para iniciar la conversación. Tus mensajes están cifrados de extremo a extremo.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {(() => {
                let lastDate: Date | null = null;
                const elements: React.ReactNode[] = [];
                let elementIndex = 0;

                for (const group of groupedMessages) {
                  const isOwn = group.senderId === currentUserId;

                  for (let i = 0; i < group.messages.length; i++) {
                    const msg = group.messages[i];
                    const msgDate = new Date(msg.createdAt);
                    const isFirstInGroup = i === 0;
                    const isLastInGroup = i === group.messages.length - 1;
                    const showDate = shouldShowDateSeparator(msgDate, lastDate);

                    if (showDate) {
                      elements.push(
                        <DateSeparator key={`date-${elementIndex++}`} date={msgDate} />,
                      );
                    }

                    const isEditing = editingMessageId === msg.id;

                    elements.push(
                      <div
                        id={`msg-${msg.id}`}
                        key={msg.id}
                        className={cn(
                          'flex items-end gap-1.5',
                          isOwn ? 'justify-end' : 'justify-start',
                          isFirstInGroup && isOwn && 'mt-0.5',
                          isFirstInGroup && !isOwn && 'mt-0.5',
                        )}
                      >
                        {/* Other user's avatar on last message of group */}
                        {!isOwn && isLastInGroup ? (
                          <AvatarThumb
                            src={participant.avatarUrl}
                            fallback={participant.displayName?.[0] || participant.username[0]}
                          />
                        ) : !isOwn ? (
                          <div className="w-7" /> /* spacer */
                        ) : null}

                        {isEditing ? (
                          // ── Inline edit ────────────────────────────
                          <div className="flex flex-col gap-1.5 max-w-[75%]">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(msg.id);
                                }
                                if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              className="w-full bg-[var(--surface-elevated)] border border-[var(--primary)]/50 rounded-2xl px-3 py-2 text-sm text-[var(--text-primary)] resize-none outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                              rows={2}
                              maxLength={500}
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--surface-sunken)] transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(msg.id)}
                                disabled={!editContent.trim()}
                                className="text-xs font-medium bg-[var(--primary)] text-white px-3 py-1 rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onContextMenu={
                              isOwn && !msg.isDeleted
                                ? (e) => handleContextMenu(e, msg.id)
                                : undefined
                            }
                            className={cn(
                              isOwn && !msg.isDeleted && 'cursor-context-menu',
                            )}
                          >
                            <div className="relative group/message">
                              <MessageBubble
                                content={msg.content}
                                time={msgDate}
                                isOwn={isOwn}
                                isRead={msg.isRead}
                                isEdited={msg.isEdited}
                                editedAt={msg.editedAt ? new Date(msg.editedAt) : undefined}
                                isDeleted={msg.isDeleted}
                                showTail={isLastInGroup}
                                showTimestamp={isLastInGroup}
                                replyTo={msg.replyTo}
                                reactions={msg.reactions}
                                currentUserId={currentUserId}
                                onReplyClick={() => {
                                  if (msg.replyTo) {
                                    // Scroll to replied message
                                    const el = document.getElementById(`msg-${msg.replyTo!.id}`);
                                    const scrollEl = scrollContainerRef.current;
                                    if (scrollEl && el) {
                                      const top = el.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop - scrollEl.clientHeight / 2 + el.clientHeight / 2;
                                      scrollEl.scrollTo({ top, behavior: 'smooth' });
                                    }
                                  }
                                }}
                                onReactionClick={(emoji) => handleToggleReaction(msg.id, emoji)}
                              />
                              {/* Quick reaction bar on hover */}
                              {!msg.isDeleted && !isEditing && (
                                <QuickReactionBar
                                  emojis={QUICK_REACTIONS}
                                  currentUserId={currentUserId}
                                  reactions={msg.reactions}
                                  onReact={(emoji) => handleToggleReaction(msg.id, emoji)}
                                  isOwn={isOwn}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>,
                    );

                    lastDate = msgDate;
                  }
                }

                return elements;
              })()}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* ── Scroll to bottom button ─────────────────────────── */}
        {isScrolledUp && messages.length > 0 && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-[var(--primary)] text-white shadow-lg flex items-center justify-center hover:bg-[var(--primary-hover)] transition-all duration-200 animate-in zoom-in-50 z-10"
            aria-label="Ir al último mensaje"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Reply preview ────────────────────────────────────────── */}
      {replyTo && (
        <div className="px-3 pt-2 pb-0 border-t border-[var(--border)] bg-[var(--surface-elevated)]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 pl-3 pr-2 py-2 bg-[var(--surface-sunken)] rounded-t-xl border-l-2 border-[var(--primary)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--primary)] truncate">
                {replyTo.senderId === currentUserId ? 'Tú' : replyTo.senderName}
              </p>
              <p className="text-sm text-[var(--text-tertiary)] truncate">
                {replyTo.content}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
              aria-label="Cancelar respuesta"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Recording error feedback ────────────────────────────── */}
      {recordingError && (
        <div className="px-3 py-1.5 bg-[var(--error)]/10 border-t border-[var(--error)]/20">
          <p className="text-xs text-[var(--error)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--error)] animate-pulse" />
            {recordingError}
          </p>
        </div>
      )}

      {/* ── Audio preview ────────────────────────────────────────── */}
      {audioBlob && (
        <div className="px-3 pt-2 pb-0 border-t border-[var(--border)] bg-[var(--surface-elevated)]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 pl-3 pr-2 py-2 bg-[var(--surface-sunken)] rounded-t-xl">
            <button
              type="button"
              onClick={() => {
                const url = URL.createObjectURL(audioBlob);
                const audio = new Audio(url);
                audio.play();
              }}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:bg-[var(--primary-hover)] transition-colors"
              aria-label="Reproducir audio"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <span className="text-sm text-[var(--text-primary)] font-medium">
              Audio ({recordingDuration}s)
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => handleSendAudio()}
              className="flex-shrink-0 px-3 py-1 rounded-full bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              Enviar
            </button>
            <button
              type="button"
              onClick={handleCancelRecording}
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Cancelar audio"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Input area ─────────────────────────────────────────── */}
      <form
        onSubmit={handleSend}
        className="px-3 py-3 border-t border-[var(--border)] bg-[var(--surface)]"
      >
        <div className="flex items-end gap-2 bg-[var(--surface-sunken)] rounded-2xl px-3 py-1.5 border border-[var(--border)] focus-within:border-[var(--primary)]/40 focus-within:ring-1 focus-within:ring-[var(--primary)]/20 transition-all duration-200">
          {/* Voice / Microphone button */}
          {isRecording ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleStopRecording}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--error)] text-white hover:bg-red-600 transition-colors animate-pulse"
                aria-label="Detener grabación"
              >
                <Square className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-[var(--error)] min-w-[40px]">
                {String(Math.floor(recordingDuration / 60)).padStart(2, '0')}:{String(recordingDuration % 60).padStart(2, '0')}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartRecording}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
              aria-label="Grabar audio"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder') || 'Escribe un mensaje...'}
            rows={1}
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none resize-none py-1.5 max-h-[120px] scrollbar-thin"
            style={{ minHeight: '36px' }}
          />

          {/* Emoji button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                showEmojiPicker
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]',
              )}
              aria-label="Añadir emoji"
              aria-expanded={showEmojiPicker}
              aria-haspopup="grid"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Emoji picker popover */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full right-0 mb-2 w-[280px] max-h-[300px] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 p-3 z-50"
                role="listbox"
                aria-label="Selector de emojis"
              >
                {EMOJI_CATEGORIES.map((category) => (
                  <div key={category.name} className="mb-2 last:mb-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5 px-0.5">
                      {category.name}
                    </p>
                    <div className="grid grid-cols-8 gap-0.5">
                      {category.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="aspect-square flex items-center justify-center text-lg hover:bg-[var(--surface-sunken)] rounded-lg transition-colors active:scale-90"
                          role="option"
                          aria-label={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className={cn(
              'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200',
              newMessage.trim() && !isLoading
                ? 'bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)] active:scale-95'
                : 'bg-[var(--surface-elevated)] text-[var(--text-tertiary)]',
            )}
            aria-label="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* ── Context menu (right-click) ─────────────────────────── */}
      {contextMenu && (
        <div
          className="fixed z-[100] min-w-[160px] bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-xl shadow-black/15 dark:shadow-black/30 py-1 animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${Math.min(contextMenu.x, window.innerWidth - 180)}px`,
            top: `${Math.min(contextMenu.y, window.innerHeight - 120)}px`,
          }}
          role="menu"
          aria-label="Opciones del mensaje"
        >
          <button
            type="button"
            onClick={() => {
              const msg = messages.find((m) => m.id === contextMenu.messageId);
              if (msg && !msg.isDeleted) {
                setReplyTo({
                  id: msg.id,
                  content: msg.content,
                  senderId: msg.senderId,
                  senderName: msg.senderId === currentUserId ? 'Tú' : (participant.displayName || participant.username),
                });
              }
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors"
            role="menuitem"
          >
            <ReplyIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
            Responder
          </button>
          <button
            type="button"
            onClick={() => {
              const msg = messages.find((m) => m.id === contextMenu.messageId);
              if (msg) handleEditMessage(msg.id, msg.content);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors"
            role="menuitem"
          >
            <Pencil className="w-4 h-4 text-[var(--text-tertiary)]" />
            Editar mensaje
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmDeleteMessageId(contextMenu.messageId);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
            role="menuitem"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar mensaje
          </button>
          <hr className="border-t border-[var(--border)]/50 mx-2" />
          <button
            type="button"
            onClick={() => handleOpenForward(contextMenu.messageId)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors"
            role="menuitem"
          >
            <Forward className="w-4 h-4 text-[var(--text-tertiary)]" />
            Reenviar mensaje
          </button>
        </div>
      )}

      {/* ── Confirm delete modal ──────────────────────────────── */}
      <AccessibleModal
        isOpen={!!confirmDeleteMessageId}
        onClose={() => setConfirmDeleteMessageId(null)}
        title="Eliminar mensaje"
        description="¿Estás seguro de que quieres eliminar este mensaje? Esta acción no se puede deshacer."
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setConfirmDeleteMessageId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (confirmDeleteMessageId) {
                  handleDeleteMessage(confirmDeleteMessageId);
                  setConfirmDeleteMessageId(null);
                }
              }}
              variant="destructive"
            >
              Eliminar
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          El mensaje se marcará como eliminado para todos los participantes de la conversación.
        </p>
      </AccessibleModal>

      {/* ── Forward message modal ──────────────────────────────── */}
      <AccessibleModal
        isOpen={showForwardModal}          onClose={() => {
          setShowForwardModal(false);
          setForwardMessageContent('');
          setForwardSearchQuery('');
          setConversations([]);
        }}
        title="Reenviar mensaje"
        description="Selecciona una conversación para reenviar este mensaje."
        size="lg"
      >
        {isLoadingConversations ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--text-tertiary)]">
              No tienes otras conversaciones activas.
            </p>
          </div>
        ) : (
          <>
            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={forwardSearchQuery}
                onChange={(e) => setForwardSearchQuery(e.target.value)}
                placeholder="Buscar por nombre de usuario..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--surface-sunken)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/40 transition-all"
              />
            </div>
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--text-tertiary)]">
                  {conversations.length <= 1
                    ? 'No tienes otras conversaciones activas.'
                    : `No se encontraron conversaciones para "${forwardSearchQuery}".`}
                </p>
              </div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto -mx-2">
                <div className="space-y-0.5">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => handleForwardToConversation(conv.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--surface-sunken)] transition-colors text-left"
                    >
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={conv.participant.avatarUrl || undefined} />
                        <AvatarFallback className="bg-[var(--surface-sunken)] text-[var(--text-secondary)] text-sm">
                          {conv.participant.displayName?.[0] || conv.participant.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {conv.participant.displayName || conv.participant.username}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] truncate">
                          @{conv.participant.username}
                        </p>
                      </div>
                      <Forward className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </AccessibleModal>

      {/* ── Report modal ───────────────────────────────────────── */}
      <AccessibleModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Reportar usuario"
        description={`¿Por qué quieres reportar a ${participant.username}?`}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason.trim()}
              variant="destructive"
            >
              Reportar
            </Button>
          </div>
        }
      >
        <textarea
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          placeholder="Describe el motivo del reporte..."
          className="w-full h-32 p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
          maxLength={500}
        />
      </AccessibleModal>
    </div>
  );
}
