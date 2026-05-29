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
import { useSession } from 'next-auth/react';

import { MangaCard } from '@/components/Creator/MangaCard';
import { Skeletons } from '@/components/Skeletons';
import { Button } from '@/components/ui/Button';
import { useCreatorMangas } from '@/hooks/useCreatorMangas';
import { useT } from '@/i18n';
import { cn, formatNumber } from '@/lib/utils';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel del Creador | MangaAura',
  description: 'Panel de control para creadores en MangaAura. Gestiona tus mangas y capítulos.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Panel del Creador | MangaAura',
    description: 'Panel de control para creadores en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Panel del Creador | MangaAura',
    description: 'Panel de control para creadores en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/dashboard' },
};

const QuickActions = [
  {
    href: '/creator/upload',
    icon: LayersIcon,
    titleKey: 'uploadChapter',
    descKey: 'uploadChapterDesc',
    gradient: 'from-indigo-500/20 to-purple-500/20',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-500',
    borderHover: 'hover:border-indigo-500/50',
  },
  {
    href: '/analytics?tab=creator',
    icon: BarChart3Icon,
    titleKey: 'analytics',
    descKey: 'analyticsDesc',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-500',
    borderHover: 'hover:border-emerald-500/50',
  },
  {
    href: '/prompts',
    icon: WandIcon,
    titleKey: 'aiPrompts',
    descKey: 'aiPromptsDesc',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-500',
    borderHover: 'hover:border-amber-500/50',
  },
];

type StatVariant = 'indigo' | 'purple' | 'emerald' | 'amber';

const variantStyles: Record<StatVariant, { bg: string; border: string; icon: string; text: string }> = {
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', icon: 'bg-indigo-500/20', text: 'text-indigo-500' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: 'bg-purple-500/20', text: 'text-purple-500' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: 'bg-emerald-500/20', text: 'text-emerald-500' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'bg-amber-500/20', text: 'text-amber-500' },
};

function StatCard({ title, value, icon: Icon, variant, trend }: {
  title: string;
  value: number;
  icon: React.ElementType;
  variant: StatVariant;
  trend?: number;
}) {
  const styles = variantStyles[variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
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
            <p className="text-4xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums">
              {formatNumber(value)}
            </p>
            {trend !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'inline-flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full',
                  trend >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                )}>
                  <TrendingUpIcon className={cn('w-3.5 h-3.5', trend < 0 && 'rotate-180')} />
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
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
  const { data: session } = useSession();
  const t = useT();
  const { mangas, dashboardStats, isLoading, error, deleteManga } = useCreatorMangas();

  const statsConfig = [
    { key: 'totalMangas', label: t('creatorDashboard.totalMangas'), icon: BookOpenIcon, variant: 'indigo' as StatVariant, value: dashboardStats?.totalMangas ?? 0, trend: undefined as number | undefined },
    { key: 'totalChapters', label: t('creatorDashboard.publishedChapters'), icon: FileTextIcon, variant: 'purple' as StatVariant, value: dashboardStats?.totalChapters ?? 0, trend: undefined as number | undefined },
    { key: 'totalViews', label: t('creatorDashboard.totalViews'), icon: EyeIcon, variant: 'emerald' as StatVariant, value: dashboardStats?.totalViews ?? 0, trend: dashboardStats?.growthRate },
    { key: 'readers', label: t('creatorDashboard.readers'), icon: UsersIcon, variant: 'amber' as StatVariant, value: dashboardStats?.totalReaders ?? dashboardStats?.totalViews ?? 0, trend: undefined as number | undefined },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto space-y-10"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-sm">
                <LayoutDashboardIcon className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                  {t('creatorDashboard.title')}
                </h1>
                <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                  {session?.user?.name ? `${t('common.welcomeBack')}, ${session.user.name}` : t('creatorDashboard.subtitle')}
                </p>
              </div>
            </div>
          </div>
          <Link href="/creator/manga/new" className="shrink-0">
            <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300">
              <PlusIcon className="w-5 h-5 mr-2" />
              {t('creatorDashboard.newManga')}
            </Button>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] p-6 space-y-4">
                  <div className="h-4 w-24 bg-[var(--surface-sunken)] rounded animate-pulse" />
                  <div className="h-10 w-20 bg-[var(--surface-sunken)] rounded animate-pulse" />
                  <div className="h-5 w-16 bg-[var(--surface-sunken)] rounded animate-pulse" />
                </div>
              ))}
            </>
          ) : (
            statsConfig.map((stat, i) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <StatCard
                  title={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                  variant={stat.variant}
                  trend={stat.trend}
                />
              </motion.div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
            className="flex items-center gap-2"
          >
            <SparklesIcon className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Acciones Rápidas
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {QuickActions.map((action, i) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.1, duration: 0.4, ease: 'easeOut' }}
              >
                <QuickActionCard
                  href={action.href}
                  icon={action.icon}
                  title={t(`creatorDashboard.${action.titleKey}`)}
                  desc={t(`creatorDashboard.${action.descKey}`)}
                  gradient={action.gradient}
                  iconBg={action.iconBg}
                  iconColor={action.iconColor}
                  borderHover={action.borderHover}
                />
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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BookOpenIcon className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {t('creatorDashboard.myManga')}
              </h2>
              <span className="text-sm text-[var(--text-tertiary)] font-medium px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)]">
                {dashboardStats?.totalMangas ?? 0}
              </span>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
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
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center"
                role="alert"
              >
                <p className="text-red-500 font-medium">{error instanceof Error ? error.message : String(error)}</p>
                <Button variant="outline" className="mt-4">{t('creatorDashboard.retry')}</Button>
              </motion.div>
            ) : mangas.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
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
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              >
                {mangas.map((manga, i) => (
                  <motion.div
                    key={manga.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
                  >
                    <MangaCard manga={manga} onDelete={deleteManga} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
