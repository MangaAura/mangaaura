'use client';

import { Send, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useT } from '@/i18n';


interface ForumReplyFormProps {
  threadSlug: string;
}

export function ForumReplyForm({ threadSlug }: ForumReplyFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/forum/threads/${threadSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('forumReply.errorSending'));
      }

      setContent('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('forumReply.errorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-semibold text-[var(--text-primary)]">{t('forumReply.replyToThread')}</h3>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}            placeholder={t('forumReply.placeholder')}
        rows={4}
        className="resize-none"
        disabled={isSubmitting}
        minLength={1}
        maxLength={10000}
      />
      {error && (
        <p className="text-sm text-[var(--error)]">{error}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-tertiary)]">
          {content.length}/10,000
        </span>
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {t('forumReply.reply')}
        </Button>
      </div>
    </form>
  );
}