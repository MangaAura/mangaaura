'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Users, BookOpen, Heart, Zap, Shield, Star, Globe, ChevronRight, MessageCircle } from 'lucide-react';
import React, { useRef } from 'react';

import { Container } from '@/components/Layout/Container';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

interface TeamMember {
  name: string;
  role: string;
  description: string;
  avatar: string;
  accent: string;
}

interface Value {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Kenji Nakamura',
    role: 'Founder & CEO',
    description: 'Ex-editor at Shonen Jump with 15 years experience. Passionate about connecting creators with readers worldwide.',
    avatar: 'KN',
    accent: 'from-violet-500 to-purple-600'
  },
  {
    name: 'Luna Martinez',
    role: 'Head of Creator Platform',
    description: 'Former indie manga artist turned platform architect. Built tools used by 2000+ creators on the platform.',
    avatar: 'LM',
    accent: 'from-pink-500 to-rose-600'
  },
  {
    name: 'Alex Chen',
    role: 'Lead Engineer',
    description: 'Open source contributor and manga enthusiast. Makes the reading experience smooth as silk.',
    avatar: 'AC',
    accent: 'from-cyan-500 to-blue-600'
  },
  {
    name: 'Yuki Tanaka',
    role: 'Community Director',
    description: 'Runs the largest manga Discord server (50k+ members). Fluent in community building and creator relations.',
    avatar: 'YT',
    accent: 'from-amber-500 to-orange-600'
  }
];

const values: Value[] = [
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'For Creators',
    description: 'Powerful tools to publish, monetize, and grow your audience. Keep 80% of your earnings.',
    accent: 'violet'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'For Readers',
    description: 'Ad-free reading, offline downloads, and a community that celebrates manga culture.',
    accent: 'pink'
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'AI Enhanced',
    description: 'Smart translations, auto-tagging, and personalized recommendations powered by AI.',
    accent: 'cyan'
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Creator First',
    description: 'Fair compensation, transparent algorithms, and direct fan support without intermediaries.',
    accent: 'rose'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Safe Space',
    description: 'Zero tolerance for content theft. DMCA protection and robust moderation for everyone.',
    accent: 'emerald'
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Global Community',
    description: 'Connect with manga fans from 150+ countries. Multilingual support and local events.',
    accent: 'blue'
  }
];

function HeroSection() {
  const t = useT();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-sunken)] via-[var(--background)] to-[var(--background)]" />
      
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-[var(--primary)] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-40 right-[15%] w-96 h-96 bg-accent-purple rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-[30%] w-80 h-80 bg-accent-blue rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 w-full">
        <Container className="py-20">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-full text-sm font-medium text-[var(--primary)]">
                <Star className="w-4 h-4" />
                Since 2023 — Building the Future of Manga
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[var(--text-primary)] via-[var(--primary)] to-accent-purple bg-clip-text text-transparent">
                {t('about.hero.title')}
              </span>
              <br />
              <span className="text-[var(--text-primary)]">
                {t('about.hero.subtitle')}
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('about.hero.description')}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#story"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-accent-purple text-[var(--text-inverse)] font-bold rounded-xl hover:opacity-90 transition-all hover:scale-105"
              >
                {t('about.hero.cta')}
                <ChevronRight className="w-5 h-5" />
              </a>
              <a
                href="#team"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--surface-elevated)] transition-all"
              >
                <Users className="w-5 h-5" />
                {t('about.hero.ctaTeam')}
              </a>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-16 flex items-center justify-center gap-8 text-[var(--text-muted)]">
              <div className="flex items-center justify-center gap-8 bg-[var(--surface-elevated)]/80 rounded-xl px-8 py-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--text-primary)]">500K+</div>
                  <div className="text-sm text-[var(--text-secondary)]">{t('about.stats.readers')}</div>
                </div>
                <div className="w-px h-12 bg-[var(--border)]" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--text-primary)]">2,000+</div>
                  <div className="text-sm text-[var(--text-secondary)]">{t('about.stats.creators')}</div>
                </div>
                <div className="w-px h-12 bg-[var(--border)]" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--text-primary)]">50K+</div>
                  <div className="text-sm text-[var(--text-secondary)]">{t('about.stats.manga')}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
    </section>
  );
}

function StorySection() {
  const t = useT();

  return (
    <section id="story" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--surface)]" />
      
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="grid lg:grid-cols-2 gap-16 items-center"
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] mb-4">
              <BookOpen className="w-4 h-4" />
              {t('about.story.badge')}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-[var(--text-primary)]">
              {t('about.story.title')}
            </h2>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>
                {t('about.story.p1')}
              </p>
              <p>
                {t('about.story.p2')}
              </p>
              <p>
                {t('about.story.p3')}
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-accent-purple/20 rounded-3xl blur-3xl" />
            <div className="relative bg-[var(--surface-elevated)] border border-[var(--border)] rounded-3xl p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface-sunken)] rounded-2xl p-6 text-center">
                  <Zap className="w-8 h-8 text-[var(--primary)] mx-auto mb-3" />
                  <div className="font-bold text-[var(--text-primary)]">{t('about.story.feature1.title')}</div>
                  <div className="text-sm text-[var(--text-muted)]">{t('about.story.feature1.desc')}</div>
                </div>
                <div className="bg-[var(--surface-sunken)] rounded-2xl p-6 text-center">
                  <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                  <div className="font-bold text-[var(--text-primary)]">{t('about.story.feature2.title')}</div>
                  <div className="text-sm text-[var(--text-muted)]">{t('about.story.feature2.desc')}</div>
                </div>
                <div className="bg-[var(--surface-sunken)] rounded-2xl p-6 text-center">
                  <Sparkles className="w-8 h-8 text-pink-500 mx-auto mb-3" />
                  <div className="font-bold text-[var(--text-primary)]">{t('about.story.feature3.title')}</div>
                  <div className="text-sm text-[var(--text-muted)]">{t('about.story.feature3.desc')}</div>
                </div>
                <div className="bg-[var(--surface-sunken)] rounded-2xl p-6 text-center">
                  <Heart className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                  <div className="font-bold text-[var(--text-primary)]">{t('about.story.feature4.title')}</div>
                  <div className="text-sm text-[var(--text-muted)]">{t('about.story.feature4.desc')}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

function TeamSection() {
  const t = useT();

  return (
    <section id="team" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--background)]" />
      
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] mb-4">
              <Users className="w-4 h-4" />
              {t('about.team.badge')}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              {t('about.team.title')}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              {t('about.team.subtitle')}
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {teamMembers.map((member) => (
            <motion.div
              key={member.name}
              variants={fadeInUp}
              className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--primary)]/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={cn(
                'w-16 h-16 rounded-2xl bg-gradient-to-br mb-4 flex items-center justify-center text-xl font-bold text-white',
                member.accent
              )}>
                {member.avatar}
              </div>
              <h3 className="font-bold text-lg text-[var(--text-primary)] mb-1">{member.name}</h3>
              <div className="text-sm text-[var(--primary)] mb-3">{member.role}</div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{member.description}</p>
              
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 to-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

function ValuesSection() {
  const t = useT();

  const getAccentColor = (accent: string) => {
    const colors: Record<string, string> = {
      violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
      pink: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      cyan: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };
    return colors[accent] || colors.violet;
  };

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--surface)]" />
      
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--primary)] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent-purple rounded-full blur-[120px]" />
      </div>

      <Container className="relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] mb-4">
              <Star className="w-4 h-4" />
              {t('about.values.badge')}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              {t('about.values.title')}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              {t('about.values.subtitle')}
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {values.map((value) => (
            <motion.div
              key={value.title}
              variants={fadeInUp}
              className={cn(
                'group relative bg-[var(--surface-elevated)] border rounded-2xl p-6 hover:shadow-lg transition-all duration-300',
                'hover:-translate-y-1'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mb-4 border',
                getAccentColor(value.accent)
              )}>
                {value.icon}
              </div>
              <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">{value.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

function CTASection() {
  const t = useT();

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--background)]" />
      
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-accent-purple/10" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />
      </div>

      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="relative max-w-3xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp} className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--primary)] to-accent-purple mb-6">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              {t('about.cta.title')}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
              {t('about.cta.description')}
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-accent-purple text-[var(--text-inverse)] font-bold rounded-xl hover:opacity-90 transition-all hover:scale-105"
            >
              {t('about.cta.join')}
              <ChevronRight className="w-5 h-5" />
            </a>
            <a
              href="/discover"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--surface-elevated)] transition-all"
            >
              <BookOpen className="w-5 h-5" />
              {t('about.cta.explore')}
            </a>
          </motion.div>

          <motion.p variants={fadeInUp} className="mt-8 text-sm text-[var(--text-muted)]">
            {t('about.cta.note')}
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}

export default function AboutClient() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <StorySection />
      <TeamSection />
      <ValuesSection />
      <CTASection />
    </div>
  );
}
