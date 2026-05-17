/**
 * CommentForm Component
 * 
 * Formulario para crear/editar comentarios.
 */

'use client';

import { useState, useEffect, useRef, useActionState, useOptimistic } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createComment } from '@/app/api/comments/actions';

interface CommentFormProps {
  initialContent?: string;
  onSubmit?: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  isCompact?: boolean;
  autoFocus?: boolean;
  chapterId?: string;
  mangaSlug?: string;
  parentId?: string;
}

const MAX_CHARS = 1000;

export function CommentForm({
  initialContent = '',
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  submitLabel = 'Post',
  isCompact = false,
  autoFocus = false,
  chapterId,
  mangaSlug,
  parentId,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [state, formAction, isPending] = useActionState(createComment, {} as Record<string, unknown>);
  const [optimisticState, addOptimistic] = useOptimistic(
    state,
    (currentState: Record<string, unknown>, payload: { content: string }) => ({
      ...currentState,
      optimisticContent: payload.content,
    })
  );

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const loading = isSubmitting || isPending;

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isOverLimit || loading) return;

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(content.trim());
        setContent('');
      } catch (error) {
        console.error('Error submitting comment:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else if (chapterId) {
      const formData = new FormData();
      formData.set('content', content.trim());
      formData.set('chapterId', chapterId);
      if (mangaSlug) formData.set('mangaSlug', mangaSlug);
      if (parentId) formData.set('parentId', parentId);

      addOptimistic({ content: content.trim() });
      formAction(formData);
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div>
      <AnimatePresence>
        {!!(optimisticState as Record<string, unknown>)?.optimisticContent && isPending && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-2 p-3 rounded-lg bg-[var(--surface-elevated)]/30 border border-[var(--border)]"
          >
            <p className="text-xs text-[var(--text-tertiary)] mb-1">Enviando...</p>
            <p className="text-sm text-[var(--text-secondary)]">{(optimisticState as Record<string, unknown>)?.optimisticContent as string}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!!(state as Record<string, unknown>)?.error && !isPending && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-2 p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30"
          >
            <p className="text-xs text-[var(--error)]">{(state as Record<string, unknown>)?.error as string}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={MAX_CHARS + 100}
            rows={isCompact ? 2 : 3}
            className={cn(
'w-full px-3 py-2 bg-[var(--surface-sunken)] border rounded-lg resize-none outline-none transition-all',
          'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
          isOverLimit
            ? 'border-[var(--error)] focus:border-[var(--error)]'
            : 'border-[var(--border)] focus:border-[var(--primary)]',
            isCompact && 'text-sm'
          )}
          disabled={loading}
        />

        <div
          className={cn(
            'absolute bottom-2 right-2 text-xs',
            isOverLimit ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'
          )}
        >
          {charCount}/{MAX_CHARS}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--text-tertiary)]">
          {loading ? 'Posting...' : 'Ctrl+Enter to post'}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}

          <motion.button
            type="submit"
            disabled={!content.trim() || isOverLimit || loading}
            whileTap={!loading ? { scale: 0.95 } : undefined}
            className={cn(
              'flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              !content.trim() || isOverLimit || loading
                ? 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] cursor-not-allowed'
                : 'bg-[var(--info)] hover:opacity-90 text-[var(--text-inverse)]'
            )}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="spinner"
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Send className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
            {loading ? 'Enviando...' : submitLabel}
          </motion.button>
        </div>
      </div>
    </form>
    </div>
  );
}

export default CommentForm;
