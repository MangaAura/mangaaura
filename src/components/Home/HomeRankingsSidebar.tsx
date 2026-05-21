'use client';

import { AnimatePresence, motion, useMotionValue, animate, useInView } from 'framer-motion';
import { TrendingUp, Trophy, Award } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';
import useSWR from 'swr';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useT } from '@/i18n';

interface RankingManga {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  totalViews: number;
}

interface HomeRankingsSidebarProps {
  topMangas?: any[];
}

const TIME_RANGE_MAP = { daily: 'day', weekly: 'week', monthly: 'month' } as const;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const formatViews = (views: number): string => {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
  return views.toString();
};

function AnimatedCount({ value }: { value: number }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(formatViews(value));

  useEffect(() => {
    count.set(0);
    setDisplay('0');
    const controls = animate(count, value, { duration: 1, ease: 'easeOut' });
    const unsubscribe = count.on('change', (v) => {
      setDisplay(formatViews(Math.round(v)));
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, count]);

  return <span>{display}</span>;
}

function RankingItem({ manga, index, t }: { manga: RankingManga; index: number; t: (key: string) => string }) {
  const RankIcon = index === 0 ? Trophy : Award;
  const iconColor =
    index === 0
      ? 'text-[var(--warning)]'
      : index === 1
        ? 'text-[var(--text-tertiary)]'
        : index === 2
          ? 'text-[var(--accent-orange)]'
          : '';

  return (
    <Link
      href={`/manga/${manga.slug || manga.id}`}
      className="flex items-center gap-4 group p-2 hover:bg-tertiary rounded-xl transition-colors"
    >
      <div className="w-6 text-center font-black text-lg flex items-center justify-center">
        {index < 3 ? (
          <RankIcon className={`w-5 h-5 ${iconColor}`} />
        ) : (
          <span className="text-muted">{index + 1}</span>
        )}
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
        <p className="text-xs text-muted">
          <AnimatedCount value={manga.totalViews} /> {t('home.views')}
        </p>
      </div>
    </Link>
  );
}

function RankingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-2">
          <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
          <Skeleton variant="image" className="w-12 h-16 !rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="title" />
            <Skeleton variant="text" className="w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const TAB_KEYS: Record<string, string> = {
  daily: 'rankings.daily',
  weekly: 'rankings.weekly',
  monthly: 'rankings.monthly',
};

export function HomeRankingsSidebar({ topMangas = [] }: HomeRankingsSidebarProps) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const { data, isLoading } = useSWR(
    isInView
      ? `/api/rankings?type=views&timeRange=${TIME_RANGE_MAP[activeTab]}&limit=5`
      : null,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const rankings: RankingManga[] = useMemo(() => {
    const source = data?.mangas || data?.results || topMangas;
    return (Array.isArray(source) ? source : []).map((m: any) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      coverUrl: m.coverUrl,
      totalViews: m.totalViews ?? 0,
    }));
  }, [data, topMangas]);

  const showSkeleton = isLoading && rankings.length === 0;

  return (
    <aside aria-label={t('home.topMangas')}>
    <Card ref={ref}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-accent-red" /> {t('home.topMangas')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex bg-tertiary rounded-lg p-1 mb-5">
          {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs font-bold py-1.5 rounded transition-colors ${
                activeTab === tab
                  ? 'bg-secondary shadow-sm text-fg-primary'
                  : 'text-muted hover:text-fg-primary'
              }`}
            >
               {t(TAB_KEYS[tab] || tab)}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {showSkeleton ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RankingSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <motion.ul
                className="space-y-4"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {rankings.map((manga, i) => (
                  <motion.li key={manga.id} variants={itemVariants}>
                    <RankingItem manga={manga} index={i} t={t} />
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>

        <Link href="/rankings">
          <Button variant="outline" className="w-full mt-4">
            {t('home.viewFullRankings')}
          </Button>
        </Link>
      </CardContent>
    </Card>
    </aside>
  );
}
