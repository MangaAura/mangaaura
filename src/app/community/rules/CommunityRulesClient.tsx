'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  ShieldCheck,
  Sparkles,
  MessageCircle,
  BookOpen,
  Heart,
  AlertTriangle,
  Scale,
} from 'lucide-react';

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

interface RuleCategory {
  icon: typeof ShieldCheck;
  label: string;
  color: string;
  iconBg: string;
  iconColor: string;
  borderHover: string;
  startIdx: number;
  count: number;
}

const categories: RuleCategory[] = [
  {
    icon: Heart,
    label: 'Convivencia',
    color: 'from-rose-500/20 to-pink-500/10',
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-500',
    borderHover: 'hover:border-rose-500/30',
    startIdx: 0,
    count: 2,
  },
  {
    icon: MessageCircle,
    label: 'Comunicación',
    color: 'from-sky-500/20 to-cyan-500/10',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-500',
    borderHover: 'hover:border-sky-500/30',
    startIdx: 2,
    count: 2,
  },
  {
    icon: BookOpen,
    label: 'Contenido',
    color: 'from-violet-500/20 to-purple-500/10',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-500',
    borderHover: 'hover:border-violet-500/30',
    startIdx: 4,
    count: 2,
  },
  {
    icon: Scale,
    label: 'Sanciones',
    color: 'from-amber-500/20 to-orange-500/10',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-500',
    borderHover: 'hover:border-amber-500/30',
    startIdx: 6,
    count: 2,
  },
];

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
              Normas de la comunidad
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

      {/* Rules by Category */}
      <section className="pb-16 md:pb-20">
        <Container size="small">
          <div className="space-y-10">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const catRules = rules.slice(cat.startIdx, cat.startIdx + cat.count);
              if (catRules.length === 0) return null;

              return (
                <div key={cat.label}>
                  {/* Category header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${cat.iconBg}`}>
                      <Icon className={`w-4 h-4 ${cat.iconColor}`} />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      {cat.label}
                    </h2>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
                      {cat.count} reglas
                    </span>
                  </div>

                  {/* Rules */}
                  <div className="space-y-3">
                    {catRules.map((rule, idx) => {
                      const globalIdx = cat.startIdx + idx;
                      return (
                        <motion.div
                          key={globalIdx}
                          custom={globalIdx}
                          variants={ruleVariants}
                          initial={isReduced ? undefined : 'hidden'}
                          whileInView={isReduced ? undefined : 'visible'}
                          viewport={{ once: true, margin: '-40px' }}
                          className={`
                            flex items-start gap-4 bg-[var(--surface)] border border-[var(--border)]
                            rounded-xl p-4 md:p-5
                            hover:shadow-md transition-all duration-300 group
                            ${cat.borderHover}
                          `}
                        >
                          <span
                            className={`
                              flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full
                              flex items-center justify-center text-xs md:text-sm font-bold
                              transition-transform duration-300 group-hover:scale-110
                              ${cat.iconBg} ${cat.iconColor}
                            `}
                          >
                            {globalIdx + 1}
                          </span>
                          <p className="text-sm md:text-base text-[var(--text-primary)] leading-relaxed pt-0.5">
                            {rule}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <motion.div
            initial={isReduced ? undefined : { opacity: 0, y: 10 }}
            whileInView={isReduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-10 p-5 rounded-xl bg-[var(--surface-sunken)]/30 border border-[var(--border)] text-center"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-tertiary)]">
              <AlertTriangle className="w-4 h-4" />
              <span>
                El incumplimiento de estas reglas puede resultar en sanciones,
                incluyendo la suspensión temporal o permanente de la cuenta.
              </span>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
