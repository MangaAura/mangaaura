'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { useT, useLocale } from '@/i18n';
import {
  dbArticleToDisplayItem,
  getArticlePath,
  type DisplayNewsItem,
} from '@/lib/news';
import useSWR from 'swr';

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
  const news = dbItems.slice(0, 2);

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((item) => (
          <Link key={item.slug} href={getArticlePath(item)}>
            <div className="bg-secondary border border-custom rounded-xl p-5 hover:border-[var(--primary)] transition-colors cursor-pointer group h-full">
              <div className="flex flex-wrap items-center gap-2 mb-3">
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
