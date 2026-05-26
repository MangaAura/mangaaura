import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MessageSquare,
  Clock,
  Eye,
  Pin,
  Lock,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ForumThreadClient } from './ForumThreadClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';



interface ForumThreadPageProps {
  params: Promise<{ slug: string }>;
}

const roleBadgeStyles: Record<string, { className: string; label: string }> = {
  ADMIN: { className: 'bg-[var(--error)]/10 text-[var(--error)]', label: 'Admin' },
  MODERATOR: { className: 'bg-[var(--info)]/10 text-[var(--info)]', label: 'Moderador' },
};

async function getThreadData(slug: string) {
  const thread = await prisma.forumThread.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
      },
      category: { select: { id: true, name: true, slug: true, icon: true } },
    },
  });

  if (!thread) return null;

  await prisma.forumThread.update({
    where: { id: thread.id },
    data: { viewCount: { increment: 1 } },
  });

  const posts = await prisma.forumPost.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: 'asc' },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
      },
    },
  });

  return { thread: { ...thread, viewCount: thread.viewCount + 1 }, posts };
}

export async function generateMetadata({ params }: ForumThreadPageProps): Promise<Metadata> {
  const { slug } = await params;
  const thread = await prisma.forumThread.findUnique({
    where: { slug },
    select: { title: true, content: true, createdAt: true, author: { select: { username: true, displayName: true } } },
  });
  if (!thread) {
    return { title: 'Foro | MangaAura' };
  }
  const authorName = thread.author?.displayName || thread.author?.username || '';
  const description = thread.content?.replace(/<[^>]*>/g, '').slice(0, 160) || `Hilo de ${authorName} en el foro de MangaAura`;

  const ogImage = `/api/og?type=forum&title=${encodeURIComponent(thread.title)}&author=${encodeURIComponent(authorName)}`;

  return {
    title: `${thread.title} | Foro | MangaAura`,
    description,
    openGraph: {
      title: `${thread.title} | Foro | MangaAura`,
      description,
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: thread.title }],
      publishedTime: thread.createdAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${thread.title} | Foro | MangaAura`,
      description,
      images: [ogImage],
    },
  };
}

export default async function ForumThreadPage({ params }: ForumThreadPageProps) {
  const { slug } = await params;
  const session = await auth();
  const data = await getThreadData(slug);

  if (!data) {
    notFound();
  }

  const { thread, posts } = data;
  const tags = (() => {
    try {
      return JSON.parse(thread.tags || '[]') as string[];
    } catch {
      return [] as string[];
    }
  })();

  const canReply = !!(session?.user?.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/community/forum"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al foro
        </Link>

        {/* Thread header */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-2 flex-wrap mb-3">
            {thread.isPinned && (
              <Pin className="w-4 h-4 text-[var(--warning)]" />
            )}
            {thread.isLocked && (
              <Lock className="w-4 h-4 text-[var(--text-tertiary)]" />
            )}
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {thread.title}
            </h1>
            {thread.isLocked && (
              <Badge variant="outline" className="text-xs ml-2">
                Cerrado
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-4">
            <Link
              href={`/user/${thread.author.username}`}
              className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={thread.author.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {thread.author.displayName?.[0] || thread.author.username[0]}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{thread.author.displayName || thread.author.username}</span>
              {thread.author.role !== 'USER' && (
                <Badge className={roleBadgeStyles[thread.author.role]?.className || 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] text-xs'}>
                  {roleBadgeStyles[thread.author.role]?.label || thread.author.role}
                </Badge>
              )}
            </Link>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDistanceToNow(new Date(thread.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
            {thread.category && (
              <Link
                href={`/community/forum?category=${thread.category.slug}`}
                className="bg-[var(--surface-sunken)] px-2 py-0.5 rounded text-xs hover:bg-[var(--border)] transition-colors"
              >
                {thread.category.name}
              </Link>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {thread.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {posts.length}
            </span>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--primary-subtle)] text-[var(--primary)] text-xs rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
            <div className="whitespace-pre-wrap">{thread.content}</div>
          </div>
        </Card>

        {/* Posts & Reply */}
        <ForumThreadClient
          thread={{
            id: thread.id,
            slug: thread.slug,
            author: { id: thread.author.id, username: thread.author.username, displayName: thread.author.displayName },
            isLocked: thread.isLocked,
          }}
          posts={posts}
          canReply={canReply}
          isLoggedIn={!!session?.user?.id}
        />
      </div>
    </div>
  );
}
