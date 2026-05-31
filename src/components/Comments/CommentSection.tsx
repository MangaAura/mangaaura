/**
 * CommentSection Component
 * 
 * Sección completa de comentarios para capítulos.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useChapterComments } from '@/hooks/useChapterComments';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  chapterId: string;
  mangaId?: string;
  className?: string;
}

export function CommentSection({ chapterId, className }: CommentSectionProps) {
  const { data: session } = useSession();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const {
    comments,
    isLoading,
    error,
    hasMore,
    loadMore,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment,
    voteComment,
  } = useChapterComments(chapterId);

  const handleSubmit = async (content: string) => {
    await createComment(content, replyingTo || undefined);
    setReplyingTo(null);
  };

  const topLevelComments = comments.filter((c) => !c.parentId);
  const totalComments = comments.length;

  return (
    <div className={cn('bg-[var(--surface)] rounded-xl', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
<h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-[var(--info)]" />
          Comentarios
          <span className="text-sm font-normal text-[var(--text-muted)]">
            ({totalComments})
          </span>
        </h2>
      </div>

      {/* Formulario principal */}
      {session?.user && (
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <CommentForm
            onSubmit={handleSubmit}
            placeholder="Comparte tus pensamientos sobre este capítulo..."
            submitLabel="Comentar"
          />
        </div>
      )}

      {/* Lista de comentarios */}
      <div className="px-6 py-4">
        {isLoading && comments.length === 0 ? (
          <div role="status" aria-label="Cargando comentarios" className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--text-tertiary)]" aria-hidden="true" />
          </div>
        ) : error ? (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ErrorMessage message={error} />
            </motion.div>
          </AnimatePresence>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-muted)]">Sé el primero en comentar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topLevelComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={(id) => setReplyingTo(id)}
                onEdit={updateComment}
                onDelete={deleteComment}
                onLike={likeComment}
                onUnlike={unlikeComment}
                onVote={voteComment}
                replyingTo={replyingTo}
                onSubmitReply={handleSubmit}
                onCancelReply={() => setReplyingTo(null)}
              />
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="w-full py-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" aria-hidden="true" />
                ) : (
                  'Cargar más comentarios'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentSection;
