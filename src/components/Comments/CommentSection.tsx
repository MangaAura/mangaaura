/**
 * CommentSection Component
 * 
 * Sección completa de comentarios para capítulos.
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useChapterComments } from '@/hooks/useChapterComments';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  chapterId: string;
  mangaId: string;
  className?: string;
}

export function CommentSection({ chapterId, mangaId, className }: CommentSectionProps) {
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
  } = useChapterComments(chapterId);

  const handleSubmit = async (content: string) => {
    await createComment(content, replyingTo || undefined);
    setReplyingTo(null);
  };

  const topLevelComments = comments.filter((c) => !c.parentId);
  const totalComments = comments.length;

  return (
    <div className={cn('bg-slate-900 rounded-xl', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          Comentarios
          <span className="text-sm font-normal text-slate-500">
            ({totalComments})
          </span>
        </h2>
      </div>

      {/* Formulario principal */}
      {session?.user && (
        <div className="px-6 py-4 border-b border-slate-800">
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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400">{error}</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">Sé el primero en comentar</p>
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
                replyingTo={replyingTo}
                onSubmitReply={handleSubmit}
                onCancelReply={() => setReplyingTo(null)}
              />
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="w-full py-3 text-slate-400 hover:text-white text-sm transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
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
