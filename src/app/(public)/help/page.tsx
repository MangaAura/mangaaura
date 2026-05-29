'use client';

import {
  HelpCircle,
  Search,
  BookOpen,
  Shield,
  CreditCard,
  Users,
  Palette,
  ChevronDown,
  MessageSquare,
  Mail,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ayuda | MangaAura',
  description: 'Encuentra respuestas a tus preguntas sobre MangaAura. Guías, tutoriales y soporte.',
  openGraph: {
    title: 'Ayuda | MangaAura',
    description: 'Encuentra respuestas a tus preguntas sobre MangaAura. Guías, tutoriales y soporte.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ayuda | MangaAura',
    description: 'Encuentra respuestas a tus preguntas sobre MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/help' },
};
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const answerId = `faq-answer-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        id={buttonId}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={answerId}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[var(--surface-elevated)] transition-colors"
      >
        <span className="text-sm font-medium text-[var(--text-primary)] pr-4">{question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <div id={answerId} className="px-5 pb-4 pt-0">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const t = useT();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('general');

  const faqCategories = [
    {
      id: 'general',
      title: t('help.categories.general'),
      icon: HelpCircle,
      questions: [
        { q: t('help.faq.general.whatIsMangaAura.q'), a: t('help.faq.general.whatIsMangaAura.a') },
        { q: t('help.faq.general.isItFree.q'), a: t('help.faq.general.isItFree.a') },
        { q: t('help.faq.general.howToCreateAccount.q'), a: t('help.faq.general.howToCreateAccount.a') },
      ],
    },
    {
      id: 'reading',
      title: t('help.categories.reading'),
      icon: BookOpen,
      questions: [
        { q: t('help.faq.reading.saveProgress.q'), a: t('help.faq.reading.saveProgress.a') },
        { q: t('help.faq.reading.offline.q'), a: t('help.faq.reading.offline.a') },
        { q: t('help.faq.reading.changeMode.q'), a: t('help.faq.reading.changeMode.a') },
      ],
    },
    {
      id: 'community',
      title: t('help.categories.community'),
      icon: Users,
      questions: [
        { q: t('help.faq.community.followUsers.q'), a: t('help.faq.community.followUsers.a') },
        { q: t('help.faq.community.howClansWork.q'), a: t('help.faq.community.howClansWork.a') },
        { q: t('help.faq.community.reportContent.q'), a: t('help.faq.community.reportContent.a') },
      ],
    },
    {
      id: 'creators',
      title: t('help.categories.creators'),
      icon: Palette,
      questions: [
        { q: t('help.faq.creators.publishManga.q'), a: t('help.faq.creators.publishManga.a') },
        { q: t('help.faq.creators.monetize.q'), a: t('help.faq.creators.monetize.a') },
        { q: t('help.faq.creators.formats.q'), a: t('help.faq.creators.formats.a') },
      ],
    },
    {
      id: 'account',
      title: t('help.categories.account'),
      icon: CreditCard,
      questions: [
        { q: t('help.faq.account.recoverPassword.q'), a: t('help.faq.account.recoverPassword.a') },
        { q: t('help.faq.account.whatAreAura.q'), a: t('help.faq.account.whatAreAura.a') },
        { q: t('help.faq.account.deleteAccount.q'), a: t('help.faq.account.deleteAccount.a') },
      ],
    },
    {
      id: 'safety',
      title: t('help.categories.safety'),
      icon: Shield,
      questions: [
        { q: t('help.faq.safety.dataProtection.q'), a: t('help.faq.safety.dataProtection.a') },
        { q: t('help.faq.safety.blockUser.q'), a: t('help.faq.safety.blockUser.a') },
        { q: t('help.faq.safety.harassment.q'), a: t('help.faq.safety.harassment.a') },
      ],
    },
  ];

  const quickLinks = [
    { name: t('help.quickLinks.contact'), href: '/contact', icon: Mail, desc: t('help.quickLinks.contactDesc') },
    { name: t('help.quickLinks.report'), href: '/report', icon: Shield, desc: t('help.quickLinks.reportDesc') },
    { name: t('help.quickLinks.terms'), href: '/legal/terms', icon: FileText, desc: t('help.quickLinks.termsDesc') },
  ];

  const filteredFAQs = faqCategories
    .filter((cat) => cat.id === activeCategory)
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          !searchQuery ||
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }));

  const totalResults = filteredFAQs.reduce((acc, cat) => acc + cat.questions.length, 0);

  return (
    <Container className="py-12">
      <PageHeader
        title={t('help.title')}
        description={t('help.description')}
        icon={<HelpCircle className="w-8 h-8" />}
      />

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 text-center hover:border-[var(--primary)]/30 hover:bg-[var(--surface-elevated)] transition-all group"
              >
                <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-3 text-[var(--primary)] group-hover:bg-[var(--primary)]/20 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="font-semibold text-[var(--text-primary)] text-sm">{link.name}</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{link.desc}</p>
              </Link>
            );
          })}
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('help.searchPlaceholder')}
            aria-label={t('help.searchAria')}
            className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {faqCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activeCategory === cat.id
                    ? 'bg-[var(--primary)] text-[var(--text-inverse)]'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.title}
              </button>
            );
          })}
        </div>

        {searchQuery && (
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {t('help.resultsCount', { count: totalResults })} &ldquo;{searchQuery}&rdquo;
          </p>
        )}

        <div className="space-y-3">
          {filteredFAQs.map((cat) =>
            cat.questions.length > 0 ? (
              <div key={cat.id} className="space-y-3">
                {cat.questions.map((faq, i) => (
                  <FAQItem key={i} question={faq.q} answer={faq.a} index={i} />
                ))}
              </div>
            ) : (
              <div key={cat.id} className="text-center py-12">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
                <p className="text-[var(--text-secondary)]">
                  {t('help.noResults')} &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[var(--primary)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {t('help.notFound')}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {t('help.notFoundDesc')}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] font-medium rounded-xl transition-colors"
          >
            <Mail className="w-4 h-4" />
            {t('help.contactSupport')}
          </Link>
        </div>
      </div>
    </Container>
  );
}
