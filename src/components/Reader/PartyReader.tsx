/**
 * PartyReader Component
 *
 * Componente de lectura en grupo con chat en tiempo real,
 * sincronizacion de pagina y reacciones.
 */

'use client';

import {
  Users,
  Send,
  Smile,
  ArrowLeft,

  Eye,
  Zap,
  Crown,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Wifi,
  WifiOff,
  UserPlus,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { useToast } from '@/components/ui/Toast';
import { useParty } from '@/hooks/useParty';

// Reacciones rapidas
const QUICK_REACTIONS = ['🔥', '❤️', '😂', '😮', '👏', '😱', '🤩', '👀'];

interface PartyReaderProps {
  partyId: string;
  pages: string[];
  mangaId: string;
  chapterId: string;
  chapterNumber: number;
  mangaTitle: string;
  onChapterEnd?: () => void;
}

export default function PartyReader({
  partyId,
  pages,
  mangaId,
  chapterNumber,
  mangaTitle,
}: PartyReaderProps) {
  const { toast } = useToast();
  const [chatMessage, setChatMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [localPage, setLocalPage] = useState(1);
  const [followHost, setFollowHost] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    members,
    messages,
    currentPage: hostPage,
    isHost,
    typingUsers,
    reactions,
    error,
    changePage,
    sendMessage,
    sendReaction,
    setTyping,
    becomeHost,
    syncPage,
  } = useParty({
    partyId,
    autoJoin: true,
    onError: (err) => {
      toast({
        title: 'Error',
        description: err,
        variant: 'error',
      });
    },
  });

  // Sincronizar pagina local con host
  useEffect(() => {
    if (followHost && hostPage !== localPage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalPage(hostPage);
    }
  }, [hostPage, followHost, localPage]);

  // Auto-scroll del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Manejar error de conexion
  useEffect(() => {
    if (error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      toast({
        title: 'Connection Error',
        description: error,
        variant: 'error',
      });
    }
  }, [error, toast]);

  // Indicador de escritura
  const handleTyping = useCallback(() => {
    setTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1000);
  }, [setTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendMessage(chatMessage);
    setChatMessage('');
    setTyping(false);
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > pages.length) return;

      setLocalPage(newPage);

      // Si es host, sincronizar con todos
      if (isHost) {
        changePage(newPage);
      }

      // Si no es host y no sigue al host, enviar actualizacion de cursor
      if (!isHost && !followHost) {
        syncPage(newPage);
      }
    },
    [isHost, changePage, syncPage, pages.length, followHost]
  );

  const handleReaction = (reaction: string) => {
    sendReaction(reaction, localPage);
    setShowReactions(false);
  };

  const handleBecomeHost = () => {
    becomeHost();
    toast({
      title: 'You are now the host',
      description: 'You control the page synchronization',
    });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/reader/party/${partyId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({
      title: 'Link copied!',
      description: 'Share it with your friends',
    });
  };

  // Renderizar reaccion flotante
  const FloatingReaction = ({ reaction, username }: { reaction: string; username: string }) => (
    <div className="absolute pointer-events-none animate-float-up z-50">
      <div className="bg-accent-purple/90 text-[var(--text-inverse)] px-3 py-1 rounded-full text-sm font-bold shadow-lg">
        {reaction} {username}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[var(--background)] text-[var(--text-inverse)] flex overflow-hidden">
      {/* Reacciones flotantes */}
      {reactions.map((r) => (
        <FloatingReaction key={r.id} reaction={r.reaction} username={r.username} />
      ))}

      {/* Area Principal: Lector */}
      <div className="flex-1 flex flex-col relative">
        {/* Barra Superior */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-40">
          <Link href={`/manga/${mangaId}`}>
            <button className="bg-[var(--text-inverse)]/10 hover:bg-[var(--text-inverse)]/20 backdrop-blur-md p-2 rounded-lg transition-colors cursor-pointer" aria-label="Volver al manga">
              <ArrowLeft size={20} />
            </button>
          </Link>

          <div className="bg-black/60 backdrop-blur-md border border-[var(--text-inverse)]/10 px-4 py-2 rounded-full flex items-center gap-4 text-sm font-semibold shadow-lg">
            <span className={`flex items-center gap-1 ${isConnected ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className="w-px h-4 bg-[var(--text-inverse)]/20"></span>
            <span>Page {localPage} / {pages.length}</span>
            {isHost && (
              <>
                <span className="w-px h-4 bg-[var(--text-inverse)]/20"></span>
                <span className="text-[var(--warning)] flex items-center gap-1">
                  <Crown size={14} fill="currentColor" />
                  Host
                </span>
              </>
            )}
            <span className="w-px h-4 bg-[var(--text-inverse)]/20"></span>
          <button
            onClick={() => setShowMembers(true)}
            className="text-accent-blue flex items-center gap-1 hover:text-accent-blue-hover cursor-pointer"
          >
              <Users size={14} />
              {members.filter((m) => m.isOnline).length} / {members.length}
            </button>
          </div>

          <div className="flex items-center gap-2">
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          aria-label="Invitar amigos"
        >
              <UserPlus size={16} />
              Invite
            </button>
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${showSidebar ? 'bg-accent-blue' : 'bg-[var(--text-inverse)]/10 hover:bg-[var(--text-inverse)]/20'}`}
          aria-label={showSidebar ? 'Ocultar chat' : 'Mostrar chat'}
        >
              <MessageSquare size={20} />
            </button>
          </div>
        </div>

        {/* Area de lectura */}
        <div className="flex-1 flex items-center justify-center bg-[var(--surface-sunken)] overflow-hidden relative">
          <div className="relative max-w-3xl w-full mx-4">
            {/* Controles de navegacion */}
        <button
          onClick={() => handlePageChange(localPage - 1)}
          disabled={localPage <= 1}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors disabled:opacity-30 z-10 cursor-pointer"
          aria-label="Página anterior"
        >
              <ChevronLeft size={24} />
            </button>
        <button
          onClick={() => handlePageChange(localPage + 1)}
          disabled={localPage >= pages.length}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors disabled:opacity-30 z-10 cursor-pointer"
          aria-label="Página siguiente"
        >
              <ChevronRight size={24} />
            </button>

            {/* Imagen del manga */}
            {pages[localPage - 1] && (
              <div className="relative group">
                <div className="relative w-full rounded shadow-2xl overflow-hidden" style={{ aspectRatio: '2/3', maxHeight: '80vh' }}>
                  <OptimizedImage
                    src={pages[localPage - 1]}
                    alt={`Page ${localPage}`}
                    fill
                    objectFit="contain"
                  />
                </div>

                {/* Reacciones overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform cursor-pointer"
            aria-label={`Reacción ${emoji}`}
          >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Indicador de pagina sincronizada */}
          {!isHost && localPage !== hostPage && (
            <div className="absolute bottom-4 left-4 bg-accent-blue/90 text-[var(--text-inverse)] px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
              Host on page {hostPage}
            <button
              onClick={() => { setLocalPage(hostPage); setFollowHost(true); }}
              className="ml-2 underline hover:no-underline cursor-pointer"
            >
                Sync
              </button>
            </div>
          )}

          {/* Boton de Follow/Unfollow */}
          {!isHost && (
            <button
          onClick={() => setFollowHost(!followHost)}
          className={`absolute bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg transition-colors cursor-pointer ${
                followHost
? 'bg-[var(--success)]/90 hover:bg-[var(--success)]/90 text-[var(--text-inverse)]'
            : 'bg-[var(--text-inverse)]/10 hover:bg-[var(--text-inverse)]/20 text-[var(--text-inverse)]'
              }`}
            >
              {followHost ? 'Following Host' : 'Free Read'}
            </button>
          )}

          {/* Boton de ser anfitrion */}
          {!isHost && members.find((m) => m.isHost)?.isOnline === false && (
        <button
          onClick={handleBecomeHost}
          className="absolute top-20 left-1/2 -translate-x-1/2 bg-[var(--warning)]/90 hover:bg-[var(--warning)]/90 text-[var(--text-inverse)] px-4 py-2 rounded-lg text-sm font-semibold shadow-lg flex items-center gap-2 cursor-pointer"
          aria-label="Convertirse en anfitrión"
        >
              <Crown size={16} />
              Become Host
            </button>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="h-1 bg-tertiary">
          <div
            className="h-full bg-accent-blue transition-all duration-300"
            style={{ width: `${(localPage / pages.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Sidebar: Chat */}
      {showSidebar && (
        <div className="w-[350px] lg:w-[400px] bg-[var(--surface)] border-l border-[var(--text-inverse)]/10 flex flex-col z-20">
          {/* Chat Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--text-inverse)]/10 bg-[var(--surface-elevated)]">
            <div>
              <h2 className="font-bold flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[var(--success)]' : 'bg-[var(--error)]'} animate-pulse`}></div>
                Party Chat
              </h2>
              <p className="text-xs text-[var(--text-muted)]">{mangaTitle} - Ch. {chapterNumber}</p>
            </div>
        <button
          onClick={() => setShowSidebar(false)}
          className="p-1 hover:bg-[var(--text-inverse)]/10 rounded transition-colors cursor-pointer"
          aria-label="Cerrar chat"
        >
              <X size={20} />
            </button>
          </div>

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-2 bg-[var(--surface-elevated)] text-xs text-[var(--text-tertiary)]">
              {typingUsers.map((u) => u.username).join(', ')} {typingUsers.length === 1 ? 'is typing...' : 'are typing...'}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-[var(--text-muted)] py-8">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`text-sm ${msg.type === 'system' ? 'text-center' : ''}`}>
                {msg.type === 'system' ? (
                  <span className="bg-[var(--text-inverse)]/10 text-[var(--text-tertiary)] px-3 py-1 rounded-full text-xs font-medium">
                    {msg.content}
                  </span>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-0.5">
                      {msg.avatarUrl ? (
                        <OptimizedImage src={msg.avatarUrl} alt={msg.username} width={20} height={20} className="rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-accent-blue/50 flex items-center justify-center text-[10px] font-bold">
                          {msg.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-bold text-accent-blue">{msg.username}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[var(--text-secondary)] leading-relaxed bg-[var(--text-inverse)]/5 px-3 py-2 rounded-lg rounded-tl-none w-fit border border-[var(--text-inverse)]/5">
                      {msg.content}
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[var(--surface-elevated)] border-t border-[var(--text-inverse)]/10">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
        <button
          type="button"
          onClick={() => setShowReactions(!showReactions)}
          className="absolute left-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          aria-label="Reacciones"
        >
                <Smile size={20} />
              </button>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => {
                  setChatMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                aria-label="Mensaje de chat"
                className="w-full bg-[var(--background)] border border-[var(--text-inverse)]/10 focus:border-accent-blue rounded-full py-2.5 pl-10 pr-12 text-sm outline-none transition-colors"
                disabled={!isConnected}
              />
        <button
          type="submit"
          disabled={!chatMessage.trim() || !isConnected}
          className="absolute right-2 bg-accent-blue text-[var(--text-inverse)] p-1.5 rounded-full disabled:opacity-50 hover:bg-accent-blue-hover transition-colors cursor-pointer"
          aria-label="Enviar mensaje"
        >
                <Send size={16} />
              </button>
            </form>

            {/* Quick reactions picker */}
            {showReactions && (
              <div className="absolute bottom-16 left-4 right-4 bg-[var(--surface-elevated)] border border-[var(--text-inverse)]/10 rounded-lg p-2 flex gap-2 flex-wrap">
                {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="w-8 h-8 hover:bg-[var(--text-inverse)]/10 rounded flex items-center justify-center text-lg transition-colors cursor-pointer"
              aria-label={`Reacción ${emoji}`}
            >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                {isConnected ? <Eye size={12} /> : <Zap size={12} />}
                {isConnected ? `${members.filter((m) => m.isOnline).length} online` : 'Reconnecting...'}
              </span>
              <span>{messages.length} messages</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Miembros */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[var(--surface-elevated)] rounded-lg w-80 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-[var(--text-inverse)]/10 flex items-center justify-between">
              <h3 className="font-bold">Party Members</h3>
          <button
            onClick={() => setShowMembers(false)}
            className="p-1 hover:bg-[var(--text-inverse)]/10 rounded cursor-pointer"
            aria-label="Cerrar miembros"
          >
                <X size={20} />
              </button>
            </div>
            <div className="p-2 overflow-y-auto max-h-64">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center gap-3 p-2 hover:bg-[var(--text-inverse)]/5 rounded">
                  <div className="relative">
                    {member.avatarUrl ? (
                      <OptimizedImage src={member.avatarUrl} alt={member.username} width={32} height={32} className="rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent-blue/50 flex items-center justify-center text-xs font-bold">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--surface-elevated)] ${
                        member.isOnline ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm truncate">{member.username}</span>
                      {member.isHost && (
                        <Crown size={12} className="text-[var(--warning)]" fill="currentColor" />
                      )}
                    </div>
<span className="text-xs text-[var(--text-muted)]">
                            Page {member.currentPage} • {member.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Invitacion */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[var(--surface-elevated)] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Invite Friends</h3>
          <button
            onClick={() => setShowInviteModal(false)}
            className="p-1 hover:bg-[var(--text-inverse)]/10 rounded cursor-pointer"
            aria-label="Cerrar invitación"
          >
                <X size={20} />
              </button>
            </div>
            <p className="text-[var(--text-tertiary)] mb-4">
              Share this link with your friends to read together:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/reader/party/${partyId}`}
                readOnly
                aria-label="Enlace de invitación"
                className="flex-1 bg-[var(--text-inverse)]/5 border border-[var(--text-inverse)]/10 rounded-lg px-3 py-2 text-sm"
              />
        <button
          onClick={copyInviteLink}
          className="bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          aria-label="Copiar enlace"
        >
                {copiedLink ? <Check size={18} /> : <Copy size={18} />}
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="mt-4 flex justify-end">
        <button
          onClick={() => setShowInviteModal(false)}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
