'use client';

import {
  motion,
  useReducedMotion,
  AnimatePresence,
  type Variants,
} from 'framer-motion';
import { Sparkles, X, Minus, Check, ChevronRight, ArrowRight, BookOpen, Wand2, Users, BarChart3, Coins, Globe, Moon, Smartphone, Zap, Shield, Gift, HelpCircle, Star, Trophy, Languages, Download, Crown, Layout as LayoutIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n';

// ── Data ──────────────────────────────────────────────

const PLATFORMS = [
  { id: 'mangaaura', name: 'MangaAura', color: 'from-primary to-accent-purple' as const, isMangaAura: true },
  { id: 'mangaplus', name: 'Manga Plus', color: 'from-red-500 to-orange-500', isMangaAura: false },
  { id: 'webtoon', name: 'Webtoon', color: 'from-green-500 to-emerald-500', isMangaAura: false },
  { id: 'tapas', name: 'Tapas', color: 'from-blue-500 to-indigo-500', isMangaAura: false },
  { id: 'shonenjump', name: 'Shonen Jump', color: 'from-yellow-500 to-orange-500', isMangaAura: false },
  { id: 'mangadex', name: 'MangaDex', color: 'from-violet-500 to-purple-500', isMangaAura: false },
  { id: 'inkr', name: 'INKR', color: 'from-cyan-500 to-teal-500', isMangaAura: false },
] as const;

interface FeatureDef {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  values: Record<string, 'yes' | 'no' | 'limited' | 'comingSoon'>;
}

const READER_FEATURES: FeatureDef[] = [
  {
    key: 'freeReading',
    icon: BookOpen,
    values: { mangaaura: 'yes', mangaplus: 'yes', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'yes', inkr: 'yes' },
  },
  {
    key: 'offlineReading',
    icon: Download,
    values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'yes', shonenjump: 'yes', mangadex: 'no', inkr: 'no' },
  },
  {
    key: 'pwa',
    icon: Smartphone,
    values: { mangaaura: 'yes', mangaplus: 'yes', webtoon: 'yes', tapas: 'yes', shonenjump: 'yes', mangadex: 'no', inkr: 'yes' },
  },
  {
    key: 'aiRecs',
    icon: Zap,
    values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'no', inkr: 'no' },
  },
  {
    key: 'syncProgress',
    icon: LayoutIcon,
    values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'yes', tapas: 'yes', shonenjump: 'yes', mangadex: 'no', inkr: 'no' },
  },
  {
    key: 'gamification',
    icon: Trophy,
    values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'limited', tapas: 'limited', shonenjump: 'no', mangadex: 'no', inkr: 'no' },
  },
  {
    key: 'community',
    icon: Users,
    values: { mangaaura: 'yes', mangaplus: 'limited', webtoon: 'limited', tapas: 'limited', shonenjump: 'no', mangadex: 'yes', inkr: 'no' },
  },
  {
    key: 'adFree',
    icon: Shield,
    values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'yes', shonenjump: 'yes', mangadex: 'yes', inkr: 'yes' },
  },
  {
    key: 'multiLanguage',
    icon: Globe,
    values: { mangaaura: 'yes', mangaplus: 'yes', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'yes', inkr: 'limited' },
  },
  {
    key: 'darkMode',
    icon: Moon,
    values: { mangaaura: 'yes', mangaplus: 'yes', webtoon: 'yes', tapas: 'yes', shonenjump: 'yes', mangadex: 'yes', inkr: 'no' },
  },
];

const CREATOR_FEATURES: FeatureDef[] = [
  {
    key: 'openPublishing',
    icon: BookOpen,
    values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'yes', inkr: 'limited' },
  },
  {
    key: 'aiArt',
    icon: Wand2,
    values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'no', shonenjump: 'no', mangadex: 'no', inkr: 'no' },
  },
  {
    key: 'aiTranslate',
    icon: Languages,
    values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'no', shonenjump: 'no', mangadex: 'no', inkr: 'yes' },
  },
  {
    key: 'analytics',
    icon: BarChart3,
    values: { mangaaura: 'yes', mangaplus: 'limited', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'no', inkr: 'yes' },
  },
  {
    key: 'directFunding',
    icon: Coins,
    values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'no', shonenjump: 'no', mangadex: 'no', inkr: 'no' },
  },
  {
    key: 'tipping',
    icon: Gift,
    values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'yes', shonenjump: 'no', mangadex: 'no', inkr: 'no' },
  },
  {
    key: 'crowdfunding',
    icon: Star,
    values: { mangaaura: 'yes', mangaplus: 'no', webtoon: 'no', tapas: 'no', shonenjump: 'no', mangadex: 'no', inkr: 'no' },
  },
  {
    key: 'revenueShare',
    icon: Crown,
    values: { mangaaura: 'yes', mangaplus: 'limited', webtoon: 'yes', tapas: 'yes', shonenjump: 'no', mangadex: 'no', inkr: 'yes' },
  },
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ── Sub-components ───────────────────────────────────

function ValueIcon({ value }: { value: string }) {
  if (value === 'yes') {
    return (
      <div className="w-6 h-6 rounded-full bg-[var(--primary)]/15 flex items-center justify-center mx-auto">
        <Check className="w-3.5 h-3.5 text-[var(--primary)]" />
      </div>
    );
  }
  if (value === 'limited') {
    return (
      <div className="w-6 h-6 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto">
        <Minus className="w-3.5 h-3.5 text-yellow-500" />
      </div>
    );
  }
  if (value === 'comingSoon') {
    return (
      <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center mx-auto">
        <span className="text-[10px] font-bold text-blue-500">PRX</span>
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-[var(--border-subtle)] flex items-center justify-center mx-auto">
      <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
    </div>
  );
}

function SectionHeading({ badge, title, subtitle, icon: Icon }: { badge?: string; title: string; subtitle?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="text-center mb-10">
      {badge && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)] mb-4">
          {Icon && <Icon className="w-3 h-3" />}
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-bold mb-3">{title}</h2>
      {subtitle && <p className="text-[var(--text-secondary)] max-w-xl mx-auto">{subtitle}</p>}
    </div>
  );
}

function PlatformBadge({ platform, isHeader }: { platform: typeof PLATFORMS[number]; isHeader?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${isHeader ? 'justify-center' : ''}`}>
      <div className={`w-6 h-6 ${isHeader ? 'w-8 h-8' : ''} rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center flex-shrink-0`}>
        <span className={`${isHeader ? 'text-xs' : 'text-[10px]'} font-bold text-white`}>
          {platform.name.charAt(0)}
        </span>
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
      className="border-b border-[var(--border-subtle)] last:border-b-0 group hover:bg-[var(--primary)]/[0.02] transition-colors"
    >
      <td className="py-3 px-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
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
  badge,
}: {
  features: FeatureDef[];
  t: (key: string) => string;
  badge: string;
}) {
  const isReduced = useReducedMotion() ?? false;

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b-2 border-[var(--border)]">
            <th className="text-left py-4 px-3 w-[200px]">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)]">
                {badge}
              </span>
            </th>
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
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className={`rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${
            card.platform.isMangaAura
              ? 'border-[var(--primary)]/30 bg-[var(--primary)]/[0.03] shadow-sm hover:shadow-md hover:border-[var(--primary)]/50'
              : 'border-[var(--border)] bg-[var(--surface)] hover:shadow-sm hover:border-[var(--border-subtle)]'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.platform.color} flex items-center justify-center`}>
              <span className="text-xs font-bold text-white">{card.platform.name.charAt(0)}</span>
            </div>
            <span className={`font-bold text-sm ${card.platform.isMangaAura ? 'text-[var(--primary)]' : ''}`}>
              {card.platform.name}
            </span>
            {card.platform.isMangaAura && <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />}
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
            {t(`comparison.${card.descKey}`)}
          </p>
          <div className="flex flex-wrap gap-1.5">
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
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all duration-200 hover:border-[var(--primary)]/20"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left font-medium text-sm transition-colors hover:bg-[var(--surface-sunken)]/50"
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
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[var(--primary)]/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[var(--accent-purple)]/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--primary)]/[0.02] blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent-purple)]/20 text-[var(--primary)] border border-[var(--primary)]/20 mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              {t('comparison.heroBadge')}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {t('comparison.heroTitle')}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
              {t('comparison.heroSubtitle')}
            </p>
          </motion.div>

          {/* Platform badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {PLATFORMS.map((pf) => (
              <PlatformBadge key={pf.id} platform={pf} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Platform Summaries ── */}
      <section className="pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <PlatformSummaryCards t={t} />
        </div>
      </section>

      {/* ── Reader Features Table ── */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            badge={t('comparison.forReaders')}
            title={t('comparison.readerSectionTitle')}
            subtitle={t('comparison.readerSectionSubtitle')}
            icon={BookOpen}
          />
          <ComparisonTable
            features={READER_FEATURES}
            t={t}
            badge={t('comparison.forReaders')}
          />
        </div>
      </section>

      {/* ── Creator Features Table ── */}
      <section className="py-12 md:py-16 bg-[var(--surface-sunken)]/30 border-y border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            badge={t('comparison.forCreators')}
            title={t('comparison.creatorSectionTitle')}
            subtitle={t('comparison.creatorSectionSubtitle')}
            icon={Wand2}
          />
          <ComparisonTable
            features={CREATOR_FEATURES}
            t={t}
            badge={t('comparison.forCreators')}
          />
        </div>
      </section>

      {/* ── MangaAura Advantages ── */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeading
            title={t('comparison.advantagesTitle')}
            subtitle={t('comparison.advantagesSubtitle')}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Wand2, key: 'advantageAI' },
              { icon: Trophy, key: 'advantageGamification' },
              { icon: Coins, key: 'advantageCrowdfunding' },
              { icon: Gift, key: 'advantageAura' },
              { icon: Smartphone, key: 'advantagePWA' },
              { icon: Users, key: 'advantageCommunity' },
            ].map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="flex gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <item.icon className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold mb-0.5">{t(`comparison.${item.key}`)}</h4>
                  <p className="text-xs text-[var(--text-muted)]">{t(`comparison.${item.key}Desc`)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 md:py-16 bg-[var(--surface-sunken)]/30 border-y border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeading
            badge="FAQ"
            title={t('comparison.faqTitle')}
            subtitle={t('comparison.faqSubtitle')}
            icon={HelpCircle}
          />
          <FaqAccordion t={t} />
        </div>
      </section>

      {/* ── Legend ── */}
      <section className="py-8">
        <div className="max-w-2xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-[var(--primary)]/15 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-[var(--primary)]" />
              </div>
              {t('comparison.yes')}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-yellow-500/15 flex items-center justify-center">
                <Minus className="w-2.5 h-2.5 text-yellow-500" />
              </div>
              {t('comparison.limited')}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-[var(--border-subtle)] flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-[var(--text-muted)]" />
              </div>
              {t('comparison.no')}
            </div>
          </div>
          <p className="text-center text-xs text-[var(--text-muted)] mt-4">
            {t('comparison.footerText')}
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-r from-[var(--primary)]/10 via-[var(--accent-purple)]/10 to-[var(--accent-blue)]/10 border border-[var(--primary)]/20 p-8 md:p-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {t('comparison.ctaTitle')}
            </h2>
            <p className="text-[var(--text-secondary)] mb-6 max-w-lg mx-auto">
              {t('comparison.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/register">
                <Button variant="default" size="lg" className="gap-2">
                  {t('comparison.ctaButton')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg">
                  {t('comparison.ctaExplore')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
