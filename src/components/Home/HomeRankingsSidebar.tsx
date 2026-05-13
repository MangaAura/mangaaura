'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface RankingManga {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  totalViews: number;
}

interface HomeRankingsSidebarProps {
  topMangas: any[];
}

const formatViews = (views: number): string => {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
  return views.toString();
};

export function HomeRankingsSidebar({ topMangas }: HomeRankingsSidebarProps) {
  const [rankingTab, setRankingTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const rankings: RankingManga[] = useMemo(() => {
    return topMangas.map((m: any) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      coverUrl: m.coverUrl,
      totalViews: m.totalViews,
    }));
  }, [topMangas]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-accent-red" /> Top Rankings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex bg-tertiary rounded-lg p-1 mb-5">
          {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setRankingTab(tab)}
              className={`flex-1 text-xs font-bold py-1.5 rounded transition-colors ${
                rankingTab === tab
                  ? 'bg-secondary shadow-sm text-fg-primary'
                  : 'text-muted hover:text-fg-primary'
              }`}
            >
              {tab === 'daily' ? 'Diario' : tab === 'weekly' ? 'Semanal' : 'Mensual'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {rankings.map((manga, i) => {
            const rankColor =
              i === 0 ? 'text-[var(--warning)]' : i === 1 ? 'text-[var(--text-tertiary)]' : i === 2 ? 'text-[var(--accent-orange)]' : 'text-muted';

            return (
              <Link
                key={manga.id}
                href={`/manga/${manga.slug || manga.id}`}
                className="flex items-center gap-4 group p-2 hover:bg-tertiary rounded-xl transition-colors"
              >
                <div className={`w-6 text-center font-black text-lg ${rankColor}`}>
                  {i + 1}
                </div>
                {manga.coverUrl ? (
                  <Image
                    src={manga.coverUrl}
                    alt={manga.title}
                    width={48}
                    height={64}
                    className="w-12 h-16 rounded object-cover shadow-sm"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-16 rounded bg-tertiary flex items-center justify-center shadow-sm">
                    <span className="text-lg font-bold text-muted">{manga.title.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate group-hover:text-accent-blue transition-colors">
                    {manga.title}
                  </h4>
                  <p className="text-xs text-muted">{formatViews(manga.totalViews)} vistas</p>
                </div>
              </Link>
            );
          })}
        </div>

        <Link href="/rankings">
          <button className="w-full mt-4 py-2 border border-custom text-xs font-bold rounded-lg hover:bg-tertiary transition-colors">
            Ver Ranking Completo
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}
