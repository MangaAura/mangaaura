'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Play, Compass, BookOpen, Users, BookMarked, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

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

function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) { if (count !== value) queueMicrotask(() => setCount(value)); return; }
    let start: number | null = null;
    const duration = 1500;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const next = Math.floor(p * value);
      if (next !== count) setCount(next);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, shouldReduceMotion, count]);

  return <span>{count.toLocaleString()}</span>;
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
  totalMangas = 0,
  totalReaders = 0,
  totalChapters = 0,
}: AnimatedHeroProps) {
  const { data: session } = useSession();
  const t = useT();
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  const floatingShapes = [
    { size: 'w-24 h-24' as const, x: '10%' as const, y: '20%' as const, delay: 0 },
    { size: 'w-16 h-16' as const, x: '80%' as const, y: '15%' as const, delay: 0.3 },
    { size: 'w-20 h-20' as const, x: '70%' as const, y: '70%' as const, delay: 0.6 },
    { size: 'w-12 h-12' as const, x: '25%' as const, y: '75%' as const, delay: 0.9 },
  ];
  const hoverScale = { scale: 1.05 } as const;
  const tapScale = { scale: 0.95 } as const;

  return (
    <section className="relative w-full min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden rounded-2xl">
      {coverUrl ? (
        <>
          <div className="absolute inset-0 md:inset-y-0 md:left-[45%] md:right-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <motion.div
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }}
              className="relative w-full h-full"
              suppressHydrationWarning
            >
              <Image
                src={coverUrl}
                alt=""
                fill
                className="object-cover object-right"
                priority
                fetchPriority="high"
                aria-hidden
                sizes="(max-width: 768px) 100vw, 55vw"
              />
            </motion.div>
          </div>
          <div className="absolute left-[45%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[var(--primary)]/30 to-transparent hidden md:block z-10" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/15 via-background to-[var(--accent-purple)]/15">
          {floatingShapes.map((shape, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10 ${shape.size}`}
              style={{ left: shape.x, top: shape.y }}
              animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: shape.delay, ease: 'easeInOut' as const }}
              suppressHydrationWarning
            />
          ))}
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--accent-purple)]/20 to-transparent" />
        </div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 max-w-2xl px-6 md:px-12 py-16 md:py-24 w-full"
        suppressHydrationWarning
      >
        <motion.p variants={itemVariants} className="text-sm uppercase tracking-widest text-[var(--primary)] mb-3 font-medium" suppressHydrationWarning>
          {coverUrl ? t('home.featured') : <WelcomeLabel text={t('home.welcome')} />}
        </motion.p>

        <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight" suppressHydrationWarning>
          {title}
        </motion.h1>

        <motion.p variants={itemVariants} className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl mb-8 leading-relaxed line-clamp-3" suppressHydrationWarning>
          {description}
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 mb-10" suppressHydrationWarning>
          {coverUrl && mangaSlug ? (
            <Link href={`/manga/${mangaSlug}`}>
              <motion.span
                whileHover={hoverScale}
                whileTap={tapScale}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white cursor-pointer"
              >
                <Play className="w-5 h-5" />
                {t('home.readNow')}
              </motion.span>
            </Link>
          ) : (
            <Link href={session?.user ? '/creator/manga/new' : '/auth/register'}>
              <motion.span
                whileHover={hoverScale}
                whileTap={tapScale}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                {session?.user ? t('creator.newManga') : t('home.ctaHeroRegister')}
              </motion.span>
            </Link>
          )}
          <Link href="/explore">
            <motion.span
              whileHover={hoverScale}
              whileTap={tapScale}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
            >
              <Compass className="w-5 h-5" />
              {coverUrl ? t('home.exploreMangas') : t('home.ctaHeroLearnMore')}
            </motion.span>
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap gap-6 md:gap-10 pt-6 border-t border-[var(--border)]" suppressHydrationWarning>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--primary)]" />
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]"><CountUp value={totalMangas} /></p>
              <p className="text-xs text-[var(--text-muted)]">{t('home.mangas')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--accent-purple)]" />
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]"><CountUp value={totalReaders} /></p>
              <p className="text-xs text-[var(--text-muted)]">{t('home.readers')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-[var(--accent-blue)]" />
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]"><CountUp value={totalChapters} /></p>
              <p className="text-xs text-[var(--text-muted)]">{t('manga.chapters')}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
