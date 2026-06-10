'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

import { MangaCard } from '@/components/MangaCard';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { Button } from '@/components/ui/Button';

interface SimilarManga {
  id: string;
  title: string;
  slug?: string;
  coverUrl?: string | null;
  status?: string;
  rating?: number;
  totalViews?: number;
  authorName?: string | null;
  _count?: { chapters: number };
}

interface SimilarMangasSectionProps {
  mangaId: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SimilarMangasSection({ mangaId }: SimilarMangasSectionProps) {
  const { data, error, isLoading } = useSWR<{
    recommendations: SimilarManga[];
  }>(`/api/manga/${mangaId}/similar`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120000,
  });

  const recs = data?.recommendations ?? [];

  if (!isLoading && recs.length === 0) return null;

  return (
    <AnimatedContainer viewport>
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--accent-purple)]" />
            Mangas Similares
          </h2>
          <Link href="/explore">
            <Button variant="ghost" size="sm">
              Ver todos →
            </Button>
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-[var(--surface-sunken)] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : error ? null : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recs.map((manga, index) => (
              <AnimatedContainer
                key={manga.id}
                animation="fadeInUp"
                delay={index * 0.05}
              >
                <MangaCard manga={manga} />
              </AnimatedContainer>
            ))}
          </div>
        )}
      </section>
    </AnimatedContainer>
  );
}
