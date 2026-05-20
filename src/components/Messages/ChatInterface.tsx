'use client';

import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, MoreVertical, Flag } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { AccessibleModal } from '@/components/A11y/AccessibleModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn } from '@/lib/utils';


interface Message {
  id: string;
  content: string;
  createdAt: Date | string;
  senderId: string;
  isRead: boolean;
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
  initialMessages: Message[];
}

export function ChatInterface({
  conversationId,
  currentUserId,
  participant,
  initialMessages = [],
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      content: newMessage.trim(),
      createdAt: new Date(),
      senderId: currentUserId,
      isRead: false,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: tempMessage.content }),
      });

      if (!response.ok) throw new Error('Failed to send');

      const { message } = await response.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMessage.id ? message : m))
      );
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      alert('Error al enviar mensaje');
    } finally {
      setIsLoading(false);
    }
  };

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
        alert('Reporte enviado');
      }
    } catch (error) {
      alert('Error al enviar reporte');
    }
  };

  const formatMessageDate = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: es });
    }
    if (isYesterday(date)) {
      return `Ayer ${format(date, 'HH:mm', { locale: es })}`;
    }
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] rounded-lg border border-[var(--border)]">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={participant.avatarUrl || undefined} />
            <AvatarFallback className="bg-[var(--surface-sunken)] text-[var(--text-primary)]">
              {participant.displayName?.[0] || participant.username[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-[var(--text-primary)]">
              {participant.displayName || participant.username}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">@{participant.username}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowReportModal(true)}
            aria-label="Reportar usuario"
          >
            <Flag className="w-5 h-5 text-[var(--text-tertiary)]" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Más opciones">
            <MoreVertical className="w-5 h-5 text-[var(--text-tertiary)]" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <EmptyState
            title="Sin mensajes"
            action={{
              label: 'Explorar manga',
              href: '/search_ia',
            }}
          />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    isOwn ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] px-4 py-2 rounded-lg',
                      isOwn
                        ? 'bg-[var(--primary)] text-[var(--text-inverse)] rounded-br-sm'
                        : 'bg-[var(--surface-sunken)] text-[var(--text-primary)] rounded-bl-sm'
                    )}
                  >
                    <p>{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {formatMessageDate(new Date(message.createdAt))}
                      {isOwn && (
                        <span className="ml-2">
                          {message.isRead ? '✓✓' : '✓'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)]">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={isLoading}
            maxLength={500}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            isLoading={isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <AccessibleModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Reportar usuario"
        description={`¿Por qué quieres reportar a ${participant.username}?`}
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowReportModal(false)}
            >
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
          className="w-full h-32 p-3 rounded-md bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          maxLength={500}
        />
      </AccessibleModal>
    </div>
  );
}
