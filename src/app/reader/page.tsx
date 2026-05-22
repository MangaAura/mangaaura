import type { Metadata } from 'next';
import { Suspense } from 'react';

import ReaderContent from './ReaderContent';

export const metadata: Metadata = {
  title: 'Lector | MangaAura',
  description: 'Disfruta de la lectura de tus mangas favoritos',
};

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center" role="status">
      <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ReaderContent />
    </Suspense>
  );
}
