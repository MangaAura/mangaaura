'use client';

import {
  ArrowLeft,
  Calendar,
  Star,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { ScrollProgressBar } from '@/components/Layout/ScrollProgressBar';
import { ArticleShareButton } from '@/components/News/ArticleShareButton';
import { AuthorCard } from '@/components/News/AuthorCard';
import { FadeIn } from '@/components/News/FadeIn';
import { PullQuote } from '@/components/News/PullQuote';
import { RelatedArticles } from '@/components/News/RelatedArticles';
import { useT, useLocale } from '@/i18n';
import { type DisplayNewsItem } from '@/lib/news';

const categoryBadge: Record<string, string> = {
  community: 'bg-amber-500/15 text-amber-500',
  platform: 'bg-indigo-500/15 text-indigo-400',
  tools: 'bg-sky-500/15 text-sky-400',
  mobile: 'bg-emerald-500/15 text-emerald-400',
  contest: 'bg-rose-500/15 text-rose-400',
};

const categoryAccent: Record<string, string> = {
  community: '#f59e0b',
  platform: '#818cf8',
  tools: '#38bdf8',
  mobile: '#34d399',
  contest: '#fb7185',
};

const categoryLabelKey: Record<string, string> = {
  community: 'home.newsCategoryCommunity',
  platform: 'home.newsCategoryPlatform',
  tools: 'home.newsCategoryTools',
  mobile: 'home.newsCategoryMobile',
  contest: 'home.newsCategoryContest',
};

export function NewsArticleClient({
  article,
}: {
  article: DisplayNewsItem;
}) {
  const t = useT();
  const { locale } = useLocale();

  const isEnglish = locale === 'en';
  const title = isEnglish && article.titleEn ? article.titleEn : article.title;
  const description = isEnglish && article.descriptionEn ? article.descriptionEn : article.description;
  const bodyRaw = article.body || '';
  const bodyEn = article.bodyEn || '';
  const body = isEnglish && bodyEn ? bodyEn : bodyRaw;
  const paragraphs = body.split('\n').filter(Boolean);

  const readingTime = Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
  const cat = article.category;
  const accent = categoryAccent[cat] || 'var(--primary)';

  const getCategoryLabel = (item: DisplayNewsItem) => {
    const key = categoryLabelKey[item.category];
    return key ? t(key) : item.category.charAt(0).toUpperCase() + item.category.slice(1);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.toLocaleDateString(isEnglish ? 'en-US' : 'es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const showPullQuote = body.length > 300 && paragraphs.length > 5;
  const pullQuoteIndex = Math.min(
    Math.max(2, Math.floor(paragraphs.length * 0.4)),
    paragraphs.length - 2
  );

  return (
    <>
      <ScrollProgressBar />

      <article>
        {/* Back link */}
        <Container size="small" className="pt-8 pb-0">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-fg-primary transition-colors"
          >
            <ArrowLeft size={13} />
            {t('common.back')}
          </Link>
        </Container>

        {/* Hero with title overlay */}
        {article.coverUrl ? (
          <div className="relative w-full aspect-video max-h-[60vh] overflow-hidden bg-[var(--surface-sunken)]">
            <Image
              src={article.coverUrl}
              alt={title || article.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 pb-8 sm:pb-12 pt-20">
              <Container size="small">
                <div className="max-w-[720px] mx-auto">
                  <div className="flex items-center gap-3 mb-3">
                    <Link
                      href={`/news?category=${article.category}`}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${categoryBadge[cat] || 'bg-secondary text-muted'}`}
                    >
                      {getCategoryLabel(article)}
                    </Link>
                    {article.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/15 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                        <Star className="w-3 h-3 fill-amber-400" />
                        DESTACADO
                      </span>
                    )}
                  </div>
                  <h1
                    id="article-title"
                    className="text-[clamp(1.375rem,2.5vw,1.875rem)] font-bold tracking-tight leading-[1.2] text-white drop-shadow-lg"
                  >
                    {title}
                  </h1>
                </div>
              </Container>
            </div>
          </div>
        ) : (
          <Container size="small" className="pt-8 pb-0">
            <div className="max-w-[720px] mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <Link
                  href={`/news?category=${article.category}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${categoryBadge[cat] || 'bg-secondary text-muted'}`}
                >
                  {getCategoryLabel(article)}
                </Link>
                {article.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/15 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                    <Star className="w-3 h-3 fill-amber-400" />
                    DESTACADO
                  </span>
                )}
              </div>
              <h1
                id="article-title"
                className="text-[clamp(1.375rem,2.5vw,1.875rem)] font-bold tracking-tight leading-[1.2] text-fg-primary"
              >
                {title}
              </h1>
            </div>
          </Container>
        )}

        {/* Description + byline */}
        <Container size="small" className={article.coverUrl ? 'pt-5 pb-6' : 'pt-2 pb-6'}>
          <div className="max-w-[720px] mx-auto">
            <p className="text-base text-muted leading-relaxed">
              {description}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 text-sm text-muted">
              {article.authorUsername ? (
                <Link href={`/user/${article.authorUsername}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-7 h-7 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center shrink-0 overflow-hidden">
                    {article.authorAvatarUrl ? (
                      <img src={article.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-[var(--primary)]">
                        {article.authorName ? article.authorName.charAt(0).toUpperCase() : 'M'}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-fg-primary text-sm">
                    {article.authorName || 'MangaAura'}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center shrink-0 overflow-hidden">
                    {article.authorAvatarUrl ? (
                      <img src={article.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-[var(--primary)]">
                        {article.authorName ? article.authorName.charAt(0).toUpperCase() : 'M'}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-fg-primary text-sm">
                    {article.authorName || 'MangaAura'}
                  </span>
                </div>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {formatDate(article.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                {readingTime} min
              </span>
            </div>
          </div>
        </Container>

        {/* Content */}
        <Container size="small" className="py-10 sm:py-14">
          <div className="max-w-[720px] mx-auto">
            {paragraphs.length > 0 && (
              <p className="text-base sm:text-lg leading-[1.8] text-fg-primary mt-0">
                {paragraphs[0]}
              </p>
            )}

            {/* Middle paragraphs */}
            {showPullQuote ? (
              <>
                {paragraphs.slice(1, pullQuoteIndex).map((p, i) => (
                  <FadeIn key={i} delay={i * 40}>
                    <p className="text-base sm:text-lg leading-[1.8] text-fg-primary mt-6">
                      {p}
                    </p>
                  </FadeIn>
                ))}
                <FadeIn delay={pullQuoteIndex * 40}>
                  <PullQuote
                    text={paragraphs[pullQuoteIndex]}
                    accentColor={accent}
                  />
                </FadeIn>
                {paragraphs.slice(pullQuoteIndex + 1).map((p, i) => (
                  <FadeIn key={i + pullQuoteIndex + 1} delay={(i + pullQuoteIndex + 1) * 40}>
                    <p className="text-base sm:text-lg leading-[1.8] text-fg-primary mt-6">
                      {p}
                    </p>
                  </FadeIn>
                ))}
              </>
            ) : (
              paragraphs.slice(1).map((p, i) => (
                <FadeIn key={i} delay={i * 40}>
                  <p className="text-base sm:text-lg leading-[1.8] text-fg-primary mt-6">
                    {p}
                  </p>
                </FadeIn>
              ))
            )}

            {/* Footer */}
            <hr className="border-custom my-10 sm:my-12" />

            <FadeIn>
              <div className="flex flex-wrap items-center justify-between gap-6">
                {article.authorName ? (
                  <AuthorCard name={article.authorName} username={article.authorUsername} avatarUrl={article.authorAvatarUrl} />
                ) : (
                  <div />
                )}
                <ArticleShareButton title={title} />
              </div>
            </FadeIn>


          </div>
        </Container>

        {/* Related */}
        <Container className="pb-16 sm:pb-20">
          <RelatedArticles category={article.category} excludeId={article.id} />
        </Container>
      </article>
    </>
  );
}
