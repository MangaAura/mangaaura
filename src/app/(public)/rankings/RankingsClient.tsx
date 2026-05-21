'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Trophy, Users, Crown, Flame, BookOpen } from 'lucide-react';

import { LeaderboardTable } from '@/components/Rankings/LeaderboardTable';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useT } from '@/i18n';

interface RankingsClientProps {
  leaderboards: {
    readers: any[];
    creators: any[];
    clans: any[];
    manga: any[];
  };
  currentUserId?: string;
}

const statCards = [
  {
    key: 'readers',
    labelKey: 'rankings.topReaders',
    count: (lb: RankingsClientProps['leaderboards']) => lb.readers.length,
    icon: Users,
    colorVar: '--info',
  },
  {
    key: 'creators',
    labelKey: 'rankings.topCreators',
    count: (lb: RankingsClientProps['leaderboards']) => lb.creators.length,
    icon: Crown,
    colorVar: '--accent-purple',
  },
  {
    key: 'clans',
    labelKey: 'rankings.topClans',
    count: (lb: RankingsClientProps['leaderboards']) => lb.clans.length,
    icon: Flame,
    colorVar: '--warning',
  },
  {
    key: 'manga',
    labelKey: 'rankings.mangaTrending',
    count: (lb: RankingsClientProps['leaderboards']) => lb.manga.length,
    icon: BookOpen,
    colorVar: '--success',
  },
];

export default function RankingsClient({ leaderboards, currentUserId }: RankingsClientProps) {
  const shouldReduceMotion = useReducedMotion();
  const t = useT();

  return (
    <div className="max-w-6xl mx-auto space-y-10 px-4 sm:px-6 lg:px-8 pt-20 pb-10">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Trophy className="text-[var(--primary)]" size={30} /> {t('rankings.title')}
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">
          {t('rankings.description')}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          const count = stat.count(leaderboards);
          return (
            <motion.div
              key={stat.key}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.06, ease: [0.4, 0, 0.2, 1] }}
              whileHover={shouldReduceMotion ? {} : { y: -3, transition: { duration: 0.2 } }}
            >
              <Card className="p-6 border border-[var(--border)] bg-[var(--surface)] h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{count}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{t(stat.labelKey)}</p>
                  </div>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `var(${stat.colorVar})20` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: `var(${stat.colorVar})` }} />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Leaderboards */}
      <Tabs defaultValue="readers">
        <TabsList className="mb-6">
          <TabsTrigger value="readers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('rankings.readers')}
          </TabsTrigger>
          <TabsTrigger value="creators" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            {t('rankings.creators')}
          </TabsTrigger>
          <TabsTrigger value="clans" className="flex items-center gap-2">
            <Flame className="w-4 h-4" />
            {t('rankings.clans')}
          </TabsTrigger>
          <TabsTrigger value="manga" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {t('rankings.manga')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="readers">
          <LeaderboardTable
            type="readers"
            data={leaderboards.readers}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="creators">
          <LeaderboardTable
            type="creators"
            data={leaderboards.creators}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="clans">
          <LeaderboardTable
            type="clans"
            data={leaderboards.clans}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="manga">
          <LeaderboardTable
            type="manga"
            data={leaderboards.manga}
            currentUserId={currentUserId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
