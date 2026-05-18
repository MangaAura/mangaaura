'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';

import { useT } from '@/i18n';

export function HomeNewsSection() {
  const t = useT();
  const news = [
    {
      categoryKey: 'home.newsCategoryCommunity',
      titleKey: 'home.newsClanSeason',
      descriptionKey: 'home.newsClanSeasonDesc',
    },
    {
      categoryKey: 'home.newsCategoryPlatform',
      titleKey: 'home.newsReaderMode',
      descriptionKey: 'home.newsReaderModeDesc',
    },
  ];

  return (
    <section>
      <div className="flex justify-between items-center mb-6 border-b border-custom pb-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Star className="text-[var(--warning)]" /> {t('home.newsTitle')}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((item) => (
          <Link key={item.titleKey} href="/help">
            <div className="bg-secondary border border-custom rounded-xl p-5 hover:border-[var(--primary)] transition-colors cursor-pointer group h-full">
              <div className="bg-[var(--primary-subtle)] text-[var(--primary)] text-xs font-bold inline-block px-2 py-1 rounded mb-3">
                {t(item.categoryKey)}
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-fg-primary transition-colors">
                {t(item.titleKey)}
              </h3>
              <p className="text-sm text-muted line-clamp-2">{t(item.descriptionKey)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
