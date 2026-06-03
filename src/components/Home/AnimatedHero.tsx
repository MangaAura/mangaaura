'use client';

import { Play, Compass, BookOpen, Users, BookMarked, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { useT } from '@/i18n';

function WelcomeLabel({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (n && c === n && c.toLowerCase() === 'a') {
      nodes.push(c);
      nodes.push(<i key={i}>{n}</i>);
      i += 2;
    } else {
      nodes.push(c);
      i += 1;
    }
  }
  return <>{nodes}</>;
}

function StaticNumber({ value }: { value: number }) {
  return <span>{value.toLocaleString()}</span>;
}

interface AnimatedHeroProps {
  title: string;
  description: string;
  coverUrl: string | null;
  mangaSlug: string;
  totalMangas?: number;
  totalReaders?: number;
  totalChapters?: number;
}

export function AnimatedHero({
  title,
  description,
  coverUrl,
  mangaSlug,
  totalMangas: initialMangas = 0,
  totalReaders: initialReaders = 0,
  totalChapters: initialChapters = 0,
}: AnimatedHeroProps) {
  const { data: session } = useSession();
  const t = useT();

  const totalMangas = initialMangas;
  const totalReaders = initialReaders;
  const totalChapters = initialChapters;

  return (
    <section className="relative w-full min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden rounded-2xl">
      {coverUrl ? (
        <>
          <div className="absolute inset-0 md:inset-y-0 md:left-[45%] md:right-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="relative w-full h-full animate-hero-zoom">
              <Image
                src={coverUrl}
                alt=""
                fill
                className="object-cover object-right"
                priority
                fetchPriority="high"
                quality={60}
                aria-hidden
                sizes="(max-width: 768px) 100vw, 55vw"
              />
            </div>
          </div>
          <div className="absolute left-[45%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--primary)]/30 to-transparent hidden md:block z-10" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/15 via-background to-[var(--accent-purple)]/15">
          {/* Static shapes — no heavy animation on initial render for better LCP */}
          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10" style={{ left: '10%', top: '20%' }} />
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10" style={{ left: '80%', top: '15%' }} />
          <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10" style={{ left: '70%', top: '70%' }} />
          <div className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10" style={{ left: '25%', top: '75%' }} />
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--accent-purple)]/20 to-transparent" />
        </div>
      )}

      <div className="relative z-20 max-w-2xl px-6 md:px-12 py-16 md:py-24 w-full">
        {/* LCP-critical content — rendered immediately, no animation delay */}
        <p className="text-sm uppercase tracking-widest text-[var(--primary)] mb-3 font-medium">
          {coverUrl ? t('home.featured') : <WelcomeLabel text={t('home.welcome')} />}
        </p>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
          {title}
        </h1>

        <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl mb-8 leading-relaxed line-clamp-3">
          {description}
        </p>

        {/* Buttons with hover animations only (no entrance animations) */}
        <div className="flex flex-wrap gap-4 mb-10">
          {coverUrl && mangaSlug ? (
            <Link href={`/manga/${mangaSlug}`}>
              <span className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white cursor-pointer">
                <Play className="w-5 h-5" />
                {t('home.readNow')}
              </span>
            </Link>
          ) : (
            <Link href={session?.user ? '/creator/manga/new' : '/auth/register'}>
              <span className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white cursor-pointer">
                <Sparkles className="w-5 h-5" />
                {session?.user ? t('creator.newManga') : t('home.ctaHeroRegister')}
              </span>
            </Link>
          )}
          <Link href="/explore">
            <span className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors duration-200 cursor-pointer">
              <Compass className="w-5 h-5" />
              {coverUrl ? t('home.exploreMangas') : t('home.ctaHeroLearnMore')}
            </span>
          </Link>
        </div>

        {/* Stats — static numbers for faster paint */}
        <div className="flex flex-wrap gap-6 md:gap-10 pt-6 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--primary)]" />
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]"><StaticNumber value={totalMangas} /></p>
              <p className="text-xs text-[var(--text-muted)]">{t('home.mangas')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--accent-purple)]" />
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]"><StaticNumber value={totalReaders} /></p>
              <p className="text-xs text-[var(--text-muted)]">{t('home.readers')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]"><StaticNumber value={totalChapters} /></p>
              <p className="text-xs text-[var(--text-muted)]">{t('manga.chapters')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
