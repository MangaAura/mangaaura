'use client';

import { Mail, Send, ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle, Eye, XCircle } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import { Container } from '@/components/Layout/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';
import { cn } from '@/lib/utils';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  general: { label: 'General', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  support: { label: 'Soporte', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  dmca: { label: 'DMCA', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  business: { label: 'Negocios', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  READ: { label: 'Leído', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  REPLIED: { label: 'Respondido', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  CLOSED: { label: 'Cerrado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

interface ContactApiResponse {
  messages: ContactMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ContactClient() {
  const t = useT();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchCategory, setSearchCategory] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR<ContactApiResponse>(
    `/api/contact?page=${page}&limit=10&${searchCategory !== 'all' ? `category=${searchCategory}` : ''}`,
    fetcher
  );

  const messages = data?.messages || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const updateStatus = async (messageId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/contact/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await mutate();
        toast({
          title: 'Status updated',
          description: `Message marked as ${status.toLowerCase()}.`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update message status',
          variant: 'error',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update message status',
        variant: 'error',
      });
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      const res = await fetch('/api/admin/contact/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedMessage.email,
          subject: selectedMessage.subject,
          message: replyText,
          replyToId: selectedMessage.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('admin.errors.saveError'));
      }

      setSendSuccess(true);
      setReplyText('');
      await mutate();

      setTimeout(() => {
        setSendSuccess(false);
        setSelectedMessage(null);
      }, 2000);
    } catch (err: any) {
      setSendError(err.message || t('admin.errors.saveError'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Container className="py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-accent-blue/10 rounded-full flex items-center justify-center">
          <Mail className="w-6 h-6 text-accent-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('admin.pages.contact.title')}</h1>
          <p className="text-muted text-sm">
            {t('admin.pages.contact.total', { count: pagination.total })}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>{t('admin.pages.contact.messages')}</CardTitle>
            <div className="flex gap-2">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="px-3 py-2 bg-tertiary border border-custom rounded-lg text-sm"
              >
                <option value="all">{t('admin.pages.contact.allCategories')}</option>
                <option value="general">{t('admin.pages.contact.categories.general')}</option>
                <option value="support">{t('admin.pages.contact.categories.support')}</option>
                <option value="dmca">{t('admin.pages.contact.categories.dmca')}</option>
                <option value="business">{t('admin.pages.contact.categories.business')}</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted">{t('admin.pages.contact.empty')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg: ContactMessage) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={cn(
                    'p-4 rounded-xl border transition-all cursor-pointer hover:border-accent-blue/50',
                    msg.status === 'PENDING'
                      ? 'bg-yellow-500/5 border-yellow-500/20'
                      : 'bg-secondary border-custom hover:bg-secondary/80'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{msg.name}</span>
                        <span className="text-muted text-sm truncate">{msg.email}</span>
                        <Badge className={CATEGORY_LABELS[msg.category]?.color || ''}>
                          {CATEGORY_LABELS[msg.category]?.label || msg.category}
                        </Badge>
                        <Badge className={STATUS_LABELS[msg.status]?.color || ''}>
                          {STATUS_LABELS[msg.status]?.label || msg.status}
                        </Badge>
                        {msg.status === 'PENDING' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(msg.id, 'READ'); }}
                            className="text-xs text-accent-blue hover:underline flex items-center gap-1"
                            title="Mark as read"
                          >
                            <Eye className="w-3 h-3" /> Mark read
                          </button>
                        )}
                        {msg.status !== 'CLOSED' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(msg.id, 'CLOSED'); }}
                            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1"
                            title="Close without reply"
                          >
                            <XCircle className="w-3 h-3" /> Close
                          </button>
                        )}
                      </div>
                      <p className="font-medium mt-1">{msg.subject}</p>
                      <p className="text-sm text-muted truncate mt-1">{msg.message}</p>
                    </div>
                    <div className="text-xs text-muted whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-custom">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted">
                    {t('admin.pages.contact.page', { page, total: pagination.totalPages })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription>
              {t('admin.pages.contact.from', { name: selectedMessage?.name || '', email: selectedMessage?.email || '' })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedMessage && (
                <>
                  <Badge className={CATEGORY_LABELS[selectedMessage.category]?.color || ''}>
                    {CATEGORY_LABELS[selectedMessage.category]?.label || selectedMessage.category}
                  </Badge>
                  <Badge className={STATUS_LABELS[selectedMessage.status]?.color || ''}>
                    {STATUS_LABELS[selectedMessage.status]?.label || selectedMessage.status}
                  </Badge>
                  <span className="text-xs text-muted">
                    {selectedMessage.createdAt && new Date(selectedMessage.createdAt).toLocaleString('es-ES')}
                  </span>
                </>
              )}
            </div>

            <div className="p-4 bg-tertiary rounded-xl border border-custom">
              <p className="whitespace-pre-wrap">{selectedMessage?.message}</p>
            </div>

            <div className="border-t border-custom pt-4">
              <Label className="text-sm font-medium mb-2 block">{t('admin.pages.contact.replyTo', { email: selectedMessage?.email || '' })}</Label>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('admin.pages.contact.replyPlaceholder')}
                rows={6}
                className="resize-none"
              />
              {sendError && (
                <p className="text-sm text-[var(--error)] mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {sendError}
                </p>
              )}
              {sendSuccess && (
                <p className="text-sm text-[var(--success)] mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('admin.pages.contact.sentSuccess')}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <div className="flex gap-1 mr-auto">
              {selectedMessage && selectedMessage.status !== 'CLOSED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatus(selectedMessage.id, 'CLOSED')}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  {t('admin.pages.contact.statuses.CLOSED')}
                </Button>
              )}
            </div>
            <Button variant="ghost" onClick={() => setSelectedMessage(null)}>
              {t('admin.pages.contact.close')}
            </Button>
            <Button
              onClick={handleReply}
              disabled={!replyText.trim() || isSending}
              className="gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('admin.pages.contact.sending')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('admin.pages.contact.sendReply')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}