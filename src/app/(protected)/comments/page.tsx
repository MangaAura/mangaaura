import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { MessageSquare } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { CommentsClient } from './CommentsClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.comments.title');
  const description = t('page.comments.description');

  return {
    title,
    description,
  };
}

interface CommentWithRelations {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  chapterId: string;
  parentId: string | null;
  likesCount: number;
  isDeleted: boolean;
  isHidden: boolean;
  hiddenReason: string | null;
  chapter: {
    id: string;
    chapterNumber: number;
    title: string | null;
    manga: { id: string; title: string; slug: string; coverUrl: string | null };
  } | null;
  _count: { likes: number; replies: number };
}

async function getUserComments(userId: string): Promise<CommentWithRelations[]> {
  const comments = await prisma.comment.findMany({
    where: { userId, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      chapter: {
        select: { id: true, chapterNumber: true, title: true, manga: { select: { id: true, title: true, slug: true, coverUrl: true } } },
      },
      _count: { select: { likes: true, replies: true } },
    },
  });
  return comments as unknown as CommentWithRelations[];
}

export default async function CommentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const comments = await getUserComments(session.user.id);
  const validComments = comments.filter(
  (c): c is CommentWithRelations & { chapter: NonNullable<CommentWithRelations['chapter']> } =>
    c.chapter !== null,
);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <MessageSquare className="text-[var(--primary)]" size={30} /> Mis Comentarios
        </h1>
        <p className="text-muted">{validComments.length} comentario{validComments.length !== 1 ? 's' : ''} en total</p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-96 bg-tertiary rounded-xl" />}>
        <CommentsClient comments={validComments} />
      </Suspense>
    </div>
  );
}
