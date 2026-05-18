import { Suspense } from 'react';

import { ReadingHistoryClient } from './ReadingHistoryClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Historial de Lectura | InkVerse',
  description: 'Revisa todo tu historial de lectura en InkVerse',
};

async function getReadingHistory(userId: string) {
  const [progress, sessionStats] = await Promise.all([
    prisma.readingProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: {
        manga: { select: { id: true, title: true, slug: true, coverUrl: true } },
        chapter: { select: { id: true, chapterNumber: true, title: true } },
      },
    }),
    prisma.readingSession.aggregate({
      where: { userId },
      _sum: { durationSeconds: true },
      _count: true,
    }),
  ]);

  const totalReadingTime = sessionStats._sum.durationSeconds || 0;
  const totalSessions = sessionStats._count;

  const mangaCount = new Set(progress.map(p => p.mangaId)).size;
  const completedCount = progress.filter(p => p.completed).length;

  return { progress: progress as any, totalReadingTime, totalSessions, mangaCount, completedCount };
}

export default async function ReadingHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted">Inicia sesión para ver tu historial</div>;

  const { progress, totalReadingTime, totalSessions, mangaCount, completedCount } = await getReadingHistory(session.user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Historial de Lectura</h1>
        <p className="text-muted">Todos los capítulos que has leído</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary border border-custom rounded-xl p-4">
          <p className="text-2xl font-bold">{progress.length}</p>
          <p className="text-xs text-muted">Capítulos leídos</p>
        </div>
        <div className="bg-secondary border border-custom rounded-xl p-4">
          <p className="text-2xl font-bold">{mangaCount}</p>
          <p className="text-xs text-muted">Mangas diferentes</p>
        </div>
        <div className="bg-secondary border border-custom rounded-xl p-4">
          <p className="text-2xl font-bold text-accent-green">{completedCount}</p>
          <p className="text-xs text-muted">Completados</p>
        </div>
        <div className="bg-secondary border border-custom rounded-xl p-4">
          <p className="text-2xl font-bold text-accent-blue">{Math.floor(totalReadingTime / 60)}m</p>
          <p className="text-xs text-muted">Tiempo total ({totalSessions} sesiones)</p>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse h-96 bg-tertiary rounded-xl" />}>
        <ReadingHistoryClient progress={progress} />
      </Suspense>
    </div>
  );
}
