'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  MessageSquare,
  Pin,
  Eye,
  Clock,
  BookOpen,
  Sparkles,
  Palette,
  Code2,
  Megaphone,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useT } from '@/i18n';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Sparkles,
  Palette,
  Code2,
  Megaphone,
  HelpCircle,
};

interface ForumClientProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    _count: { threads: number };
  }>;
  threads: Array<{
    id: string;
    slug: string;
    title: string;
    isPinned: boolean;
    isLocked: boolean;
    viewCount: number;
    createdAt: Date | string;
    author: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      role: string;
    };
    category: {
      id: string;
      name: string;
      slug: string;
      icon: string | null;
    } | null;
    _count: { posts: number };
  }>;
  canCreate: boolean | undefined;
}

export function ForumClient({ categories, threads, canCreate }: ForumClientProps) {
  const shouldReduceMotion = useReducedMotion();
  const t = useT();

  const cardAnimation = (i: number) => ({
    initial: shouldReduceMotion ? {} : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: 0.05 + i * 0.04, ease: [0.4, 0, 0.2, 1] as const },
    whileHover: shouldReduceMotion ? {} : { y: -3, transition: { duration: 0.2 } },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="mb-8"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-[var(--text-primary)]">
                {t('forum.title')} <MessageSquare className="text-[var(--primary)]" />
              </h1>
              <p className="text-[var(--text-secondary)] mt-2">
                {t('forum.description')}
              </p>
            </div>
            {canCreate && (
              <Link href="/community/forum/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('forum.newThread')}
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {categories.map((cat, i) => {
            const Icon = cat.icon ? categoryIcons[cat.icon] || MessageSquare : MessageSquare;
            return (
              <motion.div key={cat.id} {...cardAnimation(i)}>
                <Card className="p-4 text-center hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[var(--primary-subtle)] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <h2 className="font-semibold text-sm text-[var(--text-primary)]">{cat.name}</h2>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">{cat._count.threads} {t('forum.threads')}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Threads */}
        {threads.length > 0 ? (
          <div className="space-y-0">
            <Card className="overflow-hidden rounded-xl divide-y divide-[var(--border)]">
              {threads.map((thread, i) => (
                <motion.div
                  key={thread.id}
                  initial={shouldReduceMotion ? {} : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.3 + i * 0.03, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Link
                    href={`/community/forum/${thread.slug}`}
                    className="flex items-start gap-4 p-4 hover:bg-[var(--surface)] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {thread.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-[var(--warning)] flex-shrink-0" />
                        )}
                        <h3 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                          {thread.title}
                        </h3>
                        {thread.isLocked && (
                          <Badge variant="outline" className="text-xs text-[var(--text-tertiary)]">
                            {t('forum.closed')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-[var(--text-tertiary)]">
                        <span className="flex items-center gap-1">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={thread.author.avatarUrl || undefined} />
                            <AvatarFallback className="text-[8px]">
                              {thread.author.displayName?.[0] || thread.author.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          {thread.author.displayName || thread.author.username}
                        </span>
                        {thread.category && (
                          <span className="bg-[var(--surface-sunken)] px-2 py-0.5 rounded text-[var(--text-secondary)]">
                            {thread.category.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {thread._count.posts}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {thread.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(thread.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </Card>
          </div>
        ) : (
          <EmptyState
            title={t('forum.noThreads')}
            description={t('forum.noThreadsDesc')}
            icon={<MessageSquare className="w-12 h-12 text-[var(--text-tertiary)]" />}
          />
        )}
      </div>
    </div>
  );
}
