'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Plus, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
}

interface NewThreadFormProps {
  categories: Category[];
}

export function NewThreadForm({ categories }: NewThreadFormProps) {
  const router = useRouter();
  const t = useT();

  const threadSchema = useMemo(() => z.object({
    title: z.string().min(1, t('newThread.errorTitleMin')).max(200, t('newThread.errorTitleMax')),
    content: z.string().min(1, t('newThread.errorContentMin')).max(10000, t('newThread.errorContentMax')),
    categoryId: z.string().min(1, t('newThread.errorCategoryRequired')),
  }), [t]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string) => {
    const shape = threadSchema.shape as Record<string, z.ZodString>;
    const result = shape[field]?.safeParse(value);
    setFieldErrors((prev) => ({ ...prev, [field]: result?.success ? null : (result?.error?.issues[0]?.message ?? null) }));
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = threadSchema.safeParse({ title, content, categoryId });
    if (!result.success) {
      const fieldErrors_: Record<string, string | null> = {};
      result.error.issues.forEach((issue) => { fieldErrors_[issue.path[0] as string] = issue.message; });
      setFieldErrors(fieldErrors_);
      setTouched({ title: true, content: true, categoryId: true });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryId,
          tags,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('newThread.errorCreating'));
      }

      router.push(`/community/forum/${data.thread.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('newThread.errorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="thread-category" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {t('newThread.category')}
        </label>
        <select
          id="thread-category"
          value={categoryId}              onChange={(e) => { setCategoryId(e.target.value); setTouched((prev) => ({ ...prev, categoryId: true })); validateField('categoryId', e.target.value); }}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
          required
          aria-required
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} {cat.description ? `— ${cat.description}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="thread-title" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {t('newThread.title')}
        </label>
        <Input
          id="thread-title"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setTouched((prev) => ({ ...prev, title: true })); validateField('title', e.target.value); }}
          placeholder={t('newThread.titlePlaceholder')}
          maxLength={200}
          required
          disabled={isSubmitting}
          className={cn('w-full', touched.title && fieldErrors.title ? 'border-[var(--error)]' : '', touched.title && !fieldErrors.title && title ? 'border-[var(--success)]' : '')}
          aria-describedby={error ? 'thread-error title-char-count' : 'title-char-count'}
        />
        <p id="title-char-count" className="text-xs text-[var(--text-tertiary)] mt-1">
          {title.length}/200
        </p>
        <AnimatePresence>
          {touched.title && !fieldErrors.title && title && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1 text-xs text-[var(--success)] mt-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              {t('newThread.titleValid')}
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {touched.title && fieldErrors.title && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1 text-xs text-[var(--error)] mt-1"
              role="alert"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              {fieldErrors.title}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div>
        <label htmlFor="thread-content" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {t('newThread.content')}
        </label>
        <Textarea
          id="thread-content"
          value={content}
          onChange={(e) => { setContent(e.target.value); setTouched((prev) => ({ ...prev, content: true })); validateField('content', e.target.value); }}
          placeholder={t('newThread.contentPlaceholder')}
          rows={8}
          maxLength={10000}
          required
          disabled={isSubmitting}
          className={cn('resize-y', touched.content && fieldErrors.content ? 'border-[var(--error)]' : '', touched.content && !fieldErrors.content && content ? 'border-[var(--success)]' : '')}
          aria-describedby={error ? 'thread-error content-char-count' : 'content-char-count'}
        />
        <p id="content-char-count" className="text-xs text-[var(--text-tertiary)] mt-1">
          {content.length}/10,000
        </p>
        <AnimatePresence>
          {touched.content && !fieldErrors.content && content && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1 text-xs text-[var(--success)] mt-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              {t('newThread.contentValid')}
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {touched.content && fieldErrors.content && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-1 text-xs text-[var(--error)] mt-1"
              role="alert"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              {fieldErrors.content}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div>
        <label htmlFor="thread-tags" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {t('newThread.tags')}
        </label>
        <div className="flex gap-2">
          <Input
            id="thread-tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={t('newThread.tagPlaceholder')}
            disabled={isSubmitting || tags.length >= 5}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            disabled={!tagInput.trim() || tags.length >= 5 || isSubmitting}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--primary-subtle)] text-[var(--primary)] text-xs rounded-full"
              >
                <Tag className="w-3 h-3" aria-hidden="true" />
                {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 hover:text-[var(--error)] transition-colors cursor-pointer"
              aria-label={`${t('newThread.removeTag')} ${tag}`}
            >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            id="thread-error"
          >
            <ErrorMessage message={error} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-[var(--text-tertiary)]">
          {t('newThread.creatorOnly')}
        </p>
        <Button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim() || !categoryId}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
          ) : (
            <Send className="w-4 h-4 mr-2" aria-hidden="true" />
          )}
          {t('newThread.publishThread')}
        </Button>
      </div>
    </form>
  );
}