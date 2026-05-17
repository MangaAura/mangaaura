'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ForumReplyForm } from './ForumReplyForm';
import { MessageSquare, Clock } from 'lucide-react';
import { useT } from '@/i18n';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const roleBadgeStyles: Record<string, { className: string; labelKey: string }> = {
  ADMIN: { className: 'bg-[var(--error)]/10 text-[var(--error)]', labelKey: 'forumThread.moderator' },
  MODERATOR: { className: 'bg-[var(--info)]/10 text-[var(--info)]', labelKey: 'forumThread.moderator' },
  CREATOR: { className: 'bg-[var(--primary)]/10 text-[var(--primary)]', labelKey: 'forumThread.creator' },
};

interface ForumThreadClientProps {
  thread: {
    id: string;
    slug: string;
    author: {
      id: string;
      username: string;
      displayName: string | null;
    };
    isLocked: boolean;
  };
  posts: Array<{
    id: string;
    content: string;
    createdAt: Date | string;
    author: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      role: string;
    };
  }>;
  canReply: boolean | undefined;
  isLoggedIn: boolean | undefined;
}

export function ForumThreadClient({ thread, posts, canReply, isLoggedIn }: ForumThreadClientProps) {
  const shouldReduceMotion = useReducedMotion();
  const t = useT();

  const postAnimation = (i: number) => ({
    initial: shouldReduceMotion ? {} : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] as const },
  });

  return (
    <>
      {/* Posts */}
      <div className="space-y-4 mb-8">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <motion.div key={post.id} {...postAnimation(index)}>
              <Card className="p-6 border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-start gap-4">
                  <Link href={`/user/${post.author.username}`}>
                    <Avatar className="w-10 h-10 ring-2 ring-[var(--border)]">
                      <AvatarImage src={post.author.avatarUrl || undefined} />
                      <AvatarFallback>
                        {post.author.displayName?.[0] || post.author.username[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        href={`/user/${post.author.username}`}
                        className="font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                      >
                        {post.author.displayName || post.author.username}
                      </Link>
                      {post.author.role !== 'USER' && (
                        <Badge className={(roleBadgeStyles[post.author.role]?.className || 'bg-[var(--surface-sunken)] text-[var(--text-secondary)]') + ' text-xs'}>
                          {t(roleBadgeStyles[post.author.role]?.labelKey || post.author.role)}
                        </Badge>
                      )}
                      {post.author.id === thread.author.id && (
                        <Badge className="bg-[var(--primary-subtle)] text-[var(--primary)] text-xs">
                          {t('forumThread.author')}
                        </Badge>
                      )}
                      <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="text-[var(--text-primary)] whitespace-pre-wrap text-sm leading-relaxed">
                      {post.content}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <EmptyState
            title={t('forumThread.noReplies')}
            description={t('forumThread.noRepliesDesc')}
            icon={<MessageSquare className="w-12 h-12 text-[var(--text-tertiary)]" />}
          />
        )}
      </div>

      {/* Reply section */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        {isLoggedIn ? (
          canReply && !thread.isLocked ? (
            <ForumReplyForm threadSlug={thread.slug} />
          ) : thread.isLocked ? (
            <Card className="p-6 text-center border border-[var(--border)] bg-[var(--surface)]">
              <p className="text-[var(--text-secondary)]">
                {t('forumThread.threadLocked')}
              </p>
            </Card>
          ) : (
            <Card className="p-6 text-center border border-[var(--border)] bg-[var(--surface)]">
              <p className="text-[var(--text-secondary)]">
                {t('forumThread.creatorOnlyReply')}
              </p>
            </Card>
          )
        ) : (
          <Card className="p-6 text-center border border-[var(--border)] bg-[var(--surface)]">
            <p className="text-[var(--text-secondary)] mb-3">
              {t('forumThread.loginToReply')}
            </p>
            <Link href={`/auth/login?callbackUrl=/community/forum/${thread.slug}`}>
              <span className="text-[var(--primary)] hover:underline font-medium">
                {t('forumThread.login')}
              </span>
            </Link>
          </Card>
        )}
      </motion.div>
    </>
  );
}
