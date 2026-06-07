'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  BookOpen,
  Star,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  User,
  Calendar,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';

import { Container } from '@/components/Layout/Container';
import { useT, useLocale } from '@/i18n';
import {
  dbArticleToDisplayItem,
  getArticlePath,
  type DisplayNewsItem,
} from '@/lib/news';
import { fetcher } from '@/lib/swr-config';

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

const categoryGradient: Record<string, string> = {
  community: 'from-amber-500/80 via-amber-500/20 to-transparent',
  platform: 'from-indigo-500/80 via-indigo-500/20 to-transparent',
  tools: 'from-sky-500/80 via-sky-500/20 to-transparent',
  mobile: 'from-emerald-500/80 via-emerald-500/20 to-transparent',
  contest: 'from-rose-500/80 via-rose-500/20 to-transparent',
};

const categoryBadgeStyle: Record<string, string> = {
  community: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
  platform: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30',
  tools: 'bg-sky-500 text-white shadow-lg shadow-sky-500/30',
  mobile: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
  contest: 'bg-rose-500 text-white shadow-lg shadow-rose-500/30',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const featuredVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const ARTICLES_PER_PAGE = 12;

interface BlogClientProps {
  initialArticles?: unknown[];
}

export function BlogClient({ initialArticles }: BlogClientProps) {
  const t = useT();
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const activeCategory = searchParams.get('category') || 'all';
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'title_desc'>('date_desc');

  const { data } = useSWR<{ articles: unknown[] }>('/api/blog', fetcher, {
    refreshInterval: 60000,
    fallbackData: { articles: initialArticles ?? [] },
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

  const getSortComparator = (sort: typeof sortBy) => {
    switch (sort) {
      case 'date_asc':
        return (a: DisplayNewsItem, b: DisplayNewsItem) =>
          new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'title_asc':
        return (a: DisplayNewsItem, b: DisplayNewsItem) =>
          a.title.localeCompare(b.title, locale);
      case 'title_desc':
        return (a: DisplayNewsItem, b: DisplayNewsItem) =>
          b.title.localeCompare(a.title, locale);
      default:
        return (a: DisplayNewsItem, b: DisplayNewsItem) =>
          new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  };

  const comparator = getSortComparator(sortBy);

  const featured = filtered
    .filter((a) => a.isFeatured)
    .sort(comparator)
    .slice(0, 2);

  const regular = filtered
    .filter((a) => !a.isFeatured)
    .sort(comparator);

  const totalPages = Math.ceil(regular.length / ARTICLES_PER_PAGE);
  const safePage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const paginatedRegular = regular.slice(
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
    return `/blog${qs ? `?${qs}` : ''}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.toLocaleDateString(isEnglish ? 'en-US' : 'es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Container className="pt-20 pb-10">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
          <span className="bg-[var(--primary-subtle)] p-2 rounded-xl">
            <BookOpen className="text-[var(--primary)]" size={28} />
          </span>
          {t('page.blog.title')}
        </h1>
        <p className="text-muted mt-2 text-sm md:text-base">{t('page.blog.description')}</p>
      </div>

      {/* Category filters */}
      <nav
        aria-label="Categorías del blog"
        className="flex flex-wrap gap-2 mb-10"
      >
        <Link
          href="/blog"
          data-active={activeCategory === 'all'}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all bg-secondary text-muted hover:text-fg-primary data-[active=true]:bg-[var(--primary)] data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-[var(--primary)]/20"
        >
          <LayoutGrid size={14} aria-hidden="true" />
          {t('common.all')}
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/blog?category=${cat}`}
            data-active={activeCategory === cat}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all ${categoryTheme[cat] || categoryTheme.platform}`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Link>
        ))}
      </nav>

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-6">
        <ArrowUpDown size={14} className="text-[var(--text-tertiary)]" />
        {[
          { key: 'date_desc' as const, label: t('blog.sortNewest') || 'Más recientes' },
          { key: 'date_asc' as const, label: t('blog.sortOldest') || 'Más antiguos' },
          { key: 'title_asc' as const, label: t('blog.sortTitleAZ') || 'A-Z' },
          { key: 'title_desc' as const, label: t('blog.sortTitleZA') || 'Z-A' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              sortBy === opt.key
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'bg-secondary text-muted hover:text-fg-primary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Featured articles */}
      {featured.length > 0 && activeCategory === 'all' && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate={prefersReducedMotion ? undefined : 'visible'}
        >
          {featured.map((item) => (
            <motion.div
              key={item.slug}
              variants={prefersReducedMotion ? undefined : featuredVariants}
              whileHover={prefersReducedMotion ? undefined : { y: -6, transition: { duration: 0.3 } }}
            >
              <Link href={getArticlePath(item)} className="block group h-full">
                <article className="relative h-full rounded-2xl overflow-hidden bg-secondary border border-custom hover:border-[var(--primary)]/40 transition-colors">
                  <div className="absolute inset-0">
                    {item.coverUrl ? (
                      <Image
                        src={item.coverUrl}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--surface-sunken)]">
                        <BookOpen size={48} className="text-[var(--text-tertiary)]" />
                      </div>
                    )}
                    <div className={`absolute inset-0 bg-gradient-to-t ${categoryGradient[item.category] || 'from-black/80 via-black/30 to-transparent'}`} />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                  </div>
                  <div className="relative z-10 flex flex-col justify-end h-full p-5 md:p-7">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${categoryBadgeStyle[item.category] || 'bg-white/20 text-white'}`}>
                        {item.category}
                      </span>
                      {item.isFeatured && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 text-white text-[10px] font-bold backdrop-blur-sm">
                          <Star className="w-3 h-3 fill-white" />
                          {t('home.featured').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-2 drop-shadow-lg">
                      {isEnglish && item.titleEn ? item.titleEn : item.title}
                    </h2>
                    <p className="text-sm text-white/80 line-clamp-2 max-w-prose drop-shadow">
                      {isEnglish && item.descriptionEn ? item.descriptionEn : item.description}
                    </p>
                    <time className="text-xs text-white/50 mt-3 flex items-center gap-1.5">
                      <Clock size={12} />
                      {formatDate(item.date)}
                    </time>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Regular articles */}
      {(featured.length === 0 || activeCategory !== 'all') && paginatedRegular.length === 0 && filtered.length === 0 && (
        <p className="text-center text-muted py-16">{t('page.blog.empty')}</p>
      )}

      {paginatedRegular.length > 0 && (
        <motion.div
          key={`regular-${safePage}`}
          className="grid grid-cols-1 gap-4"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate={prefersReducedMotion ? undefined : 'visible'}
        >
          {paginatedRegular.map((item) => (
            <motion.div
              key={item.slug}
              variants={prefersReducedMotion ? undefined : itemVariants}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.01, y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            >
              <Link href={getArticlePath(item)} className="block group">
                <article className="flex items-stretch bg-secondary border border-custom rounded-2xl overflow-hidden hover:border-[var(--primary)]/30 transition-all hover:shadow-lg hover:shadow-black/5">
                  <div className="relative w-36 sm:w-52 md:w-60 shrink-0 overflow-hidden">
                    {item.coverUrl ? (
                      <Image
                        src={item.coverUrl}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 144px, (max-width: 768px) 208px, 240px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--surface-sunken)]">
                        <BookOpen size={32} className="text-[var(--text-tertiary)]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-secondary/90 md:to-secondary" />
                  </div>
                  <div className="flex-1 min-w-0 p-4 md:p-6 self-center">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${categoryBadgeStyle[item.category] || 'bg-[var(--primary-subtle)] text-[var(--primary)]'}`}>
                        {item.category}
                      </span>
                      {item.isFeatured && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[10px] font-bold">
                          <Star className="w-2.5 h-2.5 fill-amber-500" />
                        </span>
                      )}
                      <time className="text-xs text-muted flex items-center gap-1">
                        <Clock size={11} />
                        {formatDate(item.date)}
                      </time>
                    </div>
                    <h2 className="font-bold text-base md:text-lg leading-snug mb-1.5 group-hover:text-[var(--primary)] transition-colors">
                      {isEnglish && item.titleEn ? item.titleEn : item.title}
                    </h2>
                    <p className="text-sm text-muted line-clamp-2">
                      {isEnglish && item.descriptionEn ? item.descriptionEn : item.description}
                    </p>
                    {item.authorName && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-tertiary)]">
                        <User size={11} />
                        <span>{item.authorName}</span>
                        <Calendar size={11} className="ml-1" />
                        <span>{formatDate(item.date)}</span>
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 mt-10">
          <p className="text-xs text-[var(--text-secondary)]">
            {t('home.newsShowingResults', {
              start: (safePage - 1) * ARTICLES_PER_PAGE + 1,
              end: Math.min(safePage * ARTICLES_PER_PAGE, regular.length),
              total: regular.length,
            })}
          </p>
          <nav
            aria-label="Paginación del blog"
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
