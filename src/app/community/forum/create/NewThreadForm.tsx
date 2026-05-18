'use client';

import { Tag, X, Plus, Send, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useT } from '@/i18n';

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
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!title.trim() || !content.trim() || !categoryId) return;

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
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {t('newThread.category')}
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
          required
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} {cat.description ? `— ${cat.description}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {t('newThread.title')}
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('newThread.titlePlaceholder')}
          maxLength={200}
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          {title.length}/200
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {t('newThread.content')}
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('newThread.contentPlaceholder')}
          rows={8}
          maxLength={10000}
          required
          disabled={isSubmitting}
          className="resize-y"
        />
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          {content.length}/10,000
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          {t('newThread.tags')}
        </label>
        <div className="flex gap-2">
          <Input
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
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--primary-subtle)] text-[var(--primary)] text-xs rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 hover:text-[var(--error)] transition-colors cursor-pointer"
              aria-label={`${t('newThread.removeTag')} ${tag}`}
            >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-[var(--text-tertiary)]">
          {t('newThread.creatorOnly')}
        </p>
        <Button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim() || !categoryId}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {t('newThread.publishThread')}
        </Button>
      </div>
    </form>
  );
}