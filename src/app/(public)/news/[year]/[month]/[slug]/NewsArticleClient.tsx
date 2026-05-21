'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Star, Palette, Smartphone, Trophy, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/Layout/Container';
import { useT, useLocale } from '@/i18n';
import { type DisplayNewsItem } from '@/lib/news';

const iconMap: Record<string, React.ReactNode> = {
  community: <Star size={16} aria-hidden="true" />,
  platform: <Palette size={16} aria-hidden="true" />,
  tools: <Sparkles size={16} aria-hidden="true" />,
  mobile: <Smartphone size={16} aria-hidden="true" />,
  contest: <Trophy size={16} aria-hidden="true" />,
};

const categoryIconMap: Record<string, React.ReactNode> = {
  community: <Star size={48} className="opacity-[0.08]" aria-hidden="true" />,
  platform: <Palette size={48} className="opacity-[0.08]" aria-hidden="true" />,
  tools: <Sparkles size={48} className="opacity-[0.08]" aria-hidden="true" />,
  mobile: <Smartphone size={48} className="opacity-[0.08]" aria-hidden="true" />,
  contest: <Trophy size={48} className="opacity-[0.08]" aria-hidden="true" />,
};

interface ThemeColors {
  from: string;
  via: string;
  to: string;
  badgeBg: string;
  badgeText: string;
}

const themeConfig: Record<string, ThemeColors> = {
  community: {
    from: 'from-amber-950/50',
    via: 'via-amber-900/20',
    to: 'to-transparent',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
  },
  platform: {
    from: 'from-indigo-950/50',
    via: 'via-indigo-900/20',
    to: 'to-transparent',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-300',
  },
  tools: {
    from: 'from-sky-950/50',
    via: 'via-sky-900/20',
    to: 'to-transparent',
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-300',
  },
  mobile: {
    from: 'from-emerald-950/50',
    via: 'via-emerald-900/20',
    to: 'to-transparent',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
  },
  contest: {
    from: 'from-rose-950/50',
    via: 'via-rose-900/20',
    to: 'to-transparent',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
  },
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
  const prefersReducedMotion = useReducedMotion();
  const theme = themeConfig[article.iconType] || themeConfig.platform;

  // Pick language based on client-side locale (handles live language switching)
  const isEnglish = locale === 'en';
  const title = isEnglish && article.titleEn ? article.titleEn : article.title;
  const description = isEnglish && article.descriptionEn ? article.descriptionEn : article.description;
  const bodyRaw = article.body || '';
  const bodyEn = article.bodyEn || '';
  const body = isEnglish && bodyEn ? bodyEn : bodyRaw;
  const paragraphs = body.split('\n').filter(Boolean);

  const noMotion = prefersReducedMotion
    ? { initial: {}, animate: {}, transition: {} }
    : undefined;

  const getCategoryLabel = (item: DisplayNewsItem) => {
    const key = categoryLabelKey[item.category];
    return key ? t(key) : item.category.charAt(0).toUpperCase() + item.category.slice(1);
  };

  return (
    <>
      <section
        aria-labelledby="article-title"
        className="relative overflow-hidden border-b border-custom"
      >
        <div className={`absolute inset-0 bg-gradient-to-b ${theme.from} ${theme.via} ${theme.to}`} aria-hidden="true" />
        <div className="absolute top-12 right-12 text-[var(--primary)]" aria-hidden="true">
          {categoryIconMap[article.iconType]}
        </div>
        <div className="absolute top-1/3 -right-8 w-64 h-64 rounded-full bg-[var(--primary)]/[0.02] blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-8 left-1/4 w-48 h-48 rounded-full bg-[var(--primary)]/[0.03] blur-2xl" aria-hidden="true" />

        <Container size="small" className="relative pt-20 pb-14">
          <nav aria-label={t('common.breadcrumb') || 'Volver a noticias'}>
            <motion.div
              {...(noMotion || { initial: { opacity: 0, x: -16 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.3 } })}
            >
              <Link
                href="/news"
                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg-primary focus-visible:text-fg-primary transition-colors mb-8 group rounded-sm"
              >
                <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                {t('common.back')}
              </Link>
            </motion.div>
          </nav>

          <div className="space-y-6">
            <motion.div
              {...(noMotion || { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } })}
              className="flex flex-wrap items-center gap-3"
            >
              <Link
                href={`/news?category=${article.category}`}
                className={`inline-flex items-center gap-1.5 ${theme.badgeBg} ${theme.badgeText} text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity`}
              >
                {iconMap[article.iconType]}
                {getCategoryLabel(article)}
              </Link>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <Calendar size={13} aria-hidden="true" />
                <time dateTime={article.date}>{article.date}</time>
              </span>
            </motion.div>

            <motion.h1
              id="article-title"
              {...(noMotion || { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: 0.1 } })}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-fg-primary"
            >
              {title}
            </motion.h1>

            <motion.p
              {...(noMotion || { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: 0.2 } })}
              className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed"
            >
              {description}
            </motion.p>
          </div>
        </Container>
      </section>

      {/* Cover image */}
      {article.coverUrl && (
        <Container size="small" className="pt-8">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[var(--surface-sunken)]">
            <Image
              src={article.coverUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        </Container>
      )}

      <Container size="small" className="py-12 sm:py-16">
        <motion.div
          {...(noMotion || { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: 0.15 } })}
        >
          {paragraphs.length > 0 ? (
            <>
              <div className="relative pl-5 sm:pl-6">
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-[var(--primary)] to-transparent"
                  aria-hidden="true"
                />
                <p className="text-fg-primary leading-[1.75] text-base sm:text-lg">
                  {paragraphs[0]}
                </p>
              </div>

              {paragraphs.slice(1).map((p, i) => (
                <p
                  key={i}
                  className="text-fg-primary leading-[1.75] text-base sm:text-lg mt-5"
                >
                  {p}
                </p>
              ))}
            </>
          ) : (
            <div className="relative pl-5 sm:pl-6">
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-[var(--primary)] to-transparent"
                aria-hidden="true"
              />
              <div className="prose prose-invert max-w-none">
                <p className="text-fg-primary leading-[1.75] text-base sm:text-lg">
                  {body}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.nav
          aria-label={t('common.breadcrumb') || 'Volver a noticias'}
          {...(noMotion || { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4, delay: 0.3 } })}
          className="mt-12 pt-8 border-t border-custom flex items-center justify-between"
        >
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg-primary focus-visible:text-fg-primary transition-colors group rounded-sm min-h-[24px]"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            {t('common.back')}
          </Link>
          <time className="text-xs text-muted" dateTime={article.date}>{article.date}</time>
        </motion.nav>
      </Container>


    </>
  );
}
