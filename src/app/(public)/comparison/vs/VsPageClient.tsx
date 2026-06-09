'use client';

import {
  motion,
  useReducedMotion,
  type Variants,
} from 'framer-motion';import { Sparkles, X, Minus, Check, ArrowRight, BookOpen, Wand2, Users, BarChart3, Coins, Globe, Smartphone,
  Zap,
  Shield,
  Gift,
  Trophy,
  Languages,
  Download,
  Crown,
  Layout as LayoutIcon,
  ExternalLink,
  ThumbsUp,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n';
import { PLATFORM_LOGOS } from '../components/PlatformLogos';

// ── Types ─────────────────────────────────────────────

export interface PlatformData {
  id: string;
  name: string;
  url: string;
  color: string;
  tagline: string;
  bestFor: string;
  advantages: string[];
  tradeoffs: { label: string; text: string }[];
  features: Record<string, 'yes' | 'no' | 'limited'>;
}

export interface VsPageClientProps {
  competitor: PlatformData;
  mangaAura: PlatformData;
  slug: string;
}

// ── Feature definitions ───────────────────────────────

const FEATURE_META: { key: string; icon: React.ComponentType<{ className?: string }>; i18nKey: string }[] = [
  { key: 'freeReading', icon: BookOpen, i18nKey: 'comparison.feature.freeReading' },
  { key: 'offlineReading', icon: Download, i18nKey: 'comparison.feature.offlineReading' },
  { key: 'pwaMobile', icon: Smartphone, i18nKey: 'comparison.feature.pwa' },
  { key: 'aiRecommendations', icon: Zap, i18nKey: 'comparison.feature.aiRecs' },
  { key: 'progressSync', icon: LayoutIcon, i18nKey: 'comparison.feature.syncProgress' },
  { key: 'gamification', icon: Trophy, i18nKey: 'comparison.feature.gamification' },
  { key: 'community', icon: Users, i18nKey: 'comparison.feature.community' },
  { key: 'adFree', icon: Shield, i18nKey: 'comparison.feature.adFree' },
  { key: 'multiLanguage', icon: Globe, i18nKey: 'comparison.feature.multiLanguage' },
  { key: 'openPublishing', icon: BookOpen, i18nKey: 'comparison.feature.openPublishing' },
  { key: 'aiArtTools', icon: Wand2, i18nKey: 'comparison.feature.aiArt' },
  { key: 'aiTranslation', icon: Languages, i18nKey: 'comparison.feature.aiTranslate' },
  { key: 'creatorAnalytics', icon: BarChart3, i18nKey: 'comparison.feature.analytics' },
  { key: 'directFunding', icon: Coins, i18nKey: 'comparison.feature.directFunding' },
  { key: 'crowdfunding', icon: Gift, i18nKey: 'comparison.feature.crowdfunding' },
  { key: 'revenueShare', icon: Crown, i18nKey: 'comparison.feature.revenueShare' },
];

// ── Sub-components ────────────────────────────────────

function ValueBadge({ value }: { value: string }) {
  if (value === 'yes') {
    return (                <motion.div whileHover={{ scale: 1.2 }} className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-200">
        <Check className="w-4 h-4 text-emerald-500" />
      </motion.div>
    );
  }
  if (value === 'limited') {
    return (                <motion.div whileHover={{ scale: 1.2 }} className="w-7 h-7 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-200">
        <Minus className="w-4 h-4 text-yellow-500" />
      </motion.div>
    );
  }
  return (        <motion.div whileHover={{ scale: 1.2 }} className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-200">
      <X className="w-4 h-4 text-red-400" />
    </motion.div>
  );
}

function PlatformIcon({ name, color, size = 'md', platformId }: { name: string; color: string; size?: 'sm' | 'md' | 'lg'; platformId?: string }) {
  const dims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  const LogoComponent = platformId ? PLATFORM_LOGOS[platformId] : null;
  if (LogoComponent) {
    return (
      <div className={`${dims} flex-shrink-0`}>
        <LogoComponent className="w-full h-full" />
      </div>
    );
  }
  return (
    <div className={`${dims} rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <span className="font-bold text-white">{name.charAt(0)}</span>
    </div>
  );
}

// ── Variants ──────────────────────────────────────────

const staggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ── Main Component ────────────────────────────────────

export default function VsPageClient({ competitor, mangaAura, slug }: VsPageClientProps) {
  const t = useT();
  const isReduced = useReducedMotion() ?? false;

  const allFeatures = FEATURE_META;
  const vsTitle = t(`page.comparison.vs.${slug}.title`) || `${t('nav.comparison')}: MangaAura vs ${competitor.name}`;
  const vsDescription = t(`page.comparison.vs.${slug}.description`) || `Comparativa detallada entre MangaAura y ${competitor.name}. ${competitor.bestFor}`;

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[var(--primary)]/5 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[var(--accent-purple)]/5 blur-3xl"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent-purple)]/20 text-[var(--primary)] border border-[var(--primary)]/20 mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              {t('comparison.heroBadge')}
            </span>

            {/* VS header */}
            <div className="flex items-center justify-center gap-4 md:gap-10 mb-4">
              <div className="flex flex-col items-center gap-2">
                <PlatformIcon name="MangaAura" color="from-primary to-accent-purple" size="lg" platformId="mangaaura" />
                <span className="text-lg md:text-xl font-bold">MangaAura</span>
              </div>
              <div className="text-2xl md:text-4xl font-black text-[var(--text-muted)]">VS</div>
              <div className="flex flex-col items-center gap-2">
                <PlatformIcon name={competitor.name} color={competitor.color} size="lg" platformId={competitor.id} />
                <span className="text-lg md:text-xl font-bold">{competitor.name}</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight max-w-4xl mx-auto">
              {vsTitle}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
              {vsDescription}
            </p>
          </motion.div>

          {/* Quick verdict */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/15 text-sm font-medium"
          >
            <ThumbsUp className="w-4 h-4 text-[var(--primary)]" />
            {t('comparison.bestFor')}: {competitor.bestFor}
          </motion.div>
        </div>
      </section>

      {/* ── Feature Comparison Table ── */}
      <section className="py-12 md:py-16 bg-[var(--surface-sunken)]/30 border-y border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">                <motion.span
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)] mb-4"
            >
              <BarChart3 className="w-3 h-3" />
              {t('comparison.forReaders')} &amp; {t('comparison.forCreators')}
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t('comparison.readerSectionTitle')}</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">{t('comparison.readerSectionSubtitle')}</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-[var(--border)]">
                  <th className="text-left py-4 px-4 w-[220px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('comparison.featureLabel')}</span>
                  </th>
                  <th className="py-3 px-3 text-center">
                    <span className="text-sm font-bold text-[var(--primary)]">MangaAura</span>
                  </th>
                  <th className="py-3 px-3 text-center">
                    <span className="text-sm font-bold">{competitor.name}</span>
                  </th>
                </tr>
              </thead>
              <motion.tbody
                variants={isReduced ? undefined : staggerVariants}
                initial={isReduced ? undefined : 'hidden'}
                whileInView={isReduced ? undefined : 'visible'}
                viewport={{ once: true, margin: '-40px' }}
              >
                {allFeatures.map((feature) => (
                  <motion.tr
                    key={feature.key}
                    variants={itemVariants}
                    className="border-b border-[var(--border-subtle)] last:border-b-0 group hover:bg-[var(--primary)]/[0.03] transition-all duration-200"
                  >
                    <td className="py-3 px-4 relative after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:w-0.5 after:h-0 after:bg-[var(--primary)] after:rounded-full after:transition-all after:duration-200 group-hover:after:h-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:from-[var(--primary)]/20 group-hover:to-[var(--accent-purple)]/20 transition-all duration-300">
                          <feature.icon className="w-3.5 h-3.5 text-[var(--primary)]" />
                        </div>
                        <span className="text-sm font-medium">{t(feature.i18nKey)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <ValueBadge value={mangaAura.features[feature.key] || 'no'} />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <ValueBadge value={competitor.features[feature.key] || 'no'} />
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <Check className="w-3 h-3 text-emerald-500" /> {t('comparison.yes')}
            </span>
            <span className="flex items-center gap-2">
              <Minus className="w-3 h-3 text-yellow-500" /> {t('comparison.limited')}
            </span>
            <span className="flex items-center gap-2">
              <X className="w-3 h-3 text-red-400" /> {t('comparison.no')}
            </span>
          </div>
        </div>
      </section>

      {/* ── Key Differences ── */}
      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t('comparison.advantagesTitle')}</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">{t('comparison.advantagesSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* MangaAura advantages */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/[0.03] p-6 hover:shadow-[0_0_20px_-8px_var(--primary)] hover:border-[var(--primary)]/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 mb-4">
                <PlatformIcon name="MangaAura" color="from-primary to-accent-purple" size="sm" platformId="mangaaura" />
                <h3 className="text-lg font-bold">MangaAura</h3>
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <ul className="space-y-2.5">
                {mangaAura.advantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Competitor advantages */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:shadow-[0_0_20px_-8px_var(--border)] hover:border-[var(--border-subtle)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 mb-4">
                <PlatformIcon name={competitor.name} color={competitor.color} size="sm" platformId={competitor.id} />
                <h3 className="text-lg font-bold">{competitor.name}</h3>
              </div>
              <ul className="space-y-2.5">
                {competitor.advantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <Check className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Tradeoffs (neutral content for AI trust) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--primary)]/20 hover:shadow-[0_0_20px_-8px_var(--primary)] transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold">{t('comparison.tradeoffs') || 'Consideraciones objetivas'}</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {competitor.tradeoffs.map((tradeoff, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">{tradeoff.label}:</span>{' '}
                    {tradeoff.text}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-r from-[var(--primary)]/10 via-[var(--accent-purple)]/10 to-[var(--accent-blue)]/10 border border-[var(--primary)]/20 p-8 md:p-12 hover:shadow-[0_0_30px_-12px_var(--primary)] transition-all duration-300"
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
              <Link href="/comparison">
                <Button variant="outline" size="lg" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
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
