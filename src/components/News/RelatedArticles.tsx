'use client';

import { Newspaper, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';

import { fetcher } from '@/lib/swr-config';
import { dbArticleToDisplayItem, getArticlePath, type DisplayNewsItem } from '@/lib/news';
import { useLocale } from '@/i18n';

interface RelatedArticlesProps {
  category: string;
  excludeId: string;
}

export function RelatedArticles({ category, excludeId }: RelatedArticlesProps) {
  const { locale } = useLocale();
  const isEnglish = locale === 'en';

  const { data, error } = useSWR<{ articles: unknown[] }>(
    `/api/news?category=${category}&limit=4`,
    fetcher,
  );

  const articles: DisplayNewsItem[] = (data?.articles || [])
    .map((a: unknown) => dbArticleToDisplayItem(a as Parameters<typeof dbArticleToDisplayItem>[0]))
    .filter((a) => a.id !== excludeId)
    .slice(0, 3);

  if (error || articles.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.toLocaleDateString(isEnglish ? 'en-US' : 'es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <section className="mt-16 sm:mt-20">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-lg font-bold text-fg-primary">Sigue leyendo</h2>
        <span className="flex-1 h-px bg-[var(--border)]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {articles.map((item) => (
          <Link key={item.slug} href={getArticlePath(item)} className="group block">
            <article className="rounded-xl overflow-hidden bg-secondary border border-custom hover:border-[var(--primary)]/30 transition-all h-full flex flex-col">
              <div className="relative w-full aspect-video overflow-hidden bg-[var(--surface-sunken)]">
                {item.coverUrl ? (
                  <Image
                    src={item.coverUrl}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Newspaper size={32} className="text-[var(--text-tertiary)]" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col p-4">
                <h3 className="font-bold text-sm leading-snug mb-2 group-hover:text-[var(--primary)] transition-colors line-clamp-3">
                  {isEnglish && item.titleEn ? item.titleEn : item.title}
                </h3>
                <time className="text-xs text-muted flex items-center gap-1 mt-auto">
                  <Clock size={11} />
                  {formatDate(item.date)}
                </time>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
