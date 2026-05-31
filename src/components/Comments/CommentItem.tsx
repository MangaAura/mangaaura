/**
 * CommentItem Component
 * 
 * Componente individual de comentario con replies.
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Edit2, Trash2, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

import { CommentForm } from './CommentForm';
import type { Comment } from '@/hooks/useChapterComments';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: Comment;
  onReply: (id: string) => void;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLike: (id: string) => Promise<void>;
  onUnlike: (id: string) => Promise<void>;
  onVote: (id: string, value: 1 | -1) => Promise<void>;
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
  onVote,
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
              <div className="flex items-center gap-0.5">
                <motion.button
                  onClick={() => onVote(comment.id, 1)}
                  whileTap={{ scale: 0.85 }}
                  aria-label="Upvote"
                  className={cn(
                    'p-1 rounded transition-colors',
                    comment.userVote === 1
                      ? 'text-[var(--primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--primary)]'
                  )}
                >
                  <ArrowUp className="w-4 h-4" />
                </motion.button>
                <span className={cn(
                  'text-xs font-medium min-w-[1.2rem] text-center',
                  (comment.voteCount ?? 0) > 0 && 'text-[var(--text-primary)]'
                )}>
                  {comment.voteCount ?? 0}
                </span>
                <motion.button
                  onClick={() => onVote(comment.id, -1)}
                  whileTap={{ scale: 0.85 }}
                  aria-label="Downvote"
                  className={cn(
                    'p-1 rounded transition-colors',
                    comment.userVote === -1
                      ? 'text-[var(--error)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--error)]'
                  )}
                >
                  <ArrowDown className="w-4 h-4" />
                </motion.button>
              </div>

              <motion.button
                onClick={handleLike}
                whileTap={{ scale: 0.85 }}
                aria-label={comment.isLiked ? 'Quitar me gusta' : 'Me gusta'}
                aria-pressed={comment.isLiked}
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
                  >                      <Heart className={cn('w-4 h-4', comment.isLiked && 'fill-current')} aria-hidden="true" />
                  </motion.div>
                </AnimatePresence>
                <span>{comment.likesCount}</span>
              </motion.button>

              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Responder"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
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
                aria-expanded={showReplies}
                aria-controls={`replies-${comment.id}`}
                className="flex items-center gap-1 text-sm text-[var(--info)] hover:text-[var(--primary)]"
              >
                {showReplies ? (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{comment.replies?.length} replies</span>
              </button>

              {showReplies && (
                <div id={`replies-${comment.id}`} className="mt-3 space-y-3">
                  {comment.replies?.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onLike={onLike}
                      onUnlike={onUnlike}
                      onVote={onVote}
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
