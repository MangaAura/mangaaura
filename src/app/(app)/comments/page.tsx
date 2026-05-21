import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { CommentsClient } from './CommentsClient';
import { MessageSquare } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Mis Comentarios | InkVerse',
  description: 'Administra todos tus comentarios en InkVerse',
};

async function getUserComments(userId: string) {
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
  return comments as any;
}

export default async function CommentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/login');

  const comments = await getUserComments(session.user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <MessageSquare className="text-[var(--primary)]" size={30} /> Mis Comentarios
        </h1>
        <p className="text-muted">{comments.length} comentario{comments.length !== 1 ? 's' : ''} en total</p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-96 bg-tertiary rounded-xl" />}>
        <CommentsClient comments={comments} />
      </Suspense>
    </div>
  );
}
