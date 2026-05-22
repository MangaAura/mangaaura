import { Suspense } from 'react';

import { CorrectionsClient } from './CorrectionsClient';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Correcciones | MangaAura',
  description: 'Revisa y envía correcciones de capítulos',
};

interface CorrectionItem {
  id: string;
  correctionText: string;
  createdAt: Date;
  status: string;
  chapter: {
    chapterNumber: number;
    manga: { slug: string; title: string };
  };
}

async function getCorrections(userId: string): Promise<CorrectionItem[]> {
  const corrections = await prisma.chapterCorrection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      chapter: { select: { chapterNumber: true, manga: { select: { slug: true, title: true } } } },
    },
  });
  return corrections as CorrectionItem[];
}

export default async function CorrectionsPage() {
  const session = await auth();
  if (!session?.user?.id) return <div>Inicia sesión para ver tus correcciones</div>;
  const corrections = await getCorrections(session.user.id);

  return (
    <Suspense fallback={<div className="animate-pulse h-96" />}>
      <CorrectionsClient corrections={corrections} />
    </Suspense>
  );
}
