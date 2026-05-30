'use client';

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  Clock, TrendingUp, Sparkles, BookOpen, Wand2, WifiOff,
  Gamepad2, Coins, HelpCircle, ArrowRight, Rocket, Star,
  Play, Compass, Users, BookMarked, Flame, Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState, useCallback } from 'react';

import { GenreMarquee } from '@/components/GenreMarquee';
import { ContinueReadingSection } from '@/components/Home/ContinueReadingSection';
import { HomeNewsSection } from '@/components/Home/HomeNewsSection';
import { HomeRankingsSidebar } from '@/components/Home/HomeRankingsSidebar';
import { QuestPanelWrapper } from '@/components/Home/QuestPanelWrapper';
import { TiltCard } from '@/components/Home/TiltCard';
import { MangaCard } from '@/components/MangaCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { useT } from '@/i18n';

interface MangaData {
  id: string;
  title: string;
  slug?: string;
  coverUrl?: string | null;
  status?: string;
  tags?: string[];
  authorName?: string | null;
  authorUsername?: string;
  rating?: number;
  chapterCount?: number;
  totalViews?: number;
}

interface UserData {
  id: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  xpPoints: number;
}

interface FeaturedManga {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  description: string | null;
  authorName: string | null;
}

interface HomeContentProps {
  latestMangas: MangaData[];
  topMangas: MangaData[];
  updatingMangas: MangaData[];
  topUsers: UserData[];
  featuredManga: FeaturedManga | null;
  totalMangas: number;
  totalReaders: number;
  totalChapters: number;
}

// ─── Animation Variants ──────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const EASE_OUT = [0.25, 0.1, 0.25, 1] as const;

const slideUpItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

const fadeInItem = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

const scaleInItem = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

const cardStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

// ─── Section Header Component ────────────────────────────────────

function SectionHeader({
  icon,
  label,
  action,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  action?: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <motion.div
      variants={slideUpItem}
      className="flex items-end justify-between mb-6 group"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-1 h-8 rounded-full hidden sm:block"
          style={{ backgroundColor: accentColor ?? 'var(--primary)' }}
        />
        <div className="flex items-center gap-3">
          <span style={{ color: accentColor ?? 'var(--primary)' }}>{icon}</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide text-[var(--text-primary)] leading-none">
            {label}
          </h2>
        </div>
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
}

// ─── Stat Counter ────────────────────────────────────────────────

function AnimatedStat({ value, label, icon, color }: {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          if (shouldReduceMotion) {
            setCount(value);
            return;
          }
          let start: number | null = null;
          const duration = 2000;
          const step = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.floor(eased * value));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, shouldReduceMotion]);

  return (
    <div ref={ref} className="flex items-center gap-2">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums">
          {count.toLocaleString()}
        </p>
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ─── Floating Orbs ───────────────────────────────────────────────

function FloatingOrbs({ count = 6 }: { count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const size = 50 + Math.random() * 150;
        const x = 5 + Math.random() * 90;
        const y = 5 + Math.random() * 90;
        const colors = [
          'from-[var(--primary)]/5 to-transparent',
          'from-[var(--accent-purple)]/5 to-transparent',
          'from-[var(--accent-red)]/3 to-transparent',
          'from-[var(--accent-blue)]/5 to-transparent',
          'from-amber-500/5 to-transparent',
          'from-cyan-500/5 to-transparent',
        ];
        return (
          <motion.div
            key={i}
            className={`absolute rounded-full bg-gradient-to-br ${colors[i % colors.length]}`}
            style={{
              width: size,
              height: size,
              left: `${x}%`,
              top: `${y}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 4 + i * 0.8,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
            suppressHydrationWarning
          />
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SECTION COMPONENTS (module-level — stable references)
// ═══════════════════════════════════════════════════════════════════

// ─── Hero Section ────────────────────────────────────────────────

function HeroSection({
  featuredManga,
  totalMangas,
  totalReaders,
  totalChapters,
}: {
  featuredManga: FeaturedManga | null;
  totalMangas: number;
  totalReaders: number;
  totalChapters: number;
}) {
  const t = useT();
  const { data: session } = useSession();
  const shouldReduceMotion = useReducedMotion();
  const hasFeatured = !!featuredManga?.coverUrl;
  const heroTitle = featuredManga?.title ?? 'MANGA AURA';
  const heroDesc = featuredManga?.description
    ? featuredManga.description.length > 220
      ? featuredManga.description.slice(0, 220) + '...'
      : featuredManga.description
    : t('home.description');

  const magnet1Ref = useRef<HTMLDivElement>(null);
  const magnet2Ref = useRef<HTMLDivElement>(null);

  const handleMagnet1 = useCallback(
    (e: React.MouseEvent) => {
      if (!magnet1Ref.current || shouldReduceMotion) return;
      const rect = magnet1Ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      magnet1Ref.current.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    },
    [shouldReduceMotion],
  );

  const handleMagnet1Leave = useCallback(() => {
    if (!magnet1Ref.current) return;
    magnet1Ref.current.style.transform = 'translate(0px, 0px)';
  }, []);

  const handleMagnet2 = useCallback(
    (e: React.MouseEvent) => {
      if (!magnet2Ref.current || shouldReduceMotion) return;
      const rect = magnet2Ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      magnet2Ref.current.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    },
    [shouldReduceMotion],
  );

  const handleMagnet2Leave = useCallback(() => {
    if (!magnet2Ref.current) return;
    magnet2Ref.current.style.transform = 'translate(0px, 0px)';
  }, []);

  return (
    <section className="relative min-h-[75vh] md:min-h-[85vh] flex items-center overflow-hidden rounded-3xl mb-8">
      {/* Background */}
      {hasFeatured ? (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${featuredManga!.coverUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/70 to-[var(--background)]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-[var(--background)]/20" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent-purple)]/5"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-[var(--background)] to-[var(--accent-purple)]/10">
          <FloatingOrbs count={8} />
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--primary)]/15 to-transparent" />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--accent-purple)]/15 to-transparent" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 md:py-28">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
          suppressHydrationWarning
        >
          {/* Label */}
          <motion.div variants={slideUpItem} className="mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-widest">
              {featuredManga ? (
                <><Star className="w-3 h-3" /> {t('home.featured')}</>
              ) : (
                <><Sparkles className="w-3 h-3" /> MANGA AURA</>
              )}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={slideUpItem}
            className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-[var(--text-primary)] leading-[0.85] mb-6"
          >
            {hasFeatured ? (
              <span className="bg-gradient-to-r from-[var(--text-primary)] via-[var(--text-primary)] to-[var(--primary)] bg-clip-text text-transparent">
                {heroTitle}
              </span>
            ) : (
              <>
                <span className="bg-gradient-to-r from-[var(--primary)] via-[var(--accent-purple)] to-[var(--accent-blue)] bg-clip-text text-transparent">
                  MANGA
                </span>
                <br />
                <span className="text-[var(--text-primary)]">AURA</span>
              </>
            )}
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={slideUpItem}
            className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mb-8 leading-relaxed"
          >
            {heroDesc}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={slideUpItem}
            className="flex flex-wrap gap-4 mb-12"
            suppressHydrationWarning
          >
            {hasFeatured ? (
              <Link href={`/manga/${featuredManga!.slug}`}>
                <motion.div
                  ref={magnet1Ref}
                  onMouseMove={handleMagnet1}
                  onMouseLeave={handleMagnet1Leave}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white shadow-lg shadow-[var(--primary)]/20 cursor-pointer transition-shadow hover:shadow-xl hover:shadow-[var(--primary)]/30"
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Play className="w-5 h-5" />
                  {t('home.readNow')}
                </motion.div>
              </Link>
            ) : (
              <Link href={session?.user ? '/creator/manga/new' : '/auth/register'}>
                <motion.div
                  ref={magnet1Ref}
                  onMouseMove={handleMagnet1}
                  onMouseLeave={handleMagnet1Leave}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white shadow-lg shadow-[var(--primary)]/20 cursor-pointer transition-shadow hover:shadow-xl hover:shadow-[var(--primary)]/30"
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Sparkles className="w-5 h-5" />
                  {session?.user ? t('creator.newManga') : t('home.ctaHeroRegister')}
                </motion.div>
              </Link>
            )}
            <Link href="/explore">
              <motion.div
                ref={magnet2Ref}
                onMouseMove={handleMagnet2}
                onMouseLeave={handleMagnet2Leave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] cursor-pointer transition-colors"
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Compass className="w-5 h-5" />
                {featuredManga ? t('home.exploreMangas') : t('home.ctaHeroLearnMore')}
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={slideUpItem}
            className="flex flex-wrap gap-6 md:gap-10 pt-6 border-t border-[var(--border)]"
            suppressHydrationWarning
          >
            <AnimatedStat
              value={totalMangas}
              label={t('home.mangas')}
              icon={<BookOpen className="w-4 h-4 text-white" />}
              color="bg-gradient-to-br from-[var(--primary)] to-[var(--accent-blue)]"
            />
            <AnimatedStat
              value={totalReaders}
              label={t('home.readers')}
              icon={<Users className="w-4 h-4 text-white" />}
              color="bg-gradient-to-br from-[var(--accent-purple)] to-[var(--primary)]"
            />
            <AnimatedStat
              value={totalChapters}
              label={t('manga.chapters')}
              icon={<BookMarked className="w-4 h-4 text-white" />}
              color="bg-gradient-to-br from-cyan-500 to-[var(--accent-blue)]"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative side accent */}
      {hasFeatured && (
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-[var(--primary)]/3 to-transparent" />
          <div className="absolute right-16 top-1/4 w-px h-1/2 bg-gradient-to-b from-transparent via-[var(--primary)]/20 to-transparent" />
        </div>
      )}
    </section>
  );
}

// ─── Top Mangas Section ──────────────────────────────────────────

function TopMangasSection({ topMangas }: { topMangas: MangaData[] }) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  const scroll = useCallback(
    (dir: 'left' | 'right') => {
      if (!scrollRef.current) return;
      const amount = scrollRef.current.clientWidth * 0.6;
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    },
    [],
  );

  const rankedMangas = [...topMangas].sort((a, b) => (b.totalViews ?? 0) - (a.totalViews ?? 0));

  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      className="relative"
    >
      <SectionHeader
        icon={<Flame className="w-6 h-6 text-[var(--accent-red)]" />}
        label={t('home.topMangas')}
        accentColor="var(--accent-red)"
        action={
          <div className="hidden sm:flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll('left')}
              className={`w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center transition-colors ${
                canScrollLeft
                  ? 'hover:bg-[var(--surface)] text-[var(--text-primary)]'
                  : 'opacity-30 cursor-default'
              }`}
              aria-label="Scroll left"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll('right')}
              className={`w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center transition-colors ${
                canScrollRight
                  ? 'hover:bg-[var(--surface)] text-[var(--text-primary)]'
                  : 'opacity-30 cursor-default'
              }`}
              aria-label="Scroll right"
            >
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        }
      />

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-r from-[var(--background)] to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-l from-[var(--background)] to-transparent" />

        <motion.div
          variants={fadeInItem}
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {rankedMangas.map((manga, index) => {
            const rankColors = [
              'from-amber-500 to-yellow-600',
              'from-zinc-400 to-zinc-500',
              'from-amber-700 to-amber-800',
            ];
            return (
              <motion.div
                key={manga.id}
                variants={cardItem}
                className="flex-shrink-0 snap-start"
                suppressHydrationWarning
              >
                <div className="relative mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${rankColors[index] || 'from-[var(--surface)] to-[var(--surface-elevated)]'} flex items-center justify-center shadow-lg`}
                  >
                    <span
                      className={`text-sm font-black ${index < 3 ? 'text-white' : 'text-[var(--text-secondary)]'}`}
                    >
                      {index + 1}
                    </span>
                  </div>
                </div>
                <TiltCard maxRotation={6} className="transition-transform duration-200 ease-out">
                  <MangaCard
                    manga={{
                      id: manga.id,
                      title: manga.title,
                      slug: manga.slug,
                      coverUrl: manga.coverUrl,
                      status: manga.status,
                      tags: manga.tags,
                      authorName: manga.authorName,
                      authorUsername: manga.authorUsername,
                      rating: manga.rating,
                      chapterCount: manga.chapterCount,
                      totalViews: manga.totalViews,
                    }}
                    size="lg"
                  />
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <motion.div variants={fadeInItem} className="flex justify-center mt-6">
        <Link href="/rankings">
          <Button variant="outline" size="sm">
            {t('home.viewFullRankings')} <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </motion.div>
    </motion.section>
  );
}

// ─── How It Works Section ────────────────────────────────────────

function HowItWorksSection() {
  const t = useT();
  const steps = [
    { icon: BookOpen, title: t('home.step1Title'), desc: t('home.step1Desc'), color: 'from-[var(--primary)] to-[var(--accent-blue)]', delay: 0 },
    { icon: Wand2, title: t('home.step2Title'), desc: t('home.step2Desc'), color: 'from-[var(--accent-purple)] to-[var(--primary)]', delay: 0.15 },
    { icon: Coins, title: t('home.step3Title'), desc: t('home.step3Desc'), color: 'from-amber-500 to-rose-500', delay: 0.3 },
  ];

  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      <SectionHeader
        icon={<Zap className="w-6 h-6 text-amber-500" />}
        label={t('home.howItWorksTitle')}
        accentColor="#f59e0b"
      />

      <motion.p
        variants={slideUpItem}
        className="text-[var(--text-secondary)] mb-10 max-w-2xl"
      >
        {t('home.howItWorksDesc')}
      </motion.p>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={i}
              variants={cardItem}
              suppressHydrationWarning
            >
              <TiltCard
                maxRotation={8}
                className="relative h-full p-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/30 transition-colors duration-300 group overflow-hidden"
              >
                <div className="absolute -inset-1 bg-gradient-to-br from-[var(--primary)]/0 via-transparent to-[var(--accent-purple)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

                <div className="relative z-10" style={{ transform: 'translateZ(30px)' }}>
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-display text-2xl tracking-wide mb-2 text-[var(--text-primary)]">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">{step.desc}</p>
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

// ─── Features Section ────────────────────────────────────────────

function FeaturesSection() {
  const t = useT();
  const features = [
    { icon: Wand2, title: t('home.featureAI'), desc: t('home.featureAIDesc'), color: 'from-[var(--primary)] to-[var(--accent-blue)]' },
    { icon: WifiOff, title: t('home.featurePWA'), desc: t('home.featurePWADesc'), color: 'from-[var(--accent-purple)] to-[var(--primary)]' },
    { icon: Gamepad2, title: t('home.featureGamification'), desc: t('home.featureGamificationDesc'), color: 'from-emerald-500 to-cyan-500' },
    { icon: Rocket, title: t('home.featureCrowdfunding'), desc: t('home.featureCrowdfundingDesc'), color: 'from-[var(--accent-blue)] to-[var(--accent-purple)]' },
  ];

  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      <SectionHeader
        icon={<Rocket className="w-6 h-6 text-cyan-500" />}
        label={t('home.featuresTitle')}
        accentColor="#06b6d4"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <motion.div
              key={i}
              variants={cardItem}
              className="relative p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/20 transition-all duration-300 group overflow-hidden"
              suppressHydrationWarning
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)]/0 to-transparent group-hover:via-[var(--primary)]/50 transition-all duration-500" />

              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-base mb-2 text-[var(--text-primary)]">{feat.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{feat.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

// ─── FAQ Section ─────────────────────────────────────────────────

function FAQSection() {
  const t = useT();
  const faqs = [
    { q: t('home.visibleFaq1Q'), a: t('home.visibleFaq1A') },
    { q: t('home.visibleFaq2Q'), a: t('home.visibleFaq2A') },
    { q: t('home.visibleFaq3Q'), a: t('home.visibleFaq3A') },
    { q: t('home.visibleFaq4Q'), a: t('home.visibleFaq4A') },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      <SectionHeader
        icon={<HelpCircle className="w-6 h-6 text-[var(--primary)]" />}
        label={t('home.visibleFaqTitle')}
        accentColor="var(--primary)"
      />

      <div className="max-w-3xl mx-auto mt-2 space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <motion.div
              key={i}
              variants={cardItem}
              className="border border-[var(--border)] rounded-xl overflow-hidden"
              suppressHydrationWarning
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--surface)] transition-colors"
              >
                <span className="flex items-center gap-3 font-medium text-[var(--text-primary)]">
                  <HelpCircle className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                  {faq.q}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] mt-2">
                      <p className="pt-3 text-sm text-[var(--text-secondary)]">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────

function CTASection() {
  const t = useT();
  const { data: session } = useSession();
  const href = !session?.user ? '/auth/register' : '/creator/manga/new';
  const label = !session?.user ? t('nav.register') : t('creator.newManga');

  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      <motion.div
        variants={scaleInItem}
        className="relative overflow-hidden rounded-3xl border border-[var(--accent-purple)]/30"
        suppressHydrationWarning
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-purple)]/20 via-[var(--accent-purple)]/5 to-[var(--accent-blue)]/15" />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--accent-purple)]/15 rounded-full blur-[80px] animate-pulse pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[var(--primary)]/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-10 md:p-14">
          <div className="max-w-xl">
            <motion.h2
              variants={slideUpItem}
              className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wide text-[var(--text-primary)] mb-3"
            >
              {t('home.ctaCreatorTitle')}
            </motion.h2>
            <motion.p
              variants={slideUpItem}
              className="text-[var(--text-secondary)]"
            >
              {t('home.ctaCreatorDesc')}
            </motion.p>
          </div>
          <motion.div variants={slideUpItem} suppressHydrationWarning>
            <Link href={href}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--primary)] text-white shadow-lg shadow-[var(--accent-purple)]/20 cursor-pointer"
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Sparkles className="w-5 h-5" />
                {label}
                <ArrowRight className="w-4 h-4 ml-1" />
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function HomeContent({
  latestMangas,
  topMangas,
  updatingMangas,
  topUsers,
  featuredManga,
  totalMangas,
  totalReaders,
  totalChapters,
}: HomeContentProps) {
  const t = useT();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <HeroSection
        featuredManga={featuredManga}
        totalMangas={totalMangas}
        totalReaders={totalReaders}
        totalChapters={totalChapters}
      />

      <div className="max-w-7xl mx-auto px-6 pb-16 space-y-20">
        {/* Genre Marquee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <GenreMarquee />
        </motion.div>

        {/* Top Mangas */}
        <TopMangasSection topMangas={topMangas} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-14">
            {/* Latest Updates */}
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              <SectionHeader
                icon={<Clock className="w-6 h-6 text-[var(--accent-blue)]" />}
                label={t('home.latestUpdates')}
                accentColor="var(--accent-blue)"
                action={
                  <Link href="/explore">
                    <Button variant="ghost" size="sm">
                      {t('common.viewAll')} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                }
              />

              <motion.div
                variants={cardStagger}
                className="grid grid-cols-2 sm:grid-cols-3 gap-4"
              >
                {updatingMangas.map((manga) => (
                  <motion.div key={manga.id} variants={cardItem} suppressHydrationWarning>
                    <TiltCard maxRotation={5} className="transition-transform duration-200 ease-out">
                      <MangaCard
                        manga={{
                          id: manga.id,
                          title: manga.title,
                          slug: manga.slug,
                          coverUrl: manga.coverUrl,
                          status: manga.status,
                          tags: manga.tags,
                          authorName: manga.authorName,
                          authorUsername: manga.authorUsername,
                          rating: manga.rating ?? 0,
                          chapterCount: manga.chapterCount ?? 0,
                        }}
                      />
                    </TiltCard>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* News */}
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              <SectionHeader
                icon={<Star className="w-6 h-6 text-[var(--warning)]" />}
                label={t('home.newsTitle')}
                accentColor="var(--warning)"
                action={
                  <Link href="/news">
                    <Button variant="ghost" size="sm">
                      {t('common.viewAll')} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                }
              />
              <motion.div variants={fadeInItem}>
                <HomeNewsSection />
              </motion.div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <ContinueReadingSection />
            <QuestPanelWrapper />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
            >
              <HomeRankingsSidebar topMangas={topMangas} />
            </motion.div>

            {/* Top Readers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    {t('home.topReaders')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topUsers.map((user, index) => {
                      const rankColors = ['text-amber-500', 'text-zinc-400', 'text-amber-700'];
                      return (
                        <Link
                          key={user.id}
                          href={'/user/' + user.username}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface)] transition-colors group"
                        >
                          <span
                            className={`text-lg font-bold w-6 text-center ${rankColors[index] || 'text-[var(--text-muted)]'}`}
                          >
                            #{index + 1}
                          </span>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center text-white font-bold shadow-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate group-hover:text-[var(--primary)] transition-colors">
                              {user.username}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {t('home.levelAndXp', { level: user.level, xp: user.xpPoints })}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <Link href="/rankings">
                    <Button variant="outline" className="w-full mt-4">
                      {t('home.viewFullRankings')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* New Releases */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-500" />
                    {t('home.newReleases')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {latestMangas.slice(0, 3).map((manga, i) => (
                    <motion.div
                      key={manga.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link
                        href={`/manga/${manga.slug}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-12 h-16 bg-[var(--surface-sunken)] rounded overflow-hidden flex-shrink-0 relative shadow-sm">
                          {manga.coverUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={manga.coverUrl}
                              alt={manga.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-cyan-500 transition-colors">
                            {manga.title}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{manga.authorName}</p>
                          {manga.chapterCount ? (
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                              {manga.chapterCount} capítulos
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Link href="/discover" className="w-full">
                    <Button variant="outline" className="w-full">
                      {t('home.viewAllNewReleases')}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* How It Works */}
        <HowItWorksSection />

        {/* Features */}
        <FeaturesSection />

        {/* FAQ */}
        <FAQSection />

        {/* CTA */}
        <CTASection />
      </div>
    </div>
  );
}
