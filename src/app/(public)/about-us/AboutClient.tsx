'use client';

import { Sparkles, Users, BookOpen, Heart, Zap, Shield, Star, Globe, ChevronRight, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { useT } from '@/i18n';

function StorySection() {
  const t = useT();

  return (
    <section id="story" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--surface)]" />

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] mb-4">
              <BookOpen className="w-4 h-4" />
              {t('about.story.badge')}
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-[var(--text-primary)]">
              {t('about.story.title')}
            </h2>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>{t('about.story.p1')}</p>
              <p>{t('about.story.p2')}</p>
              <p>{t('about.story.p3')}</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 rounded-3xl blur-3xl" />
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
          </div>
        </div>
      </Container>
    </section>
  );
}

function TeamValuesSection() {
  const t = useT();

  const values = [
    { icon: <BookOpen className="w-6 h-6" />, title: t('about.values.item1.title'), description: t('about.values.item1.desc'), iconClass: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
    { icon: <Users className="w-6 h-6" />, title: t('about.values.item2.title'), description: t('about.values.item2.desc'), iconClass: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
    { icon: <Sparkles className="w-6 h-6" />, title: t('about.values.item3.title'), description: t('about.values.item3.desc'), iconClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    { icon: <Heart className="w-6 h-6" />, title: t('about.values.item4.title'), description: t('about.values.item4.desc'), iconClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    { icon: <Shield className="w-6 h-6" />, title: t('about.values.item5.title'), description: t('about.values.item5.desc'), iconClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { icon: <Globe className="w-6 h-6" />, title: t('about.values.item6.title'), description: t('about.values.item6.desc'), iconClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  ];

  return (
    <>
      {/* Team */}
      <section id="team" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--background)]" />

        <Container className="relative z-10">
          <div className="text-center mb-16">
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
          </div>

          <div className="flex justify-center">
            <div className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--primary)]/30 transition-all duration-300 hover:-translate-y-1 max-w-sm w-full text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 bg-[var(--surface-sunken)] ring-2 ring-[var(--primary)]/20">
                <Image
                  src="https://yt3.googleusercontent.com/aA4_2r9_u47sSSMdky9XrHos-l-h8cgcGfOOI5ZOIhyMC9aT8u6kAp_kt5p9SYdn0I5bqKLk=s160-c-k-c0x00ffffff-no-rj"
                  alt={t('about.team.member.name')}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-bold text-lg text-[var(--text-primary)] mb-1">{t('about.team.member.name')}</h3>
              <div className="text-sm text-[var(--primary)] mb-3">{t('about.team.member.role')}</div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{t('about.team.member.desc')}</p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 to-[var(--accent-purple)]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--surface)]" />

        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--primary)] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[var(--accent-purple)] rounded-full blur-[120px]" />
        </div>

        <Container className="relative z-10">
          <div className="text-center mb-16">
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
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="group relative bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${value.iconClass}`}>
                  {value.icon}
                </div>
                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">{value.title}</h3>
                <div className="flex-1" />
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

function CTASection() {
  const t = useT();

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--background)]" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--accent-purple)]/10" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />
      </div>

      <Container>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] mb-6">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-[var(--text-primary)]">
              {t('about.cta.title')}
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
              {t('about.cta.description')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-[var(--text-inverse)] font-bold rounded-xl hover:opacity-90 transition-all hover:scale-105"
            >
              {t('about.cta.join')}
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--surface-elevated)] transition-all"
            >
              <BookOpen className="w-5 h-5" />
              {t('about.cta.explore')}
            </Link>
          </div>

          <p className="mt-8 text-sm text-[var(--text-muted)]">
            {t('about.cta.note')}
          </p>
        </div>
      </Container>
    </section>
  );
}

export default function AboutClient() {
  const t = useT();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent-purple)]/10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--primary)]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-purple)]/10 rounded-full blur-3xl pointer-events-none" />

      <Container className="relative z-10 py-12">
        <PageHeader
          title={t('about.hero.title') + ' ' + t('about.hero.subtitle')}
          description={t('about.hero.description')}
          icon={<Star className="w-8 h-8" />}
        />
      </Container>

      <StorySection />
      <TeamValuesSection />
      <CTASection />
    </div>
  );
}
