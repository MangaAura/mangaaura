'use client';

import { BookOpen, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useT } from '@/i18n';

export function ContinueReadingSection() {
  const { data: session } = useSession();
  const { progress } = useReadingProgress();
  const t = useT();

  if (!session?.user) return null;

  const inProgressMangas = progress
    .filter((p) => p.manga && p.chapter && p.percentage < 90)
    .slice(0, 5);

  if (inProgressMangas.length === 0) return null;

  return (
    <AnimatedContainer viewport>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-[var(--primary)]" />
            {t('home.continueReading')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {inProgressMangas.map((p) => (
              <Link
                key={`${p.mangaId}-${p.chapterId}`}
                href={`/${p.manga?.slug || ''}-${p.chapter?.chapterNumber || ''}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface)] transition-colors group"
              >
                <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 relative bg-[var(--surface-sunken)]">
                  {p.manga?.coverUrl ? (
                    <img src={p.manga.coverUrl} alt={p.manga.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-[var(--text-tertiary)]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-[var(--primary)] transition-colors">
                    {p.manga?.title}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Cap. {p.chapter?.chapterNumber}
                    {p.chapter?.title && ` - ${p.chapter.title}`}
                  </p>
                  <div className="w-full h-1.5 bg-[var(--surface-sunken)] rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] rounded-full transition-all"
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
          <Link href="/library">
            <Button variant="outline" className="w-full mt-3">{t('home.viewLibrary')}</Button>
          </Link>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}
