'use client';

import {
  Star,
  Sparkles,
  Clock,
  Newspaper,
  ChevronRight,
  CalendarDays,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { useT, useLocale } from '@/i18n';
import {
  dbArticleToDisplayItem,
  getArticlePath,
  type DisplayNewsItem,
} from '@/lib/news';

const categoryLabelKey: Record<string, string> = {
  community: 'home.newsCategoryCommunity',
  platform: 'home.newsCategoryPlatform',
  tools: 'home.newsCategoryTools',
  mobile: 'home.newsCategoryMobile',
  contest: 'home.newsCategoryContest',
  comparison: 'home.newsCategoryComparison',
  features: 'home.newsCategoryFeatures',
  technology: 'home.newsCategoryTechnology',
  creator: 'home.newsCategoryCreator',
};

const categoryAccent: Record<string, string> = {
  community: '#d97706',
  platform: '#6366f1',
  tools: '#0ea5e9',
  mobile: '#10b981',
  contest: '#f43f5e',
  comparison: '#8b5cf6',
  features: '#22c55e',
  technology: '#06b6d4',
  creator: '#f97316',
};

const categoryBadgeSolid: Record<string, string> = {
  community: 'bg-amber-600 text-white dark:bg-amber-600',
  platform: 'bg-indigo-600 text-white dark:bg-indigo-500',
  tools: 'bg-sky-600 text-white dark:bg-sky-500',
  mobile: 'bg-emerald-600 text-white dark:bg-emerald-500',
  contest: 'bg-rose-600 text-white dark:bg-rose-500',
  comparison: 'bg-violet-600 text-white dark:bg-violet-500',
  features: 'bg-green-600 text-white dark:bg-green-600',
  technology: 'bg-cyan-600 text-white dark:bg-cyan-500',
  creator: 'bg-orange-600 text-white dark:bg-orange-600',
};


interface HomeNewsSectionProps {
  articles?: Record<string, unknown>[];
}

export function HomeNewsSection({ articles = [] }: HomeNewsSectionProps) {
  const t = useT();
  const { locale } = useLocale();

  const dbItems: DisplayNewsItem[] = articles
    .map((a: Record<string, unknown>) => dbArticleToDisplayItem(a as Parameters<typeof dbArticleToDisplayItem>[0]));

  const isEnglish = locale === 'en';

  /* Take up to 7 most recent articles. First featured one becomes hero, rest go in grid. */
  const displayItems = dbItems.slice(0, 7);
  const featured = displayItems.find((item) => item.isFeatured) || null;
  const rest = featured
    ? displayItems.filter((item) => item.slug !== featured.slug).slice(0, 6)
    : displayItems.slice(0, 7);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.toLocaleDateString(isEnglish ? 'en-US' : 'es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCategoryLabel = (item: DisplayNewsItem) => {
    const key = categoryLabelKey[item.category];
    return key ? t(key) : item.category.charAt(0).toUpperCase() + item.category.slice(1);
  };

  return (
    <section>
      {/* Header — editorial clean */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-sunken)] flex items-center justify-center border border-[var(--border)]">
              <Newspaper className="w-4 h-4 text-[var(--text-secondary)]" />
            </div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight">
              {t('home.newsTitle')}
            </h2>
          </div>
          <span className="hidden sm:block w-px h-5 bg-[var(--border)]" />
          <span className="hidden sm:block text-xs text-[var(--text-tertiary)]">
            {t('home.newsPageDesc')}
          </span>
        </div>
        <Link href="/news" aria-label={t('common.viewAll') + ' noticias'} className="min-h-[44px] inline-flex items-center">
          <Button variant="ghost" size="sm" className="group text-xs min-h-[44px] py-2.5">
            {t('common.viewAll')}
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>

      {/* Featured article — hero card with cover image */}
      {featured && (
        <div className="animate-ac-fade-in-up">
          <Link href={getArticlePath(featured)} className="block group mb-6">
            <article className="relative w-full aspect-[21/9] sm:aspect-[3/1] rounded-xl overflow-hidden bg-[var(--surface-sunken)] border border-[var(--border)] hover:border-[var(--border)]/80 transition-all duration-500">
              {/* Background image */}
              {featured.coverUrl ? (
                <Image
                  src={featured.coverUrl}
                  alt=""
                  fill
                  priority
                  decoding="async"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 75vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-amber-950/20 to-[var(--surface-sunken)]" />
              )}

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7 md:p-9">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${categoryAccent[featured.category] || '#fff'}20`,
                      color: categoryAccent[featured.category] || '#fff',
                    }}
                  >
                    {getCategoryLabel(featured)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/15 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    <Sparkles className="w-3 h-3" />
                    {t('home.featured')}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-snug mb-2 drop-shadow-lg max-w-2xl">
                  {isEnglish && featured.titleEn ? featured.titleEn : featured.title}
                </h3>

                <p className="text-sm text-white/70 line-clamp-2 max-w-xl drop-shadow-sm">
                  {isEnglish && featured.descriptionEn ? featured.descriptionEn : featured.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-white/50">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatDate(featured.date)}
                  </span>
                  {featured.authorName && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {featured.authorName}
                    </span>
                  )}
                </div>
              </div>
            </article>
          </Link>
        </div>
      )}

      {/* Regular articles grid */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {rest.map((item, index) => {
            return (
              <div
                key={item.slug}
                className="animate-ac-fade-in-up"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <Link href={getArticlePath(item)} className="block group h-full">
                  <article className="relative h-full rounded-xl overflow-hidden bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--border)]/80 transition-all duration-300 hover:shadow-md">
                    <div className="flex flex-row h-full">
                      {/* Thumbnail */}
                      <div className="relative w-24 sm:w-28 shrink-0 overflow-hidden bg-[var(--surface-sunken)]">
                        {item.coverUrl ? (
                          <Image
                            src={item.coverUrl}
                            alt=""
                            fill
                            loading="lazy"
                            decoding="async"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="112px"
                            quality={30}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Newspaper size={20} className="text-[var(--text-tertiary)]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--surface-elevated)]" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${categoryBadgeSolid[item.category] || 'bg-[var(--primary)] text-white'}`}
                          >
                            {getCategoryLabel(item)}
                          </span>
                          {item.isFeatured && (
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          )}
                        </div>

                        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors duration-300">
                          {isEnglish && item.titleEn ? item.titleEn : item.title}
                        </h3>

                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                          {isEnglish && item.descriptionEn ? item.descriptionEn : item.description}
                        </p>

                        <time className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1 mt-auto pt-2">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.date)}
                        </time>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
