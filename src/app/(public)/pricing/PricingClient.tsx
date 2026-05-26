'use client';

import {
  motion,
  useReducedMotion,
  AnimatePresence,
  type Variants,
} from 'framer-motion';
import { Sparkles, Zap, Star, Crown, Shield, Gift, ArrowRight, Download, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n';

const packVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const planVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 * i, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

// Pricing data derived from src/lib/stripe.ts
const AURA_PACKS = [
  { id: 'aura_100', aura: 100, priceCents: 100, descKey: 'packBasicDesc', popular: false, icon: Gift },
  { id: 'aura_500', aura: 500, priceCents: 450, descKey: 'packPopularDesc', popular: true, icon: Zap, discount: '10%' },
  { id: 'aura_1000', aura: 1000, priceCents: 850, descKey: 'packBestValueDesc', popular: false, icon: Star, discount: '15%' },
  { id: 'aura_5000', aura: 5000, priceCents: 4000, descKey: 'packPremiumDesc', popular: false, icon: Crown, discount: '20%' },
];

const PREMIUM_PLANS = [
  {
    id: 'premium-monthly',
    nameKey: 'premiumMonthlyName',
    price: 4.99,
    periodKey: 'perMonth',
    descKey: 'premiumMonthlyDesc',
    featuresKey: 'premiumMonthlyFeatures',
    icon: Shield,
  },
  {
    id: 'premium-yearly',
    nameKey: 'premiumYearlyName',
    price: 49.99,
    periodKey: 'perYear',
    descKey: 'premiumYearlyDesc',
    featuresKey: 'premiumYearlyFeatures',
    icon: Crown,
    popular: true,
    savings: '$9.89',
  },
];

const FAQ_ITEMS = [
  { q: 'pricing.faq1Q', a: 'pricing.faq1A' },
  { q: 'pricing.faq2Q', a: 'pricing.faq2A' },
  { q: 'pricing.faq3Q', a: 'pricing.faq3A' },
  { q: 'pricing.faq4Q', a: 'pricing.faq4A' },
];

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function AuraValueBar({ aura, maxAura }: { aura: number; maxAura: number }) {
  const pct = (aura / maxAura) * 100;
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--border-subtle)] overflow-hidden mt-3">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]"
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
      />
    </div>
  );
}

function PricingCard({
  pack,
  index,
  t,
}: {
  pack: (typeof AURA_PACKS)[number];
  index: number;
  t: (key: string) => string;
}) {
  const Icon = pack.icon;
  const isReduced = useReducedMotion() ?? false;

  return (
    <motion.div
      custom={index}
      variants={packVariants}
      initial={isReduced ? undefined : 'hidden'}
      whileInView={isReduced ? undefined : 'visible'}
      viewport={{ once: true, margin: '-40px' }}
      className="relative group"
    >
      <div className="relative h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-300 hover:border-[var(--primary)]/40 hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:-translate-y-1">
        {pack.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white text-xs font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            {t('pricing.mostPopular')}
          </div>
        )}

        <div className={`flex items-center justify-between mb-4 ${pack.popular ? 'mt-2' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[var(--primary)]" />
          </div>
          {pack.discount && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--secondary)]/20 text-[var(--secondary)]">
              -{pack.discount}
            </span>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-bold mb-1">{pack.aura.toLocaleString()} Aura</h3>
          <p className="text-sm text-[var(--text-secondary)]">{t(`pricing.${pack.descKey}`)}</p>
        </div>

        <AuraValueBar aura={pack.aura} maxAura={5000} />

        <div className="flex items-baseline gap-1 mt-4 mb-5">
          <span className="text-3xl font-bold">{formatPrice(pack.priceCents)}</span>
          <span className="text-sm text-[var(--text-muted)]">USD</span>
        </div>

        <Link href={`/checkout?package=${pack.id}`}>
          <Button
            variant={pack.popular ? 'primary' : 'secondary'}
            className="w-full"
            size="sm"
          >
            {t('pricing.buy')}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

function PremiumCard({
  plan,
  index,
  t,
}: {
  plan: (typeof PREMIUM_PLANS)[number];
  index: number;
  t: (key: string) => string;
}) {
  const Icon = plan.icon;
  const isReduced = useReducedMotion() ?? false;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      custom={index}
      variants={planVariants}
      initial={isReduced ? undefined : 'hidden'}
      whileInView={isReduced ? undefined : 'visible'}
      viewport={{ once: true, margin: '-40px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <div
        className={`relative h-full rounded-2xl border-2 p-7 transition-all duration-300 ${
          plan.popular
            ? 'border-[var(--primary)] bg-[var(--primary)]/[0.04] shadow-lg shadow-[var(--primary)]/10 hover:shadow-xl hover:shadow-[var(--primary)]/15'
            : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/30 hover:shadow-md'
        }`}
      >
        {plan.popular && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white text-xs font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap">
            <Crown className="w-3 h-3" />
            {t('pricing.bestValue')}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 ${isHovered ? 'scale-110' : ''} ${
              plan.popular
                ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] text-white shadow-md'
                : 'bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 text-[var(--primary)]'
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>
          {plan.savings && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--secondary)]/20 text-[var(--secondary)]">
              {plan.savings}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold mb-1">{t(`pricing.${plan.nameKey}`)}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">{t(`pricing.${plan.descKey}`)}</p>

        <div className="flex items-baseline gap-1 mb-5">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className="text-sm text-[var(--text-muted)]">/{t(`pricing.${plan.periodKey}`)}</span>
        </div>

        <ul className="space-y-3 mb-6">
          {t(`pricing.${plan.featuresKey}`).split(',').map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <BadgeCheck className="w-4 h-4 mt-0.5 text-[var(--primary)] flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Link href={`/checkout?plan=${plan.id}`}>
          <Button
            variant={plan.popular ? 'primary' : 'outline'}
            className="w-full"
            size="sm"
          >
            {plan.popular ? t('pricing.subscribe') : t('pricing.choosePlan')}
          </Button>
        </Link>
      </div>
    </motion.div>
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
              <span>{t(item.q)}</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-5 h-5 flex items-center justify-center flex-shrink-0 ml-3 text-[var(--text-muted)]"
              >
                <ArrowRight className="w-4 h-4" />
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

function BenefitsRow({ t }: { t: (key: string) => string }) {
  const benefits = [
    { icon: Shield, titleKey: 'benefitSecure', descKey: 'benefitSecureDesc' },
    { icon: Zap, titleKey: 'benefitInstant', descKey: 'benefitInstantDesc' },
    { icon: Gift, titleKey: 'benefitNoExpiry', descKey: 'benefitNoExpiryDesc' },
    { icon: Download, titleKey: 'benefitNoCommitment', descKey: 'benefitNoCommitmentDesc' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
      {benefits.map((benefit, i) => {
        const Icon = benefit.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="text-center p-4 rounded-xl bg-[var(--surface-sunken)]/30 border border-[var(--border-subtle)]"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center mx-auto mb-3">
              <Icon className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <h4 className="text-sm font-bold mb-1">{t(`pricing.${benefit.titleKey}`)}</h4>
            <p className="text-xs text-[var(--text-muted)]">{t(`pricing.${benefit.descKey}`)}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

function SectionHeading({ label, title, subtitle }: { label?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10">
      {label && (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)] mb-4">
          {label}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-bold mb-3">{title}</h2>
      {subtitle && <p className="text-[var(--text-secondary)] max-w-xl mx-auto">{subtitle}</p>}
    </div>
  );
}

export default function PricingClient() {
  const t = useT();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20">
        {/* Background effects */}
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
              {t('pricing.heroBadge')}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {t('pricing.heroTitle').split(' ').map((word, i, arr) => {
                if (word === 'Aura') {
                  return <span key={i} className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] bg-clip-text text-transparent">Aura</span>;
                }
                if (word === 'Premium') {
                  return <span key={i} className="bg-gradient-to-r from-[var(--secondary)] to-[var(--accent-blue)] bg-clip-text text-transparent">Premium</span>;
                }
                return <span key={i}>{word}{i < arr.length - 1 ? ' ' : ''}</span>;
              })}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
              {t('pricing.heroSubtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <BenefitsRow t={t} />
          </motion.div>
        </div>
      </section>

      {/* Aura Packs */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeading
            label="Aura Packs"
            title={t('pricing.auraSectionTitle')}
            subtitle={t('pricing.auraSectionSubtitle')}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AURA_PACKS.map((pack, i) => (
              <PricingCard key={pack.id} pack={pack} index={i} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Premium */}
      <section className="py-16 md:py-20 bg-[var(--surface-sunken)]/30 border-y border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto px-6">
          <SectionHeading
            label="Premium"
            title={t('pricing.premiumSectionTitle')}
            subtitle={t('pricing.premiumSectionSubtitle')}
          />

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PREMIUM_PLANS.map((plan, i) => (
              <PremiumCard key={plan.id} plan={plan} index={i} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeading
            title={t('pricing.faqTitle')}
            subtitle={t('pricing.faqSubtitle')}
          />
          <FaqAccordion t={t} />
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-r from-[var(--primary)]/10 via-[var(--accent-purple)]/10 to-[var(--accent-blue)]/10 border border-[var(--primary)]/20 p-8 md:p-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {t('pricing.ctaTitle')}
            </h2>
            <p className="text-[var(--text-secondary)] mb-6 max-w-lg mx-auto">
              {t('pricing.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/register">
                <Button variant="primary" size="lg" className="gap-2">
                  {t('pricing.ctaButton')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg">
                  {t('pricing.ctaExplore')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
