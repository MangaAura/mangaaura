'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';

import { Container } from '@/components/Layout/Container';
import { useT } from '@/i18n';

const ruleVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function CommunityRulesClient() {
  const t = useT();
  const isReduced = useReducedMotion() ?? false;

  const rules: string[] = [
    t('community.rulesList.0'),
    t('community.rulesList.1'),
    t('community.rulesList.2'),
    t('community.rulesList.3'),
    t('community.rulesList.4'),
    t('community.rulesList.5'),
    t('community.rulesList.6'),
    t('community.rulesList.7'),
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[var(--primary)]/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[var(--accent-purple)]/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--primary)]/[0.02] blur-3xl" />
        </div>

        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent-purple)]/20 text-[var(--primary)] border border-[var(--primary)]/20 mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              {t('community.rulesTitle')}
            </span>
            <div className="flex items-center justify-center gap-3 mb-3">
              <ShieldCheck className="text-[var(--primary)]" size={40} aria-hidden="true" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t('community.rulesTitle')}
              </h1>
            </div>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              {t('community.rulesDesc')}
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Rules List */}
      <section className="pb-16 md:pb-20">
        <Container size="small">
          <div className="space-y-4">
            {rules.map((rule, idx) => (
              <motion.div
                key={idx}
                custom={idx}
                variants={ruleVariants}
                initial={isReduced ? undefined : 'hidden'}
                whileInView={isReduced ? undefined : 'visible'}
                viewport={{ once: true, margin: '-40px' }}
                className="flex items-start gap-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--primary)]/30 hover:shadow-md transition-all duration-300 group"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                  {idx + 1}
                </span>
                <p className="text-[var(--text-primary)] leading-relaxed pt-0.5">
                  {rule}
                </p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
