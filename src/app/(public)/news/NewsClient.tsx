'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Newspaper,
  Star,
  Palette,
  Smartphone,
  Trophy,
  Sparkles,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import { Container } from '@/components/Layout/Container';
import { useT, useLocale } from '@/i18n';
import {
  dbArticleToDisplayItem,
  getArticlePath,
  type DisplayNewsItem,
} from '@/lib/news';
import { fetcher } from '@/lib/swr-config';

const iconMap: Record<string, React.ReactNode> = {
  community: <Star size={16} aria-hidden="true" />,
  platform: <Palette size={16} aria-hidden="true" />,
  tools: <Sparkles size={16} aria-hidden="true" />,
  mobile: <Smartphone size={16} aria-hidden="true" />,
  contest: <Trophy size={16} aria-hidden="true" />,
};

const categoryLabelKey: Record<string, string> = {
  community: 'home.newsCategoryCommunity',
  platform: 'home.newsCategoryPlatform',
  tools: 'home.newsCategoryTools',
  mobile: 'home.newsCategoryMobile',
  contest: 'home.newsCategoryContest',
};

const categoryTheme: Record<string, string> = {
  community:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-300 data-[active=true]:ring-1 data-[active=true]:ring-amber-500/30',
  platform:
    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 data-[active=true]:bg-indigo-500/20 data-[active=true]:text-indigo-300 data-[active=true]:ring-1 data-[active=true]:ring-indigo-500/30',
  tools:
    'bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 data-[active=true]:bg-sky-500/20 data-[active=true]:text-sky-300 data-[active=true]:ring-1 data-[active=true]:ring-sky-500/30',
  mobile:
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 data-[active=true]:bg-emerald-500/20 data-[active=true]:text-emerald-300 data-[active=true]:ring-1 data-[active=true]:ring-emerald-500/30',
  contest:
    'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 data-[active=true]:bg-rose-500/20 data-[active=true]:text-rose-300 data-[active=true]:ring-1 data-[active=true]:ring-rose-500/30',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const ARTICLES_PER_PAGE = 12;

export function NewsClient() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const activeCategory = searchParams.get('category') || 'all';

  // Fetch DB articles, fallback to static
  const { data } = useSWR<{ articles: unknown[] }>('/api/news', fetcher, {
    refreshInterval: 60000,
    fallbackData: { articles: [] },
  });

  const dbArticles: DisplayNewsItem[] = (data?.articles || [])
    .map((a: unknown) => dbArticleToDisplayItem(a as Parameters<typeof dbArticleToDisplayItem>[0]));

  const allArticles: DisplayNewsItem[] = dbArticles;

  const categories = [
    ...new Set(allArticles.map((a) => a.category)),
  ];

  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const filtered =
    activeCategory === 'all'
      ? allArticles
      : allArticles.filter((a) => a.category === activeCategory);

  const totalPages = Math.ceil(filtered.length / ARTICLES_PER_PAGE);
  const safePage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const paginatedArticles = filtered.slice(
    (safePage - 1) * ARTICLES_PER_PAGE,
    safePage * ARTICLES_PER_PAGE
  );

  const isEnglish = locale === 'en';

  const buildUrl = (overrides: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    const qs = p.toString();
    return `/news${qs ? `?${qs}` : ''}`;
  };

  const getCategoryLabel = (item: DisplayNewsItem) => {
    const key = categoryLabelKey[item.category];
    return key ? t(key) : item.category.charAt(0).toUpperCase() + item.category.slice(1);
  };

  return (
    <Container className="pt-20 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Newspaper className="text-[var(--primary)]" size={30} />
          {t('home.newsTitle')}
        </h1>
        <p className="text-muted mt-1">{t('home.newsPageDesc')}</p>
      </div>

      <nav
        aria-label={t('home.newsCategoriesAria')}
        className="flex flex-wrap gap-2 mb-8"
      >
        <Link
          href="/news"
          data-active={activeCategory === 'all'}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full transition-all bg-secondary text-muted hover:text-fg-primary data-[active=true]:bg-[var(--primary-subtle)] data-[active=true]:text-[var(--primary)] data-[active=true]:ring-1 data-[active=true]:ring-[var(--primary)]/30"
        >
          <LayoutGrid size={14} aria-hidden="true" />
          {t('common.all')}
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/news?category=${cat}`}
            data-active={activeCategory === cat}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full transition-all ${categoryTheme[cat] || categoryTheme.platform}`}
          >
            {iconMap[cat]}
            {t(categoryLabelKey[cat] || cat)}
          </Link>
        ))}
      </nav>

      <motion.div
        key={safePage}
        className="space-y-4"
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial={prefersReducedMotion ? undefined : 'hidden'}
        animate={prefersReducedMotion ? undefined : 'visible'}
      >
        {paginatedArticles.map((item) => (
          <motion.div
            key={item.slug}
            variants={prefersReducedMotion ? undefined : itemVariants}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            style={{ willChange: 'transform' }}
          >
          <Link href={getArticlePath(item)}>
            <article className="bg-secondary border border-custom rounded-xl p-5 md:p-6 hover:border-[var(--primary)] transition-colors">
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="relative w-20 h-14 sm:w-[120px] sm:h-[68px] shrink-0 rounded-lg overflow-hidden bg-[var(--surface-sunken)] mt-1">
                  {item.coverUrl ? (
                    <Image
                      src={item.coverUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 80px, 120px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                      <Newspaper size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary-subtle)] shrink-0">
                      {iconMap[item.iconType] || iconMap.platform}
                    </span>
                    {item.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-bold mr-1">
                        <Star className="w-2.5 h-2.5 fill-amber-300" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/news?category=${item.category}`);
                      }}
                      className="bg-[var(--primary-subtle)] text-[var(--primary)] text-xs font-bold inline-block px-2 py-1 rounded hover:bg-[var(--primary)] hover:text-white transition-colors"
                    >
                      {getCategoryLabel(item)}
                    </button>
                    <time className="text-xs text-muted">{item.date}</time>
                  </div>
                  <h2 className="font-bold text-lg mb-1">
                    {isEnglish && item.titleEn
                      ? item.titleEn
                      : item.title}
                  </h2>
                  <p className="text-sm text-muted">
                    {isEnglish && item.descriptionEn
                      ? item.descriptionEn
                      : item.description}
                  </p>
                </div>
              </div>
            </article>
          </Link>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <p className="text-center text-muted py-16">
          {t('home.newsEmpty')}
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 mt-10">
          <p className="text-xs text-[var(--text-secondary)]">
            {t('home.newsShowingResults', {
              start: (safePage - 1) * ARTICLES_PER_PAGE + 1,
              end: Math.min(safePage * ARTICLES_PER_PAGE, filtered.length),
              total: filtered.length,
            })}
          </p>
          <nav
            aria-label={t('home.newsPaginationAria')}
            className="flex items-center justify-center gap-3"
          >
          <Link
            href={buildUrl({ page: String(safePage - 1) })}
            scroll={false}
            className={`flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] disabled:opacity-30 disabled:cursor-not-allowed transition-all ${
              safePage <= 1
                ? 'pointer-events-none opacity-30'
                : ''
            }`}
            aria-disabled={safePage <= 1}
            tabIndex={safePage <= 1 ? -1 : 0}
          >
            <ChevronLeft size={16} />
            {t('common.previous')}
          </Link>
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            {safePage} / {totalPages}
          </span>
          <Link
            href={buildUrl({ page: String(safePage + 1) })}
            scroll={false}
            className={`flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] disabled:opacity-30 disabled:cursor-not-allowed transition-all ${
              safePage >= totalPages
                ? 'pointer-events-none opacity-30'
                : ''
            }`}
            aria-disabled={safePage >= totalPages}
            tabIndex={safePage >= totalPages ? -1 : 0}
          >
            {t('common.next')}
            <ChevronRight size={16} />
          </Link>
          </nav>
        </div>
      )}
    </Container>
  );
}
