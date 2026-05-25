'use client';

import { Star, Sparkles } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

import { Button } from '@/components/ui/Button';
import { useT, useLocale } from '@/i18n';
import {
  dbArticleToDisplayItem,
  getArticlePath,
  type DisplayNewsItem,
} from '@/lib/news';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const categoryLabelKey: Record<string, string> = {
  community: 'home.newsCategoryCommunity',
  platform: 'home.newsCategoryPlatform',
  tools: 'home.newsCategoryTools',
  mobile: 'home.newsCategoryMobile',
  contest: 'home.newsCategoryContest',
};

export function HomeNewsSection() {
  const t = useT();
  const { locale } = useLocale();

  const { data } = useSWR<{ articles: unknown[] }>('/api/news', fetcher, {
    refreshInterval: 60000,
    fallbackData: { articles: [] },
  });

  const dbItems: DisplayNewsItem[] = (data?.articles || [])
    .map((a: unknown) => dbArticleToDisplayItem(a as Parameters<typeof dbArticleToDisplayItem>[0]));

  const isEnglish = locale === 'en';

  const featuredItems = dbItems.filter((item) => item.isFeatured).slice(0, 2);
  const regularItems = dbItems.filter((item) => !item.isFeatured);
  const displayItems = [...featuredItems, ...regularItems].slice(0, 4);

  const featured = featuredItems.length > 0 ? featuredItems[0] : null;
  const rest = featured
    ? [featuredItems[1], ...regularItems].filter(Boolean).slice(0, 3)
    : displayItems.slice(0, 4);

  return (
    <section>
      <div className="flex items-center justify-between mb-6 border-b border-custom pb-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Star className="text-[var(--warning)]" /> {t('home.newsTitle')}
        </h2>
        <Link href="/news">
          <Button variant="ghost" size="sm">
            {t('common.viewAll')} →
          </Button>
        </Link>
      </div>
      {featured && (
        <Link href={getArticlePath(featured)} className="block mb-4 group">
          <div className="relative bg-gradient-to-r from-amber-950/30 via-amber-900/10 to-transparent border border-amber-500/30 rounded-xl p-5 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/5 overflow-hidden">
            {/* Background sparkle */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    {t('home.featured')}
                  </span>
                <div className="bg-[var(--primary-subtle)] text-[var(--primary)] text-xs font-bold inline-block px-2 py-1 rounded">
                  {t(categoryLabelKey[featured.category] || featured.category) || featured.category}
                </div>
              </div>
              <h3 className="font-bold text-xl mb-2 group-hover:text-amber-400 transition-colors">
                {isEnglish && featured.titleEn
                  ? featured.titleEn
                  : featured.title}
              </h3>
              <p className="text-sm text-muted line-clamp-2 max-w-2xl">
                {isEnglish && featured.descriptionEn
                  ? featured.descriptionEn
                  : featured.description}
              </p>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rest.map((item) => (
          <Link key={item.slug} href={getArticlePath(item)}>
            <div className="bg-secondary border border-custom rounded-xl p-5 hover:border-[var(--primary)] transition-colors cursor-pointer group h-full">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {item.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-bold">
                    <Star className="w-2.5 h-2.5" />
                  </span>
                )}
                <div className="bg-[var(--primary-subtle)] text-[var(--primary)] text-xs font-bold inline-block px-2 py-1 rounded">
                  {t(categoryLabelKey[item.category] || item.category) || item.category}
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-fg-primary transition-colors">
                {isEnglish && item.titleEn
                  ? item.titleEn
                  : item.title}
              </h3>
              <p className="text-sm text-muted line-clamp-2">
                {isEnglish && item.descriptionEn
                  ? item.descriptionEn
                  : item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
