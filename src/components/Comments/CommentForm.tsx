/**
 * CommentForm Component
 * 
 * Formulario para crear/editar comentarios.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  initialContent?: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  isCompact?: boolean;
  autoFocus?: boolean;
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
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isOverLimit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={MAX_CHARS + 100} // Allow some overflow for UX
          rows={isCompact ? 2 : 3}
          className={cn(
'w-full px-3 py-2 bg-[var(--surface-sunken)] border rounded-lg resize-none outline-none transition-all',
          'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
          isOverLimit
            ? 'border-[var(--error)] focus:border-[var(--error)]'
            : 'border-[var(--border)] focus:border-[var(--primary)]',
            isCompact && 'text-sm'
          )}
        />

        {/* Character count */}
        <div
          className={cn(
            'absolute bottom-2 right-2 text-xs',
            isOverLimit ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'
          )}
        >
          {charCount}/{MAX_CHARS}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--text-tertiary)]">
          {isSubmitting ? 'Posting...' : 'Ctrl+Enter to post'}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={!content.trim() || isOverLimit || isSubmitting}
            className={cn(
              'flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              !content.trim() || isOverLimit || isSubmitting
                ? 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] cursor-not-allowed'
                : 'bg-[var(--info)] hover:opacity-90 text-[var(--text-inverse)]'
            )}
          >
            <Send className="w-4 h-4" />
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CommentForm;
