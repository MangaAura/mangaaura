'use client';

import { Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { MangaCard } from '@/components/MangaCard';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
interface RecommendedManga {
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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function RecommendedForYouSection() {
  const { data: session } = useSession();
  const { data, error, isLoading } = useSWR<{
    recommendations: RecommendedManga[];
    type: string;
  }>('/api/recommendations?limit=10', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120000, // 2 min
  });

  const recs = data?.recommendations ?? [];

  // Don't render for logged-out users if it's just trending
  if (!session?.user && data?.type === 'trending') return null;
  // Don't render if empty
  if (!isLoading && recs.length === 0) return null;

  return (
    <AnimatedContainer viewport>
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--accent-purple)]" />
            Recomendados para ti
          </h2>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-[var(--surface-sunken)] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : error ? null : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recs.map((manga, index) => (
              <AnimatedContainer
                key={manga.id}
                animation="fadeInUp"
                delay={index * 0.06}
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
