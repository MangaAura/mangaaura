'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpenIcon,
  EyeIcon,
  UsersIcon,
  FileTextIcon,
  PlusIcon,
  BarChart3Icon,
  SparklesIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  LayersIcon,
  WandIcon,
  LayoutDashboardIcon,
} from 'lucide-react';
import Link from 'next/link';

import { MangaCard } from '@/components/Creator/MangaCard';
import { Sidebar } from '@/components/Creator/Sidebar';
import { Skeletons } from '@/components/Skeletons';
import { Button } from '@/components/ui/Button';
import { useCreatorMangas } from '@/hooks/useCreatorMangas';
import { useT } from '@/i18n';
import { cn, formatNumber } from '@/lib/utils';

const QuickActions = [
  {
    href: '/creator/upload',
    icon: LayersIcon,
    title: 'uploadChapter',
    desc: 'uploadChapterDesc',
    gradient: 'from-indigo-500/20 to-purple-500/20',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-500',
    borderHover: 'hover:border-indigo-500/50',
  },
  {
    href: '/analytics?tab=creator',
    icon: BarChart3Icon,
    title: 'analytics',
    desc: 'analyticsDesc',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-500',
    borderHover: 'hover:border-emerald-500/50',
  },
  {
    href: '/prompts',
    icon: WandIcon,
    title: 'aiPrompts',
    desc: 'aiPromptsDesc',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-500',
    borderHover: 'hover:border-amber-500/50',
  },
];

const stats = [
  { key: 'totalMangas', label: 'totalMangas', icon: BookOpenIcon, value: 0, variant: 'indigo' as const, trend: null },
  { key: 'totalChapters', label: 'publishedChapters', icon: FileTextIcon, value: 0, variant: 'purple' as const, trend: 8 },
  { key: 'totalViews', label: 'totalViews', icon: EyeIcon, value: 0, variant: 'green' as const, trend: 12.5 },
  { key: 'readers', label: 'readers', icon: UsersIcon, value: 0, variant: 'amber' as const, trend: 5.3 },
] as const;

const variantStyles = {
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', icon: 'bg-indigo-500/20', text: 'text-indigo-500' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: 'bg-purple-500/20', text: 'text-purple-500' },
  green: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: 'bg-emerald-500/20', text: 'text-emerald-500' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'bg-amber-500/20', text: 'text-amber-500' },
};

function StatCard({ title, value, icon: Icon, variant, trend, trendLabel }: {
  title: string;
  value: number;
  icon: React.ElementType;
  variant: 'indigo' | 'purple' | 'green' | 'amber';
  trend?: number | null;
  trendLabel?: string;
}) {
  const styles = variantStyles[variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-[var(--surface-elevated)] p-6 shadow-sm transition-all duration-300 hover:shadow-md',
        styles.border
      )}
    >
      <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500', styles.bg)} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
            <p className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              {formatNumber(value)}
            </p>
            {trend !== null && trend !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'inline-flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full',
                  trend >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                )}>
                  <TrendingUpIcon className={cn('w-3 h-3', trend < 0 && 'rotate-180')} />
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
                {trendLabel && <span className="text-xs text-[var(--text-tertiary)]">{trendLabel}</span>}
              </div>
            )}
          </div>
          <div className={cn('p-3.5 rounded-xl shadow-sm', styles.icon)}>
            <Icon className={cn('w-6 h-6', styles.text)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickActionCard({ href, icon: Icon, title, desc, gradient, iconBg, iconColor, borderHover }: {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  gradient: string;
  iconBg: string;
  iconColor: string;
  borderHover: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Link href={href}>
        <div className={cn(
          'group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 transition-all duration-300 hover:shadow-lg',
          borderHover
        )}>
          <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br', gradient)} />
          <div className="relative flex items-start gap-4">
            <div className={cn('p-3 rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110', iconBg)}>
              <Icon className={cn('w-6 h-6', iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                {title}
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] mt-1 line-clamp-2">
                {desc}
              </p>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-[var(--text-tertiary)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--primary)]" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CreatorDashboardPage() {
  const t = useT();
  const { mangas, dashboardStats, isLoading, error, deleteMangaOptimistic } = useCreatorMangas();

  const statsData = [
    { label: t('creatorDashboard.totalMangas'), value: dashboardStats?.totalMangas ?? 0 },
    { label: t('creatorDashboard.publishedChapters'), value: dashboardStats?.totalChapters ?? 0 },
    { label: t('creatorDashboard.totalViews'), value: dashboardStats?.totalViews ?? 0 },
    { label: t('creatorDashboard.readers'), value: dashboardStats?.totalViews ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="lg:hidden">
        <Sidebar className="w-full" />
      </div>

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                  <LayoutDashboardIcon className="w-6 h-6 text-indigo-500" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                  {t('creatorDashboard.title')}
                </h1>
              </div>
              <p className="text-[var(--text-tertiary)] ml-1">
                {t('creatorDashboard.subtitle')}
              </p>
            </div>
            <Link href="/creator/manga/new" className="shrink-0">
              <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-shadow">
                <PlusIcon className="w-5 h-5 mr-2" />
                {t('creatorDashboard.newManga')}
              </Button>
            </Link>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {isLoading ? (
              <>
                <Skeletons.MangaCard />
                <Skeletons.MangaCard />
                <Skeletons.MangaCard />
                <Skeletons.MangaCard />
              </>
            ) : (
              stats.map((stat, i) => (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
                >
                  <StatCard
                    title={stat.label}
                    value={statsData.find(s => s.label === stat.label)?.value ?? 0}
                    icon={stat.icon}
                    variant={stat.variant}
                    trend={stat.trend}
                    trendLabel={stat.trend ? t('creatorDashboard.thisMonth') : undefined}
                  />
                </motion.div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
              className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2"
            >
              <SparklesIcon className="w-5 h-5 text-amber-500" />
              Acciones Rápidas
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {QuickActions.map((action, i) => (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.4, ease: 'easeOut' }}
                >
                  <QuickActionCard {...action} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mangas Section */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4, ease: 'easeOut' }}
              className="flex items-center justify-between"
            >
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <BookOpenIcon className="w-6 h-6 text-purple-500" />
                {t('creatorDashboard.myManga')}
              </h2>
              <Link href="/creator/dashboard" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors flex items-center gap-1">
                {t('creatorDashboard.viewAll')}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </motion.div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                >
                  {[...Array(4)].map((_, i) => (
                    <Skeletons.MangaCard key={i} />
                  ))}
                </motion.div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center"
                  role="alert"
                >
                  <p className="text-red-500 font-medium">{error instanceof Error ? error.message : String(error)}</p>
                  <Button variant="outline" className="mt-4">
                    {t('creatorDashboard.retry')}
                  </Button>
                </motion.div>
              ) : mangas.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-12 text-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <BookOpenIcon className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
                      {t('creatorDashboard.noMangaYet')}
                    </h3>
                    <p className="text-[var(--text-tertiary)] mb-8 max-w-md mx-auto">
                      {t('creatorDashboard.noMangaYetDesc')}
                    </p>
                    <Link href="/creator/manga/new">
                      <Button size="lg" className="shadow-lg shadow-indigo-500/20">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('creatorDashboard.createFirstManga')}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                >
                  {mangas.map((manga, i) => (
                    <motion.div
                      key={manga.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
                    >
                      <MangaCard manga={manga} onDelete={deleteMangaOptimistic} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
