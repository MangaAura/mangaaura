'use client';

import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Send,
  Smile,
  ChevronDown,
  Pencil,
  Trash2,
  Reply as ReplyIcon,
  X,
  Users,
  Search,
  Volume2,
  Square,
  Mic,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useSocket } from '@/hooks/useSocket';
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
  clanId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  createdAt: Date | string;
  isEdited?: boolean;
  editedAt?: Date | string;
  isDeleted?: boolean;
  replyTo?: ReplyTo | null;
  reactions?: Reaction[];
}

interface ClanInfo {
  id: string;
  name: string;
  emblemUrl: string | null;
  description: string | null;
  memberCount: number;
}

interface ClanChatInterfaceProps {
  clanId: string;
  currentUserId: string;
  clan: ClanInfo;
  currentUserRole: string;
  initialMessages: Message[];
}

// ─── Emoji categories ────────────────────────────────────────────────

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'Smileys',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
      '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
    ],
  },
  {
    name: 'Gestos',
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌',
      '👐', '🤲', '🤝', '🙏', '✌️', '🤟', '🤘', '👌',
      '✋', '🤚', '💪', '💅', '👀',
    ],
  },
  {
    name: 'Corazones',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '❣️', '💔', '💌', '✨', '⭐',
    ],
  },
  {
    name: 'Manga',
    emojis: [
      '📚', '🎨', '🗾', '⚔️', '🛡️', '👹', '👺', '🎭',
      '🌸', '🍜', '🏯', '⛩️', '🎴', '📖', '✏️', '🖋️',
      '🔥', '💯', '👑', '🌟', '💥', '🌀',
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

function shouldShowDateSeparator(current: Date, previous: Date | null): boolean {
  if (!previous) return true;
  return !isSameDay(current, previous);
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

function MessageBubble({
  content,
  time,
  isOwn,
  isEdited,
  editedAt,
  isDeleted,
  senderName,
  senderAvatar,
  showSender,
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
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  senderName: string;
  senderAvatar: string | null;
  showSender: boolean;
  showTimestamp: boolean;
  replyTo?: ReplyTo | null;
  reactions?: Reaction[];
  currentUserId: string;
  onReplyClick?: () => void;
  onReactionClick?: (emoji: string) => void;
}) {
  return (
    <div className={cn('flex items-start gap-2 group', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar column */}
      {!isOwn && showSender ? (
        <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
          <AvatarImage src={senderAvatar || undefined} />
          <AvatarFallback className="bg-[var(--primary)]/20 text-[var(--primary)] text-xs">
            {senderName[0]}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      <div className={cn('max-w-[70%]', isOwn && 'items-end flex flex-col')}>
        {/* Sender name (only for others, first message in group) */}
        {!isOwn && showSender && (
          <p className="text-xs font-semibold text-[var(--primary)] mb-0.5 ml-1">
            {senderName}
          </p>
        )}

        <div
          className={cn(
            'relative px-3 py-2 text-sm leading-relaxed break-words',
            isOwn
              ? 'bg-[#005c4b] text-white rounded-[18px] rounded-br-[6px]'
              : 'bg-[var(--surface-sunken)] text-[var(--text-primary)] rounded-[18px] rounded-bl-[6px]',
            isDeleted && 'opacity-60',
          )}
        >
          {isDeleted ? (
            <p className="italic text-sm whitespace-pre-wrap">
              {isOwn ? 'Eliminaste este mensaje' : 'Este mensaje fue eliminado'}
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
                    <p className="text-xs font-semibold truncate">{replyTo.senderName}</p>
                    <p className="text-xs truncate">{replyTo.content}</p>
                  </div>
                </button>
              )}

              <p className="whitespace-pre-wrap">{content}</p>

              {/* Reactions bar */}
              {reactions && reactions.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1 -mb-1">
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
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export function ClanChatInterface({
  clanId,
  currentUserId,
  clan,
  currentUserRole,
  initialMessages = [],
}: ClanChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    messageId: string;
  } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultIndex, setSearchResultIndex] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  // Reply state
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMessageCountRef = useRef(messages.length);

  const { isConnected, emit, on, joinRoom, leaveRoom } = useSocket();

  // ── Join clan room ────────────────────────────────────────────────

  useEffect(() => {
    if (!isConnected) return;
    joinRoom(`clan:${clanId}`);
    return () => leaveRoom(`clan:${clanId}`);
  }, [isConnected, clanId, joinRoom, leaveRoom]);

  // ── Socket: listen for new messages ──────────────────────────────

  useEffect(() => {
    if (!on) return;
    const cleanup = on('clan:message', (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return cleanup;
  }, [on]);

  // ── Socket: listen for message edits ─────────────────────────────

  useEffect(() => {
    if (!on) return;
    const cleanup = on('clan:message-edited', (data: { id: string; clanId: string; content: string; editedAt: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.id
            ? { ...m, content: data.content, isEdited: true, editedAt: data.editedAt }
            : m,
        ),
      );
    });
    return cleanup;
  }, [on]);

  // ── Socket: listen for message deletions ─────────────────────────

  useEffect(() => {
    if (!on) return;
    const cleanup = on('clan:message-deleted', (data: { id: string; clanId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.id ? { ...m, content: '', isDeleted: true } : m,
        ),
      );
    });
    return cleanup;
  }, [on]);

  // ── Socket: listen for reactions ─────────────────────────────────

  useEffect(() => {
    if (!on) return;
    const cleanup = on('clan:reaction', (data: { messageId: string; clanId: string; emoji: string; userId: string; action: 'add' | 'remove' }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m;
          const reactions = m.reactions || [];
          if (data.action === 'add') {
            if (reactions.some((r) => r.userId === data.userId && r.emoji === data.emoji)) return m;
            return {
              ...m,
              reactions: [...reactions, { id: crypto.randomUUID(), emoji: data.emoji, userId: data.userId }],
            };
          } else {
            return {
              ...m,
              reactions: reactions.filter(
                (r) => !(r.userId === data.userId && r.emoji === data.emoji),
              ),
            };
          }
        }),
      );
    });
    return cleanup;
  }, [on]);

  // ── Socket: listen for typing ────────────────────────────────────

  useEffect(() => {
    if (!on) return;
    const cleanup = on('clan:typing-update', (data: { clanId: string; userId: string; username: string; isTyping: boolean }) => {
      if (data.userId === currentUserId) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (data.isTyping) {
          next.set(data.userId, data.username);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });
    return cleanup;
  }, [on, currentUserId]);

  // ── Auto-scroll ──────────────────────────────────────────────────

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && !isScrolledUp) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, isScrolledUp, scrollToBottom]);

  // ── Scroll detection ─────────────────────────────────────────────

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const threshold = 150;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsScrolledUp(!isBottom);
  }, []);

  // ── Typing indicator ─────────────────────────────────────────────

  const emitTyping = useCallback(() => {
    emit('clan:typing', { clanId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emit('clan:typing', { clanId, isTyping: false });
    }, 1500);
  }, [emit, clanId]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emit('clan:typing', { clanId, isTyping: false });
  }, [emit, clanId]);

  // ── Send message ─────────────────────────────────────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const tempId = crypto.randomUUID();
    const trimmed = newMessage.trim();
    const replyPayload = replyTo;

    setNewMessage('');
    setReplyTo(null);
    stopTyping();
    setIsLoading(true);

    const optimistic: Message = {
      id: tempId,
      content: trimmed,
      clanId,
      senderId: currentUserId,
      senderName: '',
      senderAvatar: null,
      createdAt: new Date(),
      replyTo: replyPayload || undefined,
    };

    setMessages((prev) => [...prev, optimistic]);

    try {
      const response = await fetch(`/api/clans/${clanId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          replyToId: replyPayload?.id || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to send');

      const { message } = await response.json();
      setMessages((prev) => prev.map((m) =>
        m.id === tempId
          ? {
              ...message,
              senderName: message.sender?.displayName || message.sender?.username || '',
              senderAvatar: message.sender?.avatarUrl || null,
            }
          : m,
      ));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Edit message ─────────────────────────────────────────────────

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
        const res = await fetch(`/api/clans/${clanId}/chat/${messageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editContent.trim() }),
        });

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
    [editContent, clanId],
  );

  // ── Delete message ───────────────────────────────────────────────

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      setContextMenu(null);

      try {
        const res = await fetch(`/api/clans/${clanId}/chat/${messageId}`, {
          method: 'DELETE',
        });

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
    [clanId],
  );

  // ── Reactions ────────────────────────────────────────────────────

  const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const msg = messages.find((m) => m.id === messageId);
    const existingReaction = msg?.reactions?.find(
      (r) => r.userId === currentUserId && r.emoji === emoji,
    );

    // Optimistic update
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
          `/api/clans/${clanId}/chat/reactions?messageId=${messageId}&emoji=${encodeURIComponent(emoji)}`,
          { method: 'DELETE' },
        );
      } catch { /* silent */ }
    } else {
      try {
        await fetch(`/api/clans/${clanId}/chat/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, emoji }),
        });
      } catch { /* silent */ }
    }
  }, [clanId, currentUserId, messages]);

  // ── Search messages ──────────────────────────────────────────────

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/clans/${clanId}/chat?search=${encodeURIComponent(query)}&limit=50`);
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
  }, [clanId]);

  // ── Debounced search ────────────────────────────────────────────

  useEffect(() => {
    if (!searchQuery.trim() || !isSearchOpen) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => handleSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isSearchOpen, handleSearch]);

  // ── Scroll to search result ─────────────────────────────────────

  useEffect(() => {
    if (searchResults.length > 0 && searchResultIndex < searchResults.length) {
      const el = document.getElementById(`msg-${searchResults[searchResultIndex].id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-[var(--primary)]/40', 'rounded-xl');
        setTimeout(() => el.classList.remove('ring-2', 'ring-[var(--primary)]/40', 'rounded-xl'), 2000);
      }
    }
  }, [searchResultIndex, searchResults]);

  // ── Click outside emoji picker ──────────────────────────────────

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // ── Click outside context menu ──────────────────────────────────

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

  // ── Voice recording ──────────────────────────────────────────────

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
          ? 'Permiso de micrófono denegado.'
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

  const handleCancelRecording = useCallback(() => {
    handleStopRecording();
    setAudioBlob(null);
    setRecordingDuration(0);
  }, [handleStopRecording]);

  const handleSendAudio = useCallback(async () => {
    if (!audioBlob) return;

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const tempId = crypto.randomUUID();

      const optimistic: Message = {
        id: tempId,
        content: `[audio]${base64Audio}[/audio]`,
        clanId,
        senderId: currentUserId,
        senderName: '',
        senderAvatar: null,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, optimistic]);

      try {
        const response = await fetch(`/api/clans/${clanId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `[audio]${base64Audio}[/audio]` }),
        });

        if (!response.ok) throw new Error('Failed to send');

        const { message } = await response.json();
        setMessages((prev) => prev.map((m) =>
          m.id === tempId
            ? {
                ...message,
                senderName: message.sender?.displayName || message.sender?.username || '',
                senderAvatar: message.sender?.avatarUrl || null,
              }
            : m,
        ));
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }

      setAudioBlob(null);
      setRecordingDuration(0);
    };
  }, [audioBlob, clanId, currentUserId]);

  // ── Insert emoji ─────────────────────────────────────────────────

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
    requestAnimationFrame(() => {
      input.focus();
      const pos = start + emoji.length;
      input.setSelectionRange(pos, pos);
    });
  }, [newMessage]);

  // ── Keyboard shortcut ────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // ── Context menu handler ─────────────────────────────────────────

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, messageId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, messageId });
    },
    [],
  );

  // ── Group messages for display ───────────────────────────────────

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

  const groupedMessages = groupMessages(messages);

  // ── Typing text ──────────────────────────────────────────────────

  const typingText = (() => {
    if (typingUsers.size === 0) return null;
    const names = Array.from(typingUsers.values());
    if (names.length === 1) return `${names[0]} está escribiendo...`;
    if (names.length === 2) return `${names[0]} y ${names[1]} están escribiendo...`;
    return `${names[0]} y ${names.length - 1} más están escribiendo...`;
  })();

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--surface)] via-[var(--primary)]/5 to-[var(--surface)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)]/30 to-[var(--accent-purple)]/30 flex items-center justify-center flex-shrink-0 ring-2 ring-[var(--primary)]/20">
            {clan.emblemUrl ? (
              <img src={clan.emblemUrl} alt={clan.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <Users className="w-5 h-5 text-[var(--primary)]" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm truncate flex items-center gap-1.5">
              <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Clan
              </span>
              {clan.name}
            </h3>
            <p className="text-[11px] text-[var(--text-tertiary)] truncate flex items-center gap-1">
              <Users className="w-3 h-3" />
              {clan.memberCount} miembros
              {currentUserRole && (
                <>
                  <span className="mx-1">·</span>
                  <span className="capitalize">{currentUserRole.toLowerCase()}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsSearchOpen((prev) => !prev);
              setSearchQuery('');
              setSearchResults([]);
            }}
            aria-label="Buscar en el chat del clan"
            className={cn('w-9 h-9 rounded-full hover:bg-[var(--surface-sunken)]', isSearchOpen && 'bg-[var(--primary)]/10 text-[var(--primary)]')}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Search bar ──────────────────────────────────────────── */}
      {isSearchOpen && (
        <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* ── Typing indicator ────────────────────────────────────── */}
      {typingText && (
        <div className="px-4 py-1.5 bg-[var(--surface)] border-b border-[var(--border)]/50">
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }} />
              <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.2s' }} />
              <span className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.2s' }} />
            </div>
            <span>{typingText}</span>
          </div>
        </div>
      )}

      {/* ── Messages area ───────────────────────────────────────── */}
      <div className="flex-1 relative">
        <ScrollArea className="h-full px-4 py-3" onScroll={handleScroll}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-[var(--primary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Chat de {clan.name}
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] max-w-xs">
                Este es el chat exclusivo para miembros del clan. Coordina con tu equipo, comparte mangas y planea estrategias.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
                        onContextMenu={
                          !msg.isDeleted && (isOwn || currentUserRole === 'LEADER' || currentUserRole === 'OFFICER')
                            ? (e) => handleContextMenu(e, msg.id)
                            : undefined
                        }
                        className={cn(
                          'group flex items-start',
                          !msg.isDeleted && (isOwn || currentUserRole === 'LEADER' || currentUserRole === 'OFFICER') && 'cursor-context-menu',
                        )}
                      >
                        <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5 max-w-[75%] mx-auto">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(msg.id);
                                }
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="w-full bg-[var(--surface-elevated)] border border-[var(--primary)]/50 rounded-2xl px-3 py-2 text-sm text-[var(--text-primary)] resize-none outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                              rows={2}
                              maxLength={2000}
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
                          <MessageBubble
                            content={msg.content}
                            time={msgDate}
                            isOwn={isOwn}
                            isEdited={msg.isEdited}
                            editedAt={msg.editedAt ? new Date(msg.editedAt) : undefined}
                            isDeleted={msg.isDeleted}
                            senderName={msg.senderName}
                            senderAvatar={msg.senderAvatar}
                            showSender={isFirstInGroup}
                            showTimestamp={isLastInGroup}
                            replyTo={msg.replyTo}
                            reactions={msg.reactions}
                            currentUserId={currentUserId}
                            onReplyClick={() => {
                              if (msg.replyTo) {
                                const el = document.getElementById(`msg-${msg.replyTo.id}`);
                                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            onReactionClick={(emoji) => handleToggleReaction(msg.id, emoji)}
                          />
                        )}
                        </div>

                        {/* Visible delete button for moderators on other users' messages */}
                        {!isOwn && !msg.isDeleted && !isEditing && (currentUserRole === 'LEADER' || currentUserRole === 'OFFICER') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(msg.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-150 self-start mt-1.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10"
                            aria-label="Eliminar este mensaje"
                            title="Eliminar mensaje"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

        {/* Scroll to bottom button */}
        {isScrolledUp && messages.length > 0 && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-[var(--primary)] text-white shadow-lg flex items-center justify-center hover:bg-[var(--primary-hover)] transition-all duration-200 z-10"
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
                {replyTo.senderName}
              </p>
              <p className="text-sm text-[var(--text-tertiary)] truncate">{replyTo.content}</p>
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

      {/* ── Recording error ──────────────────────────────────────── */}
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
              onClick={handleSendAudio}
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
      <form onSubmit={handleSend} className="px-3 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-end gap-2 bg-[var(--surface-sunken)] rounded-2xl px-3 py-1.5 border border-[var(--border)] focus-within:border-[var(--primary)]/40 focus-within:ring-1 focus-within:ring-[var(--primary)]/20 transition-all duration-200">
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
                {String(Math.floor(recordingDuration / 60)).padStart(2, '0')}:
                {String(recordingDuration % 60).padStart(2, '0')}
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

          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (e.target.value) emitTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje en el clan..."
            rows={1}
            disabled={isLoading}
            maxLength={2000}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none resize-none py-1.5 max-h-[120px] scrollbar-thin"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />

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
            >
              <Smile className="w-5 h-5" />
            </button>

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

      {/* ── Context menu ────────────────────────────────────────── */}
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
                  senderName: msg.senderName || 'Usuario',
                });
              }
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors"
            role="menuitem"
          >
            <ReplyIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
            Responder
          </button>                        {(() => {
                              const ctxMsg = messages.find((m) => m.id === contextMenu.messageId);
                              return ctxMsg?.senderId === currentUserId ? (
                                <button
                                  type="button"
                                  onClick={() => handleEditMessage(ctxMsg.id, ctxMsg.content)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors"
                                  role="menuitem"
                                >
                                  <Pencil className="w-4 h-4 text-[var(--text-tertiary)]" />
                                  Editar mensaje
                                </button>
                              ) : null;
                            })()}
          <button
            type="button"
            onClick={() => {
              handleDeleteMessage(contextMenu.messageId);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
            role="menuitem"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar mensaje
          </button>
        </div>
      )}
    </div>
  );
}
