/**
 * CommentItem Component
 * 
 * Componente individual de comentario con replies.
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Heart, MessageCircle, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommentForm } from './CommentForm';
import type { Comment } from '@/hooks/useChapterComments';

interface CommentItemProps {
  comment: Comment;
  onReply: (id: string) => void;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLike: (id: string) => Promise<void>;
  onUnlike: (id: string) => Promise<void>;
  replyingTo: string | null;
  onSubmitReply: (content: string) => Promise<void>;
  onCancelReply: () => void;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onUnlike,
  replyingTo,
  onSubmitReply,
  onCancelReply,
  isReply = false,
}: CommentItemProps) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isOwner = session?.user?.id === comment.userId;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (comment.isLiked) {
        await onUnlike(comment.id);
      } else {
        await onLike(comment.id);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    setIsDeleting(true);
    await onDelete(comment.id);
  };

  return (
    <div className={cn('group', isReply && 'ml-12')}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user.avatarUrl ? (
            <Image
              src={comment.user.avatarUrl}
              alt={comment.user.username}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] font-bold">
              {comment.user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-[var(--surface-elevated)]/50 rounded-lg p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--text-primary)] text-sm">
                  {comment.user.username}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>

              {isOwner && !isEditing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--info)] rounded cursor-pointer"
            aria-label="Editar comentario"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--error)] rounded cursor-pointer"
            aria-label="Eliminar comentario"
          >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            {isEditing ? (
              <CommentForm
                initialContent={comment.content}
                onSubmit={handleEdit}
                onCancel={() => setIsEditing(false)}
                submitLabel="Save"
                isCompact
              />
            ) : (
              <p className="text-[var(--text-secondary)] text-sm whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              <motion.button
                onClick={handleLike}
                whileTap={{ scale: 0.85 }}
                className={cn(
                  'flex items-center gap-1 text-sm transition-colors',
                  comment.isLiked
? 'text-[var(--error)]'
            : 'text-[var(--text-muted)] hover:text-[var(--error)]'
                )}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={comment.isLiked ? 'liked' : 'unliked'}
                    initial={{ scale: 1 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 1.3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <Heart className={cn('w-4 h-4', comment.isLiked && 'fill-current')} />
                  </motion.div>
                </AnimatePresence>
                <span>{comment.likesCount}</span>
              </motion.button>

              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Reply</span>
              </button>
            </div>
          )}

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-3">
              <CommentForm
                onSubmit={onSubmitReply}
                onCancel={onCancelReply}
                placeholder="Write a reply..."
                submitLabel="Reply"
                isCompact
                autoFocus
              />
            </div>
          )}

          {/* Replies */}
          {hasReplies && (
            <div className="mt-3">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-sm text-[var(--info)] hover:text-[var(--primary)]"
              >
                {showReplies ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span>{comment.replies?.length} replies</span>
              </button>

              {showReplies && (
                <div className="mt-3 space-y-3">
                  {comment.replies?.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onLike={onLike}
                      onUnlike={onUnlike}
                      replyingTo={replyingTo}
                      onSubmitReply={onSubmitReply}
                      onCancelReply={onCancelReply}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommentItem;
