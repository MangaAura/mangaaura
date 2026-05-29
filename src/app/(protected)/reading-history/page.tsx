import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { BookOpen } from 'lucide-react';
import { Suspense } from 'react';

import { ReadingHistoryClient, type ReadingEntry } from './ReadingHistoryClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.readingHistory.title');
  const description = t('page.readingHistory.description');

  return {
    title,
    description,
  };
}

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

  return { progress: progress as unknown as ReadingEntry[], totalReadingTime, totalSessions, mangaCount, completedCount };
}

export default async function ReadingHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted">Inicia sesión para ver tu historial</div>;

  const { progress, totalReadingTime, totalSessions, mangaCount, completedCount } = await getReadingHistory(session.user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <BookOpen className="text-[var(--primary)]" size={30} /> Historial de Lectura
        </h1>
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
