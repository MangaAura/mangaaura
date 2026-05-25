'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Textarea } from '@/components/ui/Textarea';
import { useT } from '@/i18n';


interface ForumReplyFormProps {
  threadSlug: string;
}

export function ForumReplyForm({ threadSlug }: ForumReplyFormProps) {
  const router = useRouter();
  const t = useT();
  const replySchema = z.object({
    content: z.string().min(1, t('forumReply.errorContentMin')).max(10000, t('forumReply.errorContentMax')),
  });
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = replySchema.safeParse({ content });
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? null);
      setTouched(true);
      return;
    }

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
        onChange={(e) => { setContent(e.target.value); setTouched(true); const r = replySchema.shape.content.safeParse(e.target.value); setFieldError(r.success ? null : (r.error?.issues[0]?.message ?? null)); }}            placeholder={t('forumReply.placeholder')}
        rows={4}
        className={`resize-none ${touched && fieldError ? 'border-[var(--error)]' : ''} ${touched && !fieldError && content ? 'border-[var(--success)]' : ''}`}
        disabled={isSubmitting}
        minLength={1}
        maxLength={10000}
        aria-required
        aria-describedby={error ? 'forum-reply-error' : undefined}
      />
      <AnimatePresence>
        {touched && !fieldError && content && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1 text-xs text-[var(--success)]"
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            {t('forumReply.contentValid')}
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {touched && fieldError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1 text-xs text-[var(--error)]"
            role="alert"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            {fieldError}
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            id="forum-reply-error"
          >
            <ErrorMessage message={error} />
          </motion.div>
        )}
      </AnimatePresence>
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