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
};

const categoryAccent: Record<string, string> = {
  community: '#f59e0b',
  platform: '#818cf8',
  tools: '#38bdf8',
  mobile: '#34d399',
  contest: '#fb7185',
};

const categoryBadgeStyle: Record<string, string> = {
  community: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  platform: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  tools: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  mobile: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  contest: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
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

  const featuredItems = dbItems.filter((item) => item.isFeatured).slice(0, 2);
  const regularItems = dbItems.filter((item) => !item.isFeatured);
  const displayItems = [...featuredItems, ...regularItems].slice(0, 4);

  const featured = featuredItems.length > 0 ? featuredItems[0] : null;
  const rest = featured
    ? [featuredItems[1], ...regularItems].filter(Boolean).slice(0, 3)
    : displayItems.slice(0, 4);

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              {t('home.newsTitle')}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] hidden sm:block">
              {t('home.newsPageDesc')}
            </p>
          </div>
        </div>
        <Link href="/news" aria-label={t('common.viewAll') + ' noticias'}>
          <Button variant="ghost" size="sm" className="group">
            <span>{t('common.viewAll')}</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>

      {/* Featured article — hero card with cover image */}
      {featured && (
        <div className="animate-ac-fade-in-up">
          <Link href={getArticlePath(featured)} className="block group mb-5">
            <article className="relative w-full aspect-[21/9] sm:aspect-[3/1] rounded-2xl overflow-hidden bg-[var(--surface-sunken)] border border-[var(--border)] hover:border-amber-500/40 transition-all duration-500 hover:shadow-xl hover:shadow-amber-500/10">
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
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${categoryBadgeStyle[featured.category] || 'bg-white/10 text-white border-white/20'}`}>
                    {getCategoryLabel(featured)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    <Sparkles className="w-3 h-3" />
                    {t('home.featured')}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2 drop-shadow-lg max-w-2xl">
                  {isEnglish && featured.titleEn ? featured.titleEn : featured.title}
                </h3>

                <p className="text-sm text-white/80 line-clamp-2 max-w-xl drop-shadow-sm">
                  {isEnglish && featured.descriptionEn ? featured.descriptionEn : featured.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-white/60">
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

              {/* Hover glow accent */}
              <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </article>
          </Link>
        </div>
      )}

      {/* Regular articles grid */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rest.map((item, index) => {
            const accentColor = categoryAccent[item.category] || 'var(--primary)';

            return (
              <div
                key={item.slug}
                className="animate-ac-fade-in-up"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <Link href={getArticlePath(item)} className="block group h-full">
                  <article className="relative h-full rounded-xl overflow-hidden bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--border)]/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                    <div className="flex flex-row h-full">
                      {/* Thumbnail */}
                      <div className="relative w-28 sm:w-32 shrink-0 overflow-hidden bg-[var(--surface-sunken)]">
                        {item.coverUrl ? (
                          <Image
                            src={item.coverUrl}
                            alt=""
                            fill
                            loading="lazy"
                            decoding="async"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="128px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Newspaper size={24} className="text-[var(--text-tertiary)]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--surface-elevated)]" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 p-3.5 sm:p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${accentColor}18`,
                              color: accentColor,
                            }}
                          >
                            {getCategoryLabel(item)}
                          </span>
                          {item.isFeatured && (
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          )}
                        </div>

                        <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2 group-hover:text-amber-400 transition-colors duration-300">
                          {isEnglish && item.titleEn ? item.titleEn : item.title}
                        </h3>

                        <p className="text-xs text-[var(--text-tertiary)] line-clamp-1 mb-auto">
                          {isEnglish && item.descriptionEn ? item.descriptionEn : item.description}
                        </p>

                        <time className="text-[11px] text-[var(--text-tertiary)]/70 flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.date)}
                        </time>
                      </div>
                    </div>

                    {/* Accent bar on hover */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                      style={{ backgroundColor: accentColor }}
                    />
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
