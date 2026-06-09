'use client';

import {
  motion,
  useReducedMotion,
  AnimatePresence,
  type Variants,
} from 'framer-motion';
import { Sparkles, X, Minus, Check, ChevronRight, BookOpen, Wand2, Users, BarChart3, Coins, Globe, Moon, Smartphone, Zap, Shield, Gift, HelpCircle, Star, Trophy, Languages, Download, Crown, Clock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Container } from '@/components/Layout/Container';
import { useT } from '@/i18n';
import { PLATFORM_LOGOS } from './components/PlatformLogos';

// ── Data ──────────────────────────────────────────────

const PLATFORMS = [
  { id: 'mangaaura', name: 'MangaAura', color: 'from-primary to-accent-purple' as const, isMangaAura: true },
  { id: 'mangaplus', name: 'Manga Plus', color: 'from-red-500 to-orange-500', isMangaAura: false },
  { id: 'webtoon', name: 'Webtoon', color: 'from-green-500 to-emerald-500', isMangaAura: false },
  { id: 'tapas', name: 'Tapas', color: 'from-blue-500 to-indigo-500', isMangaAura: false },
  { id: 'shonenjump', name: 'Shonen Jump', color: 'from-yellow-500 to-orange-500', isMangaAura: false },
  { id: 'mangadex', name: 'MangaDex', color: 'from-orange-500 to-orange-500', isMangaAura: false },
  { id: 'inkr', name: 'INKR', color: 'from-cyan-500 to-teal-500', isMangaAura: false },
] as const;

interface FeatureDef {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  values: Record<string, 'yes' | 'no' | 'limited' | 'comingSoon'>;
}

const READER_FEATURES: FeatureDef[] = [
  { key: 'freeReading', icon: BookOpen, values: { mangaaura: 'yes', mangaplus: 'yes', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'yes', inkr: 'yes' } },
  { key: 'offlineReading', icon: Download, values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'yes', shonenjump: 'yes', mangadex: 'no', inkr: 'no' } },
  { key: 'pwa', icon: Smartphone, values: { mangaaura: 'yes', mangaplus: 'yes', webtoon: 'yes', tapas: 'yes', shonenjump: 'yes', mangadex: 'no', inkr: 'yes' } },
  { key: 'aiRecs', icon: Zap, values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'no', inkr: 'no' } },
  { key: 'syncProgress', icon: Crown, values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'yes', tapas: 'yes', shonenjump: 'yes', mangadex: 'no', inkr: 'no' } },
  { key: 'gamification', icon: Trophy, values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'limited', tapas: 'limited', shonenjump: 'no', mangadex: 'no', inkr: 'no' } },
  { key: 'community', icon: Users, values: { mangaaura: 'yes', mangaplus: 'limited', webtoon: 'limited', tapas: 'limited', shonenjump: 'no', mangadex: 'yes', inkr: 'no' } },
  { key: 'adFree', icon: Shield, values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'yes', shonenjump: 'yes', mangadex: 'yes', inkr: 'yes' } },
  { key: 'multiLanguage', icon: Globe, values: { mangaaura: 'yes', mangaplus: 'yes', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'yes', inkr: 'limited' } },
  { key: 'darkMode', icon: Moon, values: { mangaaura: 'yes', mangaplus: 'yes', webtoon: 'yes', tapas: 'yes', shonenjump: 'yes', mangadex: 'yes', inkr: 'no' } },
];

const CREATOR_FEATURES: FeatureDef[] = [
  { key: 'openPublishing', icon: BookOpen, values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'yes', inkr: 'limited' } },
  { key: 'aiArt', icon: Wand2, values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'no', shonenjump: 'no', mangadex: 'no', inkr: 'no' } },
  { key: 'aiTranslate', icon: Languages, values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'no', shonenjump: 'no', mangadex: 'no', inkr: 'yes' } },
  { key: 'analytics', icon: BarChart3, values: { mangaaura: 'yes', mangaplus: 'limited', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'no', inkr: 'yes' } },
  { key: 'directFunding', icon: Coins, values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'no', shonenjump: 'no', mangadex: 'no', inkr: 'no' } },
  { key: 'tipping', icon: Gift, values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'yes', shonenjump: 'no', mangadex: 'no', inkr: 'no' } },
  { key: 'crowdfunding', icon: Star, values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'no', shonenjump: 'no', mangadex: 'no', inkr: 'no' } },
  { key: 'revenueShare', icon: Crown, values: { mangaaura: 'yes', mangaplus: 'limited', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'no', inkr: 'yes' } },
];

const FAQ_ITEMS = [
  { q: 'comparison.faq1Q', a: 'comparison.faq1A' },
  { q: 'comparison.faq2Q', a: 'comparison.faq2A' },
  { q: 'comparison.faq3Q', a: 'comparison.faq3A' },
  { q: 'comparison.faq4Q', a: 'comparison.faq4A' },
];

// ── Variants ──────────────────────────────────────────

const staggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ── Reusable section badge (matching /about-us pattern) ──

function SectionBadge({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] mb-4">
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </span>
  );
}

// ── Sub-components ───────────────────────────────────

function ValueIcon({ value }: { value: string }) {
  if (value === 'yes') {
    return (
      <motion.div
        whileHover={{ scale: 1.2 }}
        className="w-6 h-6 rounded-full bg-[var(--primary)]/15 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-200"
      >
        <Check className="w-3.5 h-3.5 text-[var(--primary)]" />
      </motion.div>
    );
  }
  if (value === 'limited') {
    return (
      <motion.div
        whileHover={{ scale: 1.2 }}
        className="w-6 h-6 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-200"
      >
        <Minus className="w-3.5 h-3.5 text-yellow-500" />
      </motion.div>
    );
  }
  if (value === 'comingSoon') {
    return (
      <motion.div
        whileHover={{ scale: 1.2 }}
        className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-200"
      >
        <Clock className="w-3.5 h-3.5 text-blue-500" />
      </motion.div>
    );
  }
  return (
    <motion.div
      whileHover={{ scale: 1.2 }}
      className="w-6 h-6 rounded-full bg-[var(--border-subtle)] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-200"
    >
      <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
    </motion.div>
  );
}

function SectionHeading({ badge, title, subtitle, icon: Icon }: { badge?: string; title: string; subtitle?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="text-center mb-16">
      {badge && (
        <SectionBadge icon={Icon}>{badge}</SectionBadge>
      )}        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--text-primary)]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
        className="h-0.5 w-16 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] mx-auto mt-5 rounded-full origin-center"
      />
    </div>
  );
}

function PlatformBadge({ platform, isHeader }: { platform: typeof PLATFORMS[number]; isHeader?: boolean }) {
  const LogoComponent = PLATFORM_LOGOS[platform.id];
  return (
    <div className={`flex items-center gap-2 ${isHeader ? 'justify-center' : ''}`}>
      <div className={`${isHeader ? 'w-8 h-8' : 'w-6 h-6'} flex-shrink-0`}>
        {LogoComponent && <LogoComponent className="w-full h-full" />}
      </div>
      <span className={`font-semibold ${isHeader ? 'text-sm' : 'text-xs'} leading-tight ${platform.isMangaAura ? 'text-[var(--primary)]' : ''}`}>
        {platform.name}
      </span>
      {platform.isMangaAura && !isHeader && (
        <Sparkles className="w-3 h-3 text-[var(--primary)]" />
      )}
    </div>
  );
}

function FeatureRow({ feature, t }: { feature: FeatureDef; t: (key: string) => string }) {
  const Icon = feature.icon;
  return (
    <motion.tr
      variants={itemVariants}
      className="border-b border-[var(--border-subtle)] last:border-b-0 group hover:bg-[var(--primary)]/[0.03] transition-all duration-200"
    >        <td className="py-3 px-3 relative after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:w-0.5 after:h-0 after:bg-[var(--primary)] after:rounded-full after:transition-all after:duration-200 group-hover:after:h-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-[var(--primary)]/15 transition-all duration-300">
            <Icon className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <span className="text-sm font-medium">{t(`comparison.feature.${feature.key}`)}</span>
        </div>
      </td>
      {PLATFORMS.map((pf) => (
        <td key={pf.id} className="py-3 px-2 text-center">
          <ValueIcon value={feature.values[pf.id]} />
        </td>
      ))}
    </motion.tr>
  );
}

function ComparisonTable({
  features,
  t,
  ariaLabel,
}: {
  features: FeatureDef[];
  t: (key: string) => string;
  ariaLabel: string;
}) {
  const isReduced = useReducedMotion() ?? false;

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]" tabIndex={0} role="region" aria-label={ariaLabel}>
        <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b-2 border-[var(--border)]">
            <th className="text-left py-4 px-3 w-[200px]" />
            {PLATFORMS.map((pf) => (
              <th key={pf.id} className="py-3 px-2 text-center min-w-[90px]">
                <PlatformBadge platform={pf} isHeader />
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          variants={isReduced ? undefined : staggerVariants}
          initial={isReduced ? undefined : 'hidden'}
          whileInView={isReduced ? undefined : 'visible'}
          viewport={{ once: true, margin: '-40px' }}
        >
          {features.map((feature) => (
            <FeatureRow key={feature.key} feature={feature} t={t} />
          ))}
        </motion.tbody>
      </table>
      </div>
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="md:hidden text-xs text-[var(--text-muted)] text-center mt-2 italic pointer-events-none select-none"
      >
        ← {t('comparison.scrollHint')} →
      </motion.div>
    </>
  );
}

function getPlatform(id: string) {
  return PLATFORMS.find((p) => p.id === id)!;
}

function PlatformSummaryCards({ t }: { t: (key: string) => string }) {
  const cards = [
    {
      platform: getPlatform('mangaaura'),
      descKey: 'platformMangaAuraDesc',
      badges: ['creation.feature.aiArt', 'creation.feature.crowdfunding', 'creation.feature.gamification'],
    },
    {
      platform: getPlatform('mangaplus'),
      descKey: 'platformMangaPlusDesc',
      badges: ['platform.mangaplus.simulpub', 'platform.mangaplus.official'],
    },
    {
      platform: getPlatform('webtoon'),
      descKey: 'platformWebtoonDesc',
      badges: ['platform.webtoon.canvas', 'platform.webtoon.audience'],
    },
    {
      platform: getPlatform('tapas'),
      descKey: 'platformTapasDesc',
      badges: ['platform.taps.open', 'platform.taps.monetization'],
    },
    {
      platform: getPlatform('inkr'),
      descKey: 'platformInkrDesc',
      badges: ['platform.inkr.aitranslate', 'platform.inkr.curated'],
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
      {cards.map((card, i) => (
        <motion.div
          key={card.platform.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}            transition={{ delay: i * 0.08, duration: 0.3 }}
          className={`rounded-xl border p-6 transition-all duration-300 hover:-translate-y-0.5 h-full flex flex-col ${
            card.platform.isMangaAura
              ? 'border-[var(--primary)]/30 bg-[var(--primary)]/[0.03] shadow-sm hover:shadow-md hover:border-[var(--primary)]/50'
              : 'border-[var(--border)] bg-[var(--surface)] hover:shadow-sm hover:border-[var(--border-subtle)]'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 flex-shrink-0">
              {(() => { const Logo = PLATFORM_LOGOS[card.platform.id]; return Logo ? <Logo className="w-full h-full" /> : <div className={`w-full h-full rounded-lg bg-gradient-to-br ${card.platform.color} flex items-center justify-center`}><span className="text-xs font-bold text-white">{card.platform.name.charAt(0)}</span></div>; })()}
            </div>
            <span className={`font-bold text-sm ${card.platform.isMangaAura ? 'text-[var(--primary)]' : ''}`}>
              {card.platform.name}
            </span>
            {card.platform.isMangaAura && <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />}
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 flex-1">
            {t(`comparison.${card.descKey}`)}
          </p>
          <div className="flex flex-wrap gap-2">
            {card.badges.map((b) => (
              <span
                key={b}
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  card.platform.isMangaAura
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'bg-[var(--surface-sunken)] text-[var(--text-muted)]'
                }`}
              >
                {t(`comparison.${b}`)}
              </span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function FaqAccordion({ t }: { t: (key: string) => string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden transition-all duration-200 hover:border-[var(--primary)]/20"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left font-medium text-sm transition-colors hover:bg-[var(--surface-sunken)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset"
              aria-expanded={isOpen}
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                {t(item.q)}
              </span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-5 h-5 flex items-center justify-center flex-shrink-0 ml-3 text-[var(--text-muted)]"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] pt-3">
                    {t(item.a)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────

export default function ComparisonClient() {
  const t = useT();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle background gradient (matching /about-us pattern) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent-purple)]/10 pointer-events-none" />
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--primary)]/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-purple)]/10 rounded-full blur-3xl pointer-events-none"
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 mb-5 shadow-[0_0_12px_var(--primary)/0.1]"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </motion.span>
              {t('comparison.heroBadge')}
            </motion.span>
            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold mb-4 text-[var(--text-primary)] max-w-4xl mx-auto">
              {t('comparison.heroTitle')}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
              {t('comparison.heroSubtitle')}
            </p>
          </motion.div>

          {/* Platform badges */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } },
            }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {PLATFORMS.map((pf) => (
              <motion.div
                key={pf.id}
                variants={{
                  hidden: { opacity: 0, y: 10, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
                }}
                className="transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
              >
                <PlatformBadge platform={pf} />
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* ── Platform Summaries ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--surface)]" />
        <Container className="relative z-10">
          <PlatformSummaryCards t={t} />
        </Container>
      </section>

      {/* ── Reader Features Table ── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--background)]" />
        <Container size="large" className="relative z-10">
          <SectionHeading
            badge={t('comparison.forReaders')}
            title={t('comparison.readerSectionTitle')}
            subtitle={t('comparison.readerSectionSubtitle')}
            icon={BookOpen}
          />
          <ComparisonTable
            features={READER_FEATURES}
            t={t}
            ariaLabel="Tabla comparativa de funciones para lectores"
          />
        </Container>
      </section>

      {/* ── Creator Features Table ── */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--surface)]" />
        <Container size="large" className="relative z-10">
          <SectionHeading
            badge={t('comparison.forCreators')}
            title={t('comparison.creatorSectionTitle')}
            subtitle={t('comparison.creatorSectionSubtitle')}
            icon={Wand2}
          />
          <ComparisonTable
            features={CREATOR_FEATURES}
            t={t}
            ariaLabel="Tabla comparativa de funciones para creadores"
          />
        </Container>
      </section>

      {/* ── Legend ── */}
      <section className="relative py-10 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--background)]" />
        <Container className="relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[var(--primary)]/15 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-[var(--primary)]" />
              </div>
              {t('comparison.yes')}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500/15 flex items-center justify-center">
                <Minus className="w-2.5 h-2.5 text-yellow-500" />
              </div>
              {t('comparison.limited')}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[var(--border-subtle)] flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-[var(--text-muted)]" />
              </div>
              {t('comparison.no')}
            </div>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)] mt-4">
            {t('comparison.footerText')}
          </p>
        </Container>
      </section>

      {/* ── MangaAura Advantages ── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--surface)]" />
        <Container className="relative z-10">
          <SectionHeading
            title={t('comparison.advantagesTitle')}
            subtitle={t('comparison.advantagesSubtitle')}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
            {[
              { icon: Wand2, key: 'advantageAI', className: 'lg:col-span-2' },
              { icon: Trophy, key: 'advantageGamification', className: '' },
              { icon: Coins, key: 'advantageCrowdfunding', className: '' },
              { icon: Gift, key: 'advantageAura', className: '' },
              { icon: Smartphone, key: 'advantagePWA', className: '' },
              { icon: Users, key: 'advantageCommunity', className: 'lg:col-span-3' },
            ].map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: 'easeOut' }}
                className={`flex gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--primary)]/30 hover:shadow-[0_0_24px_-8px_var(--primary)] hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 group h-full ${
                  item.className
                } ${i === 0 ? 'lg:flex-row lg:items-center' : ''}`}
              >
                <div className={`rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-[var(--primary)]/15 transition-all duration-300 ${
                  i === 0 ? 'w-12 h-12' : 'w-10 h-10'
                }`}>
                  <item.icon className={`text-[var(--primary)] ${
                    i === 0 ? 'w-6 h-6' : 'w-5 h-5'
                  }`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold mb-1">{t(`comparison.${item.key}`)}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t(`comparison.${item.key}Desc`)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── FAQ ── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--background)]" />
        <Container className="relative z-10">
          <SectionHeading
            badge="FAQ"
            title={t('comparison.faqTitle')}
            subtitle={t('comparison.faqSubtitle')}
            icon={HelpCircle}
          />
          <FaqAccordion t={t} />
        </Container>
      </section>

      {/* ── CTA ── */}
      <section className="relative pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--surface)]" />
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative max-w-3xl mx-auto text-center"
          >
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--text-primary)]">
                {t('comparison.ctaTitle')}
              </h2>
              <p className="text-lg text-[var(--text-secondary)] mb-8">
                {t('comparison.ctaSubtitle')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-[var(--text-inverse)] font-bold rounded-xl hover:opacity-90 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
              >
                {t('comparison.ctaButton')}
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--surface-elevated)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
              >
                {t('comparison.ctaExplore')}
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
