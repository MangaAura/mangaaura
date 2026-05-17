import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CorrectionsClient } from './CorrectionsClient';

export const metadata = {
  title: 'Correcciones | InkVerse',
  description: 'Revisa y envía correcciones de capítulos',
};

async function getCorrections(userId: string) {
  const corrections = await prisma.chapterCorrection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      chapter: { select: { chapterNumber: true, manga: { select: { slug: true, title: true } } } },
    },
  });
  return corrections;
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
